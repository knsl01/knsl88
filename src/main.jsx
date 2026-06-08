/**
 * src/main.jsx
 * - Per-user storage namespace (knsl:{userId}:)
 * - iOS viewport meta (mencegah layout "melebar" + media query mobile aktif)
 * - Root guard (#root dibuat bila index.html tidak menyediakannya)
 * - ErrorBoundary: render error tampil di layar, bukan layar hitam diam-diam
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./KNSLLegalIntelligence.jsx";

if (typeof window !== "undefined") {
  window.__AI_PROXY__ = "/api/ai";
  window.__CLAUDE_PROXY__ = "/api/claude"; // legacy OCR / direct Claude calls
}

/* ---------- iOS viewport fix ---------- */
if (typeof document !== "undefined") {
  let vp = document.querySelector('meta[name="viewport"]');
  if (!vp) {
    vp = document.createElement("meta");
    vp.name = "viewport";
    document.head.appendChild(vp);
  }
  // viewport-fit=cover hanya di mode standalone (PWA di layar utama).
  // Di Safari biasa, env(safe-area-inset-top)=0 sehingga cover akan
  // mendorong konten ke bawah Dynamic Island → header ketutup. Tanpa
  // cover, Safari otomatis menaruh konten di dalam safe area.
  const standalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  vp.setAttribute(
    "content",
    "width=device-width, initial-scale=1" + (standalone ? ", viewport-fit=cover" : "")
  );
}

/* ---------- Per-user storage polyfill ---------- */
if (typeof window !== "undefined" && !window.storage) {
  const prefix = () => {
    const uid = window.__KNSL_USER_ID__ || "";
    return uid ? "knsl:" + uid + ":" : "knsl:";
  };
  const safeLS = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    del(k) { try { localStorage.removeItem(k); } catch {} },
  };
  window.storage = {
    async get(key) {
      const v = safeLS.get(prefix() + key);
      return v == null ? null : { key, value: v };
    },
    async set(key, value) {
      safeLS.set(prefix() + key, value);
      return { key, value };
    },
    async delete(key) {
      safeLS.del(prefix() + key);
      return { key, deleted: true };
    },
    async list(pfx = "") {
      const p = prefix();
      const keys = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith(p + pfx)) keys.push(k.slice(p.length));
        }
      } catch {}
      return { keys, prefix: pfx };
    },
  };
}

/* ---------- ErrorBoundary: jangan pernah layar hitam diam-diam ---------- */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    this.setState({ info });
    // eslint-disable-next-line no-console
    if (typeof console !== "undefined") console.error("KNSL crash:", error, info);
  }
  render() {
    if (this.state.error) {
      const e = this.state.error;
      const msg = (e && (e.message || String(e))) || "Unknown error";
      const stack = (e && e.stack) || "";
      const compStack = (this.state.info && this.state.info.componentStack) || "";
      const box = {
        fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace",
        background: "#0b0f0e",
        color: "#eef2ef",
        minHeight: "100vh",
        padding: "24px 18px",
        boxSizing: "border-box",
        WebkitOverflowScrolling: "touch",
        overflowY: "auto",
      };
      const pre = {
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        fontSize: 12.5,
        lineHeight: 1.5,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: 14,
        marginTop: 12,
        color: "#ffb4a8",
      };
      return (
        <div style={box}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1fb37e" }}>
            KNSL — terjadi error saat memuat aplikasi
          </div>
          <div style={{ fontSize: 13, color: "#9fb0a8", marginTop: 6 }}>
            Pesan error di bawah ini menunjukkan penyebabnya. Kirim teks ini untuk perbaikan tepat sasaran.
          </div>
          <div style={pre}>{msg}</div>
          {compStack ? (
            <div style={{ ...pre, color: "#d8c08a" }}>{compStack.trim()}</div>
          ) : null}
          {stack ? (
            <div style={{ ...pre, color: "#7e8c86" }}>{stack}</div>
          ) : null}
          <button
            onClick={() => { try { location.reload(); } catch {} }}
            style={{
              marginTop: 16, padding: "11px 18px", borderRadius: 12,
              border: "1px solid rgba(31,179,126,0.4)", background: "#0c4a33",
              color: "#eafff4", fontWeight: 600, cursor: "pointer",
            }}
          >
            Muat ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ---------- Root guard + mount ---------- */
function mount() {
  let rootEl =
    (typeof document !== "undefined" && document.getElementById("root")) || null;
  if (!rootEl && typeof document !== "undefined") {
    rootEl = document.createElement("div");
    rootEl.id = "root";
    document.body.appendChild(rootEl);
  }
  if (!rootEl) return;
  try {
    createRoot(rootEl).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (err) {
    rootEl.innerHTML =
      '<div style="font-family:monospace;background:#0b0f0e;color:#ffb4a8;' +
      'min-height:100vh;padding:24px;white-space:pre-wrap;word-break:break-word">' +
      "KNSL gagal mount:\n" +
      String((err && err.stack) || (err && err.message) || err) +
      "</div>";
  }
}

mount();
