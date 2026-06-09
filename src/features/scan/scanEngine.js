/**
 * Document scan engine — image/PDF intake, enhancement, deskew, OCR, export.
 * Client-side only; vision OCR uses the unified /api/ai proxy.
 */

import { getAiProvider, getAiProxyEndpoint } from "../../aiProviders.js";
import {
  loadScript, withTimeout, loadImage, dataUrlParts, downloadBlob, escapeHtml, newPageId,
} from "./utils.js";

const CDN = {
  JSPDF: "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  // jsDelivr mirror — lebih stabil di production daripada docs.opencv.org
  OPENCV: "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@4.9.0-release.1/dist/opencv.js",
  JSCANIFY: "https://cdn.jsdelivr.net/gh/ColonelParrot/jscanify@master/src/jscanify.min.js",
  PDFJS: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  PDFJS_WORKER: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  TESS: "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.0/tesseract.min.js",
};

const LEGAL_OCR_PROMPT =
  "Anda adalah mesin OCR hukum profesional. Transkripsikan SELURUH teks dari gambar dokumen hukum Indonesia ini.\n\n" +
  "ATURAN:\n" +
  "1. Pertahankan struktur: judul, nomor surat, pasal/bab, daftar bernomor, tabel (gunakan | untuk kolom).\n" +
  "2. Tulis apa adanya — jangan menerjemahkan, menambah komentar, atau menganalisa.\n" +
  "3. Tandai teks yang tidak terbaca dengan [tidak terbaca].\n" +
  "4. Jika beberapa gambar, gabungkan berurutan dengan pemisah --- halaman ---.\n" +
  "5. Prioritaskan akurasi nama pihak, tanggal, nomor perkara, dan angka.";

/** Downscale large photos for faster OCR and smaller payloads. */
export async function downscaleDataUrl(dataUrl, maxDim = 2200) {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || 0;
  const h = img.naturalHeight || 0;
  if (!w || !h) return { dataUrl, w: 1000, h: 1414 };
  const scale = Math.min(1, maxDim / Math.max(w, h));
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const c = document.createElement("canvas");
  c.width = nw;
  c.height = nh;
  c.getContext("2d").drawImage(img, 0, 0, nw, nh);
  return { dataUrl: c.toDataURL("image/jpeg", 0.85), w: nw, h: nh };
}

/** Auto-enhance: grayscale + contrast stretch + mild sharpen for OCR. */
export async function enhancePage(dataUrl) {
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || 800;
  const h = img.naturalHeight || 1100;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);
  const id = ctx.getImageData(0, 0, w, h);
  const d = id.data;
  let min = 255;
  let max = 0;
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    gray[p] = g;
    if (g < min) min = g;
    if (g > max) max = g;
  }
  const range = Math.max(1, max - min);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) {
    const stretched = ((gray[p] - min) / range) * 255;
    const v = Math.max(0, Math.min(255, stretched * 1.05));
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }
  ctx.putImageData(id, 0, 0);
  return { dataUrl: c.toDataURL("image/jpeg", 0.9), w, h };
}

/** Quality score 0–100 from brightness & contrast heuristics. */
export async function assessPageQuality(dataUrl) {
  const img = await loadImage(dataUrl);
  const tw = Math.min(360, img.naturalWidth || 360);
  const th = Math.round((img.naturalHeight || 480) * (tw / (img.naturalWidth || 360)));
  const c = document.createElement("canvas");
  c.width = tw;
  c.height = th;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, tw, th);
  const { data } = ctx.getImageData(0, 0, tw, th);
  let sum = 0;
  let sumSq = 0;
  let edge = 0;
  const n = tw * th;
  const lum = new Float32Array(n);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    lum[p] = g;
    sum += g;
    sumSq += g * g;
  }
  const mean = sum / n;
  const variance = Math.max(0, sumSq / n - mean * mean);
  for (let y = 1; y < th - 1; y++) {
    for (let x = 1; x < tw - 1; x++) {
      const i = y * tw + x;
      const lap = Math.abs(4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - tw] - lum[i + tw]);
      edge += lap;
    }
  }
  const edgeAvg = edge / Math.max(1, (tw - 2) * (th - 2));
  let score = 100;
  if (mean < 75) score -= Math.min(35, (75 - mean) * 0.6);
  if (mean > 230) score -= 15;
  if (variance < 400) score -= 25;
  if (edgeAvg < 8) score -= 20;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const tier = score >= 75 ? "good" : score >= 50 ? "fair" : "poor";
  return { score, tier, mean: Math.round(mean), contrast: Math.round(variance) };
}

export async function fileToPage(file) {
  const raw = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result || ""));
    r.onerror = () => rej(new Error("Gagal membaca berkas."));
    r.readAsDataURL(file);
  });
  const d = await downscaleDataUrl(raw);
  const quality = await assessPageQuality(d.dataUrl);
  return {
    id: newPageId(),
    dataUrl: d.dataUrl,
    orig: d.dataUrl,
    enhanced: false,
    corrected: false,
    name: file.name || "halaman",
    w: d.w,
    h: d.h,
    quality,
  };
}

async function loadPdfJs() {
  await loadScript(CDN.PDFJS);
  const pdfjsLib = window.pdfjsLib || window["pdfjs-dist/build/pdf"];
  if (!pdfjsLib) throw new Error("Parser PDF gagal dimuat.");
  try { pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.PDFJS_WORKER; } catch { /* ignore */ }
  return pdfjsLib;
}

/** Rasterize PDF pages to scan images (max 25 pages). */
export async function pdfToPages(file, onProgress) {
  const pdfjsLib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const N = Math.min(pdf.numPages, 25);
  const pages = [];
  for (let p = 1; p <= N; p++) {
    const page = await pdf.getPage(p);
    const vp = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = vp.width;
    canvas.height = vp.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport: vp }).promise;
    const raw = canvas.toDataURL("image/jpeg", 0.88);
    const d = await downscaleDataUrl(raw);
    const quality = await assessPageQuality(d.dataUrl);
    pages.push({
      id: newPageId(),
      dataUrl: d.dataUrl,
      orig: d.dataUrl,
      enhanced: false,
      corrected: false,
      name: `${file.name || "pdf"} · hal ${p}`,
      w: d.w,
      h: d.h,
      quality,
      fromPdf: true,
    });
    if (onProgress) onProgress(Math.round((p / N) * 100), p, N);
  }
  return pages;
}

/** Try extract embedded text from PDF (digital PDFs). */
export async function extractPdfText(file, onProgress) {
  const pdfjsLib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let text = "";
  let chars = 0;
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const line = content.items.map((it) => it.str).join(" ");
    text += line + "\n\n";
    chars += line.length;
    if (onProgress) onProgress(Math.round((p / pdf.numPages) * 100));
  }
  return { text: text.trim(), pages: pdf.numPages, likelyScanned: chars < pdf.numPages * 40 };
}

let openCvReady = null;

/** Wait until OpenCV WASM runtime is fully initialized. */
function waitForOpenCvRuntime() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.cv?.Mat) return Promise.resolve(window.cv);

  return withTimeout(new Promise((resolve, reject) => {
    const finish = (cv) => {
      if (cv?.Mat) {
        window.cv = cv;
        resolve(cv);
      } else {
        reject(new Error("OpenCV gagal init."));
      }
    };

    const cv = window.cv;
    if (!cv) {
      reject(new Error("OpenCV tidak dimuat."));
      return;
    }

    if (cv.Mat) {
      finish(cv);
      return;
    }

    if (typeof cv.then === "function") {
      cv.then(finish).catch(() => reject(new Error("OpenCV gagal init.")));
      return;
    }

    const prev = cv.onRuntimeInitialized;
    cv.onRuntimeInitialized = () => {
      if (typeof prev === "function") prev();
      finish(window.cv);
    };

    const t0 = Date.now();
    (function poll() {
      if (window.cv?.Mat) {
        finish(window.cv);
        return;
      }
      if (Date.now() - t0 > 45000) {
        reject(new Error("OpenCV tidak siap (jaringan?)."));
        return;
      }
      setTimeout(poll, 150);
    })();
  }), 48000, "OpenCV terlalu lama dimuat.");
}

async function loadOpenCv() {
  if (openCvReady) return openCvReady;

  openCvReady = (async () => {
    if (!window.cv?.Mat) {
      await loadScript(CDN.OPENCV);
      await waitForOpenCvRuntime();
    }
    if (!window.jscanify) {
      await loadScript(CDN.JSCANIFY);
    }
    const Scanner = window.jscanify;
    if (!Scanner) throw new Error("jscanify gagal dimuat.");
    return { cv: window.cv, Scanner };
  })();

  try {
    return await openCvReady;
  } catch (e) {
    openCvReady = null;
    throw e;
  }
}

/** Draw image to canvas — cv.imread works more reliably with canvas than off-DOM img. */
function imageToCanvas(img) {
  const w = img.naturalWidth || img.width || 1;
  const h = img.naturalHeight || img.height || 1;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Fallback corner detection when jscanify contour fails (looser Canny). */
function findCornersFallback(cv, srcMat) {
  const gray = new cv.Mat();
  const blurred = new cv.Mat();
  const edges = new cv.Mat();
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  try {
    cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    cv.Canny(blurred, edges, 25, 120);
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    cv.dilate(edges, edges, kernel);
    kernel.delete();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let best = null;
    let bestArea = 0;
    const imgArea = srcMat.rows * srcMat.cols;
    for (let i = 0; i < contours.size(); i++) {
      const c = contours.get(i);
      const peri = cv.arcLength(c, true);
      const approx = new cv.Mat();
      cv.approxPolyDP(c, approx, 0.02 * peri, true);
      const area = cv.contourArea(approx);
      if (approx.rows === 4 && area > bestArea && area > imgArea * 0.12) {
        bestArea = area;
        best = approx;
      } else {
        approx.delete();
      }
    }

    if (!best) return null;

    const center = cv.minAreaRect(best).center;
    let tl = null;
    let tr = null;
    let bl = null;
    let br = null;
    let sTL = 0;
    let sTR = 0;
    let sBL = 0;
    let sBR = 0;
    for (let i = 0; i < best.data32S.length; i += 2) {
      const pt = { x: best.data32S[i], y: best.data32S[i + 1] };
      const d = dist(pt, center);
      if (pt.x < center.x && pt.y < center.y && d > sTL) { tl = pt; sTL = d; }
      else if (pt.x > center.x && pt.y < center.y && d > sTR) { tr = pt; sTR = d; }
      else if (pt.x < center.x && pt.y > center.y && d > sBL) { bl = pt; sBL = d; }
      else if (pt.x > center.x && pt.y > center.y && d > sBR) { br = pt; sBR = d; }
    }
    best.delete();
    if (!tl || !tr || !bl || !br) return null;
    return { topLeftCorner: tl, topRightCorner: tr, bottomLeftCorner: bl, bottomRightCorner: br };
  } finally {
    gray.delete();
    blurred.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}

function warpWithCorners(cv, srcMat, corners, outW, outH) {
  const dst = document.createElement("canvas");
  const dstMat = new cv.Mat();
  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    corners.topLeftCorner.x, corners.topLeftCorner.y,
    corners.topRightCorner.x, corners.topRightCorner.y,
    corners.bottomLeftCorner.x, corners.bottomLeftCorner.y,
    corners.bottomRightCorner.x, corners.bottomRightCorner.y,
  ]);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0, outW, 0, 0, outH, outW, outH,
  ]);
  const M = cv.getPerspectiveTransform(srcTri, dstTri);
  cv.warpPerspective(srcMat, dstMat, M, new cv.Size(outW, outH), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
  cv.imshow(dst, dstMat);
  srcTri.delete();
  dstTri.delete();
  M.delete();
  dstMat.delete();
  return dst;
}

function extractPaperRobust(Scanner, sourceEl, outW, outH) {
  const scanner = new Scanner();
  let result = scanner.extractPaper(sourceEl, outW, outH);
  if (result?.toDataURL) return result;

  const cv = window.cv;
  const srcMat = cv.imread(sourceEl);
  try {
    const corners = findCornersFallback(cv, srcMat);
    if (!corners) return null;
    return warpWithCorners(cv, srcMat, corners, outW, outH);
  } finally {
    srcMat.delete();
  }
}

export async function correctPage(page) {
  await loadOpenCv();
  const Scanner = window.jscanify;
  // Always prefer original capture for corner detection (enhance can break contours)
  const srcUrl = page.orig || page.dataUrl;
  const img = await loadImage(srcUrl);
  const canvas = imageToCanvas(img);
  const portrait = canvas.height >= canvas.width;
  const W = portrait ? 1240 : 1754;
  const H = portrait ? 1754 : 1240;

  let result = extractPaperRobust(Scanner, canvas, W, H);
  if (!result?.toDataURL) {
    result = extractPaperRobust(Scanner, img, W, H);
  }
  if (!result?.toDataURL) {
    throw new Error("Dokumen tidak terdeteksi — pastikan seluruh tepi kertas terlihat dengan latar kontras.");
  }

  const dataUrl = result.toDataURL("image/jpeg", 0.92);
  const quality = await assessPageQuality(dataUrl);
  return { dataUrl, w: W, h: H, quality };
}

export async function buildPdf(images, name) {
  if (!window.jspdf) await loadScript(CDN.JSPDF);
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) throw new Error("Pustaka PDF gagal dimuat.");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const PW = 210;
  const PH = 297;
  const M = 8;
  const AW = PW - M * 2;
  const AH = PH - M * 2;
  images.forEach((im, i) => {
    if (i > 0) doc.addPage();
    const aspect = (im.w || 1) / (im.h || 1);
    let w = AW;
    let h = AW / aspect;
    if (h > AH) { h = AH; w = AH * aspect; }
    const x = (PW - w) / 2;
    const y = (PH - h) / 2;
    const fmt = /png/i.test(dataUrlParts(im.dataUrl).media_type) ? "PNG" : "JPEG";
    try { doc.addImage(im.dataUrl, fmt, x, y, w, h); } catch { /* skip */ }
  });
  const safe = (name || "dokumen").replace(/[^a-z0-9]+/gi, "_");
  downloadBlob(doc.output("blob"), `Pindai_${safe}.pdf`);
}

export async function ocrVision(images, onProgress) {
  const ep = getAiProxyEndpoint();
  let out = "";
  const batchSize = 2;
  let done = 0;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const visionImages = [];
    batch.forEach((im) => {
      const p = dataUrlParts(im.dataUrl);
      if (p.data) visionImages.push({ mimeType: p.media_type, data: p.data });
    });
    const body = {
      provider: getAiProvider(),
      user: LEGAL_OCR_PROMPT,
      images: visionImages,
      maxTokens: 2400,
      responseFormat: "text",
    };
    const resp = await fetch(ep, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!resp.ok) throw new Error("AI Vision OCR HTTP " + resp.status);
    const data = await resp.json();
    out += String(data.text || "") + "\n\n";
    done += batch.length;
    if (onProgress) onProgress(Math.round((done / images.length) * 100));
  }
  return out.trim();
}

export async function ocrLocal(images, onProgress) {
  await loadScript(CDN.TESS);
  const T = window.Tesseract;
  if (!T?.recognize) throw new Error("OCR lokal gagal dimuat.");
  const N = images.length;
  let out = "";
  for (let i = 0; i < N; i++) {
    const mk = (lang) => T.recognize(images[i].dataUrl, lang, {
      logger: (m) => {
        if (m && typeof m.progress === "number" && onProgress) {
          const base = i / N;
          const span = 1 / N;
          onProgress(Math.min(99, Math.round((base + m.progress * span) * 100)));
        }
      },
    });
    let res;
    try {
      res = await withTimeout(mk("ind+eng"), 120000, "OCR lokal timeout (bahasa Indonesia).");
    } catch {
      res = await withTimeout(mk("eng"), 90000, "OCR lokal timeout.");
    }
    out += (res.data.text || "") + "\n\n";
    if (onProgress) onProgress(Math.round(((i + 1) / N) * 100));
  }
  return out.trim();
}

export async function runOcr(images, mode, onProgress) {
  if (mode === "local") return ocrLocal(images, onProgress);
  try {
    return await ocrVision(images, onProgress);
  } catch {
    if (onProgress) onProgress(0);
    return ocrLocal(images, onProgress);
  }
}

export function exportWord(text, name) {
  const body = escapeHtml(text).replace(/\n/g, "<br/>");
  const title = escapeHtml(name || "Dokumen");
  const html =
    `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' ` +
    `xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title>` +
    `<style>@page{size:A4;margin:2.4cm}body{font-family:'Times New Roman',serif;font-size:11.5pt;line-height:1.6;color:#000}</style></head><body>${body}</body></html>`;
  const safe = (name || "dokumen").replace(/[^a-z0-9]+/gi, "_");
  downloadBlob(new Blob(["\ufeff" + html], { type: "application/msword" }), `Pindai_${safe}.doc`);
}

/**
 * Smart pipeline: deskew → enhance (for OCR) → OCR.
 * Deskew must run on original color image before grayscale enhance.
 * @returns {{ text: string, pages: object[] }}
 */
export async function runSmartPipeline(pages, { mode, onStage, onProgress }) {
  const stage = (label, pct) => { if (onStage) onStage(label, pct); };
  let working = [...pages];
  let corrected = 0;

  stage("correct", 5);
  for (let i = 0; i < working.length; i++) {
    try {
      const r = await correctPage(working[i]);
      working[i] = { ...working[i], dataUrl: r.dataUrl, w: r.w, h: r.h, corrected: true, quality: r.quality };
      corrected++;
    } catch { /* keep original */ }
    if (onProgress) onProgress(Math.round(((i + 1) / working.length) * 30));
  }

  stage("enhance", 35);
  for (let i = 0; i < working.length; i++) {
    try {
      const r = await enhancePage(working[i].dataUrl);
      working[i] = {
        ...working[i],
        dataUrl: r.dataUrl,
        w: r.w,
        h: r.h,
        enhanced: true,
        quality: await assessPageQuality(r.dataUrl),
      };
    } catch { /* keep */ }
    if (onProgress) onProgress(35 + Math.round(((i + 1) / working.length) * 20));
  }

  stage("ocr", 55);
  const text = await runOcr(working, mode, (p) => {
    if (onProgress) onProgress(55 + Math.round(p * 0.4));
  });
  if (!text.trim()) throw new Error("Tidak ada teks yang terbaca.");

  stage("done", 100);
  return { text, pages: working, corrected };
}
