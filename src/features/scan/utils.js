/** Shared helpers for document scan feature */

export function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("no document"));
    const ex = document.querySelector(`script[data-knsl-scan="${src}"]`);
    if (ex) {
      if (ex.dataset.loaded) return resolve();
      if (ex.dataset.failed) return reject(new Error("Tidak dapat memuat dari jaringan: " + src));
      ex.addEventListener("load", () => resolve());
      ex.addEventListener("error", () => reject(new Error("load failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.knslScan = src;
    s.onload = () => { s.dataset.loaded = "1"; resolve(); };
    s.onerror = () => { s.dataset.failed = "1"; reject(new Error("Tidak dapat memuat dari jaringan: " + src)); };
    document.head.appendChild(s);
  });
}

export function withTimeout(promise, ms, msg) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error(msg || "Waktu pemrosesan habis.")), ms)),
  ]);
}

export function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar tidak terbaca."));
    img.src = dataUrl;
  });
}

export function dataUrlParts(dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || "");
  return m ? { media_type: m[1], data: m[2] } : { media_type: "image/jpeg", data: "" };
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function newPageId() {
  return "img_" + Math.random().toString(36).slice(2);
}
