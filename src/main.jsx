/**
 * src/main.jsx — with per-user storage namespace & blank screen protection
 */

import React from "react";
import { createRoot } from "react-dom/client";
import App from "./KNSLLegalIntelligence.jsx"; // Nama file disesuaikan dengan milik Anda

// 1. Setup Polyfill & Konfigurasi (Aman dieksekusi duluan)
if (typeof window !== "undefined") {
  window.__CLAUDE_PROXY__ = "/api/claude";

  /* --- iOS viewport fix --- */
  let vp = document.querySelector('meta[name="viewport"]');
  if (!vp) {
    vp = document.createElement("meta");
    vp.name = "viewport";
    document.head.appendChild(vp);
  }
  vp.setAttribute(
    "content",
    "width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1"
  );

  /* --- Per-user storage polyfill --- */
  if (!window.storage) {
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
}

// 2. Fungsi Utama untuk Render Aplikasi (Mencegah Crash Layar Kosong)
const renderApp = () => {
  let rootElement = document.getElementById("root");

  // Jika div dengan id="root" tidak ditemukan di HTML, kita buat secara otomatis
  if (!rootElement) {
    rootElement = document.createElement("div");
    rootElement.id = "root";
    document.body.appendChild(rootElement);
  }

  // Render aplikasi ke dalam root
  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// 3. Eksekusi Render dengan Aman (Menunggu HTML DOM selesai dimuat)
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", renderApp);
  } else {
    renderApp();
  }
}
