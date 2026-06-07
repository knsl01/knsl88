/**
 * src/main.jsx — with per-user storage namespace
 * Storage keys di-prefix "knsl:{userId}:" sehingga data tiap akun terpisah.
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./KNSLLegalIntelligence.jsx";

if (typeof window !== "undefined") {
  window.__CLAUDE_PROXY__ = "/api/claude";
}

/* ----------------------------------------------------------------
   Per-user storage polyfill.
   window.__KNSL_USER_ID__ di-set oleh auth flow di App.
   Semua key di-prefix "knsl:{userId}:" → data terpisah per akun.
----------------------------------------------------------------- */
if (typeof window !== "undefined" && !window.storage) {
  const prefix = () => {
    const uid = window.__KNSL_USER_ID__ || "";
    return uid ? "knsl:" + uid + ":" : "knsl:";
  };
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(prefix() + key);
      return v == null ? null : { key, value: v };
    },
    async set(key, value) {
      localStorage.setItem(prefix() + key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(prefix() + key);
      return { key, deleted: true };
    },
    async list(pfx = "") {
      const p = prefix();
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(p + pfx)) keys.push(k.slice(p.length));
      }
      return { keys, prefix: pfx };
    },
  };
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
