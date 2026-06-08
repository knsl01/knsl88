import React, { useState, useRef, useCallback } from "react";
import {
  ScanLine, Upload, FileText, Download, Zap, Sparkles, Info, AlertTriangle,
  CheckCircle2, Trash2, Wand2, FileSearch, Scale, BookOpen, ChevronLeft, ChevronRight,
  Brain, RefreshCw, FileUp,
} from "lucide-react";
import { useI18n } from "../../i18n/I18nContext.jsx";
import {
  fileToPage, pdfToPages, extractPdfText, enhancePage, correctPage,
  buildPdf, runOcr, runSmartPipeline, exportWord, assessPageQuality,
} from "./scanEngine.js";
import { analyzeDocument, DOC_TYPE_ICONS } from "./scanIntelligence.js";

function QualityBadge({ quality, t }) {
  if (!quality) return null;
  const cls = quality.tier === "good" ? "scan-q-good" : quality.tier === "fair" ? "scan-q-fair" : "scan-q-poor";
  const label = quality.tier === "good" ? t("scan.qualityGood") : quality.tier === "fair" ? t("scan.qualityFair") : t("scan.qualityPoor");
  return <span className={`scan-quality ${cls}`} title={`${quality.score}%`}>{label}</span>;
}

export default function DocumentScan({ onSend }) {
  const { t, locale } = useI18n();
  const [pages, setPages] = useState([]);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState(0);
  const [progLabel, setProgLabel] = useState("");
  const [err, setErr] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState("ai");
  const [intel, setIntel] = useState(null);
  const [previewId, setPreviewId] = useState(null);
  const camRef = useRef(null);
  const galRef = useRef(null);
  const pdfRef = useRef(null);

  const preview = pages.find((p) => p.id === previewId) || pages[0] || null;

  const addImages = async (fileList) => {
    setErr("");
    const files = Array.from(fileList || []).filter((f) => /^image\//.test(f.type));
    if (!files.length) { setErr(t("scan.errImages")); return; }
    try {
      const imgs = await Promise.all(files.map(fileToPage));
      setPages((prev) => [...prev, ...imgs].slice(0, 30));
      if (!previewId && imgs[0]) setPreviewId(imgs[0].id);
    } catch (e) { setErr(e.message || t("scan.errLoad")); }
  };

  const addPdf = async (file) => {
    if (!file) return;
    setErr("");
    setBusy(true);
    setProg(0);
    setProgLabel(t("scan.pdfReading"));
    try {
      const extracted = await extractPdfText(file, (p) => setProg(p));
      if (!extracted.likelyScanned && extracted.text.length > 80) {
        setText(extracted.text);
        setProgLabel(t("scan.pdfTextDone"));
        setProg(100);
        setIntel(null);
      } else {
        setProgLabel(t("scan.pdfRasterize"));
        const imgs = await pdfToPages(file, (p) => setProg(p));
        setPages((prev) => [...prev, ...imgs].slice(0, 30));
        if (!previewId && imgs[0]) setPreviewId(imgs[0].id);
        if (!extracted.likelyScanned && extracted.text.length > 20) {
          setText(extracted.text);
        }
      }
    } catch (e) { setErr(e.message || t("scan.errPdf")); }
    setBusy(false);
  };

  const handleDrop = async (fileList) => {
    const files = Array.from(fileList || []);
    const pdfs = files.filter((f) => f.type === "application/pdf" || /\.pdf$/i.test(f.name));
    const imgs = files.filter((f) => /^image\//.test(f.type));
    if (pdfs.length) await addPdf(pdfs[0]);
    if (imgs.length) await addImages(imgs);
    if (!pdfs.length && !imgs.length) setErr(t("scan.errFiles"));
  };

  const removePage = (id) => {
    setPages((prev) => {
      const next = prev.filter((x) => x.id !== id);
      if (previewId === id) setPreviewId(next[0]?.id || null);
      return next;
    });
  };

  const revertPage = (id) => setPages((prev) => prev.map((x) => (
    x.id === id ? { ...x, dataUrl: x.orig, corrected: false, enhanced: false } : x
  )));

  const movePage = (idx, dir) => setPages((prev) => {
    const a = [...prev];
    const j = idx + dir;
    if (j < 0 || j >= a.length) return prev;
    [a[idx], a[j]] = [a[j], a[idx]];
    return a;
  });

  const enhanceOne = async (id) => {
    const page = pages.find((p) => p.id === id);
    if (!page) return;
    try {
      const r = await enhancePage(page.dataUrl);
      const quality = await assessPageQuality(r.dataUrl);
      setPages((prev) => prev.map((x) => (
        x.id === id ? { ...x, dataUrl: r.dataUrl, w: r.w, h: r.h, enhanced: true, quality } : x
      )));
    } catch (e) { setErr(e.message); }
  };

  const correctAll = async () => {
    if (!pages.length) return;
    setErr("");
    setBusy(true);
    setProg(0);
    setProgLabel(t("scan.correctLoading"));
    try {
      const next = [...pages];
      let fail = 0;
      let lastErr = "";
      for (let i = 0; i < next.length; i++) {
        setProgLabel(t("scan.correctPage", { n: i + 1, total: next.length }));
        try {
          const r = await correctPage(next[i]);
          next[i] = { ...next[i], dataUrl: r.dataUrl, w: r.w, h: r.h, corrected: true, quality: r.quality };
        } catch (e) {
          fail++;
          lastErr = e?.message || "";
        }
        setProg(Math.round(((i + 1) / next.length) * 100));
        setPages([...next]);
      }
      if (fail === next.length && lastErr) setErr(lastErr);
      if (fail === next.length) setErr(t("scan.correctFailAll"));
      else if (fail > 0) setErr(t("scan.correctFailSome", { n: fail }));
    } catch (e) { setErr(e.message || t("scan.correctFail")); }
    setBusy(false);
  };

  const downloadPdf = async () => {
    if (!pages.length) return;
    setErr("");
    setBusy(true);
    setProgLabel(t("scan.pdfBuilding"));
    setProg(50);
    try { await buildPdf(pages, "dokumen"); setProg(100); }
    catch (e) { setErr(e.message || t("scan.errPdfBuild")); }
    setBusy(false);
  };

  const runIntel = useCallback(async (ocrText) => {
    setProgLabel(t("scan.intelRunning"));
    try {
      const result = await analyzeDocument(ocrText, locale);
      setIntel(result);
    } catch { setIntel(null); }
  }, [locale]);

  const runOcrOnly = async () => {
    if (!pages.length) return;
    setErr("");
    setBusy(true);
    setProg(0);
    setIntel(null);
    try {
      setProgLabel(mode === "ai" ? t("scan.ocrAi") : t("scan.ocrLocal"));
      const result = await runOcr(pages, mode, setProg);
      if (!result.trim()) throw new Error(t("scan.errNoText"));
      setText(result);
      setProg(100);
      await runIntel(result);
    } catch (e) { setErr(e.message || t("scan.errOcr")); }
    setBusy(false);
  };

  const runSmart = async () => {
    if (!pages.length) return;
    setErr("");
    setBusy(true);
    setProg(0);
    setIntel(null);
    try {
      const { text: ocrText, pages: updated } = await runSmartPipeline(pages, {
        mode,
        onStage: (label) => {
          const map = {
            enhance: t("scan.stageEnhance"),
            correct: t("scan.stageCorrect"),
            ocr: t("scan.stageOcr"),
            done: t("scan.stageDone"),
          };
          setProgLabel(map[label] || label);
        },
        onProgress: setProg,
      });
      setPages(updated);
      setText(ocrText);
      await runIntel(ocrText);
    } catch (e) { setErr(e.message || t("scan.errSmart")); }
    setBusy(false);
  };

  const send = (target) => {
    if (!text.trim()) { setErr(t("scan.errNoSend")); return; }
    if (onSend) onSend(target, text, intel?.title || t("scan.resultName"));
  };

  const actionHint = intel?.recommendedAction;
  const docIcon = DOC_TYPE_ICONS[intel?.docType] || "📎";

  return (
    <div className="view-enter page scrollbar scan-page">
      <div className="scan-grid">
        {/* Left: capture */}
        <div className="scan-col-left">
          <div className="glass rise scan-panel">
            <div className="scan-panel-head">
              <ScanLine size={18} className="gold-text" />
              <h3 className="serif">{t("scan.title")}</h3>
            </div>
            <p className="scan-lead">{t("scan.lead")}</p>

            <div
              className={`scan-dropzone ${drag ? "scan-dropzone--active" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); handleDrop(e.dataTransfer.files); }}
            >
              <Upload size={24} className={drag ? "emerald-text" : "gold-text"} />
              <div className="scan-drop-label">{t("scan.dropLabel")}</div>
              <div className="scan-drop-actions">
                <button type="button" className="btn-primary" onClick={() => camRef.current?.click()}>
                  <ScanLine size={14} /> {t("scan.camera")}
                </button>
                <button type="button" className="btn-ghost" onClick={() => galRef.current?.click()}>
                  <FileText size={14} /> {t("scan.gallery")}
                </button>
                <button type="button" className="btn-ghost" onClick={() => pdfRef.current?.click()}>
                  <FileUp size={14} /> PDF
                </button>
              </div>
              <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
              <input ref={galRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addImages(e.target.files); e.target.value = ""; }} />
              <input ref={pdfRef} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { addPdf(e.target.files?.[0]); e.target.value = ""; }} />
            </div>

            {pages.length > 0 && (
              <div className="scan-pages-wrap">
                <div className="scan-pages-label">{t("scan.pageCount", { n: pages.length })}</div>
                <div className="scan-thumbs">
                  {pages.map((im, i) => (
                    <div
                      key={im.id}
                      className={`scan-thumb ${previewId === im.id ? "scan-thumb--active" : ""}`}
                      onClick={() => setPreviewId(im.id)}
                    >
                      <img src={im.dataUrl} alt="" />
                      <span className="scan-thumb-num">{i + 1}</span>
                      <QualityBadge quality={im.quality} t={t} />
                      <div className="scan-thumb-bar">
                        <span onClick={(e) => { e.stopPropagation(); movePage(i, -1); }}>‹</span>
                        <Trash2 size={12} onClick={(e) => { e.stopPropagation(); removePage(im.id); }} />
                        <span onClick={(e) => { e.stopPropagation(); movePage(i, 1); }}>›</span>
                      </div>
                      {(im.corrected || im.enhanced) && (
                        <span className="scan-thumb-badge" onClick={(e) => { e.stopPropagation(); revertPage(im.id); }} title={t("scan.revert")}>↺</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {preview && (
              <div className="scan-preview glass">
                <img src={preview.dataUrl} alt="" />
                <div className="scan-preview-actions">
                  <button type="button" className="btn-ghost" style={{ fontSize: 12 }} onClick={() => enhanceOne(preview.id)}>
                    <Wand2 size={13} /> {t("scan.enhance")}
                  </button>
                </div>
              </div>
            )}

            {busy && (
              <div className="scan-progress">
                <div className="scan-progress-head"><span>{progLabel}</span><span>{prog}%</span></div>
                <div className="scan-progress-bar"><div style={{ width: `${prog}%` }} /></div>
              </div>
            )}
            {err && (
              <div className="scan-error"><AlertTriangle size={15} />{err}</div>
            )}

            <div className="hairline" style={{ margin: "16px 0" }} />
            <div className="scan-section-label">{t("scan.ocrEngine")}</div>
            <div className="scan-chips">
              <span className={`chip ${mode === "ai" ? "scan-chip--on" : ""}`} onClick={() => setMode("ai")}>
                <Sparkles size={12} /> {t("scan.modeAi")}
              </span>
              <span className={`chip ${mode === "local" ? "scan-chip--on" : ""}`} onClick={() => setMode("local")}>
                {t("scan.modeLocal")}
              </span>
            </div>
            <div className="scan-actions">
              <button type="button" className="btn-primary scan-btn-smart" onClick={runSmart} disabled={busy || !pages.length}>
                <Brain size={15} /> {t("scan.smartScan")}
              </button>
              <button type="button" className="btn-ghost" onClick={correctAll} disabled={busy || !pages.length}>
                <ScanLine size={15} /> {t("scan.autoCrop")}
              </button>
              <button type="button" className="btn-ghost" onClick={downloadPdf} disabled={busy || !pages.length}>
                <Download size={15} /> {t("scan.downloadPdf")}
              </button>
              <button type="button" className="btn-ghost" onClick={runOcrOnly} disabled={busy || !pages.length}>
                <Zap size={15} /> {t("scan.ocrOnly")}
              </button>
            </div>
          </div>

          <div className="glass scan-tip">
            <Info size={14} className="gold-text" />
            <p>{t("scan.tip")}</p>
          </div>
        </div>

        {/* Right: results */}
        <div className="glass rise scan-result-panel">
          {!text ? (
            <div className="scan-empty">
              <div className="scan-empty-icon"><ScanLine size={24} className="emerald-text" /></div>
              <p>{t("scan.emptyHint")}</p>
            </div>
          ) : (
            <div className="view-enter">
              {intel && (
                <div className="scan-intel glass">
                  <div className="scan-intel-head">
                    <span className="scan-intel-icon">{docIcon}</span>
                    <div>
                      <div className="scan-intel-type">{intel.docTypeLabel}</div>
                      {intel.title && <div className="scan-intel-title">{intel.title}</div>}
                    </div>
                    <span className={`badge ${intel.confidence === "high" ? "badge-low" : intel.confidence === "medium" ? "badge-med" : "badge-high"}`}>
                      AI · {intel.confidence}
                    </span>
                  </div>
                  {intel.summary && <p className="scan-intel-summary">{intel.summary}</p>}
                  <div className="scan-intel-meta">
                    {intel.parties?.length > 0 && (
                      <div><strong>{t("scan.parties")}:</strong> {intel.parties.join(" · ")}</div>
                    )}
                    {intel.dates?.length > 0 && (
                      <div><strong>{t("scan.dates")}:</strong> {intel.dates.join(" · ")}</div>
                    )}
                    {intel.referenceNumbers?.length > 0 && (
                      <div><strong>{t("scan.refs")}:</strong> {intel.referenceNumbers.join(" · ")}</div>
                    )}
                  </div>
                  {intel.keyPoints?.length > 0 && (
                    <ul className="scan-intel-points">
                      {intel.keyPoints.map((kp, i) => <li key={i}>{kp}</li>)}
                    </ul>
                  )}
                  {actionHint && actionHint !== "none" && (
                    <div className="scan-intel-rec">
                      <Sparkles size={13} className="emerald-text" />
                      {intel.recommendedActionReason || t(`scan.rec.${actionHint}`)}
                    </div>
                  )}
                  <button type="button" className="btn-ghost" style={{ fontSize: 12, marginTop: 8 }} onClick={() => runIntel(text)} disabled={busy}>
                    <RefreshCw size={13} /> {t("scan.reanalyze")}
                  </button>
                </div>
              )}

              <div className="scan-result-head">
                <h3 className="serif">{t("scan.resultTitle")}</h3>
                <span className="badge badge-low">
                  <CheckCircle2 size={12} /> {text.length.toLocaleString(locale === "en" ? "en-US" : "id-ID")} {t("scan.chars")}
                </span>
                <span className="scan-result-tools">
                  <button type="button" className="btn-ghost" onClick={() => exportWord(text, "dokumen")}>
                    <Download size={14} /> Word
                  </button>
                  <button type="button" className="btn-ghost" onClick={() => { try { navigator.clipboard.writeText(text); } catch { /* ignore */ } }}>
                    {t("scan.copy")}
                  </button>
                </span>
              </div>
              <textarea className="field scrollbar scan-textarea" rows={14} value={text} onChange={(e) => setText(e.target.value)} />
              <div className="hairline" style={{ margin: "16px 0" }} />
              <div className="scan-section-label">{t("scan.sendTo")}</div>
              <div className="scan-send-actions">
                <button
                  type="button"
                  className={`btn-primary ${actionHint === "contract" ? "scan-btn-rec" : ""}`}
                  onClick={() => send("contract")}
                >
                  <FileSearch size={15} /> {t("scan.toContract")}
                </button>
                <button
                  type="button"
                  className={`btn-ghost ${actionHint === "analysis" ? "scan-btn-rec" : ""}`}
                  onClick={() => send("analysis")}
                >
                  <Scale size={15} /> {t("scan.toAnalysis")}
                </button>
                <button type="button" className="btn-ghost" onClick={() => send("research")}>
                  <BookOpen size={15} /> {t("scan.toResearch")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
