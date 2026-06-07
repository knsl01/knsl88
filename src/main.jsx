import React from "react";
import { createRoot } from "react-dom/client";
// KITA UBAH DI SINI: Diarahkan ke App.js (tanpa ketik ekstensi agar aman)
import App from "./App";

if (typeof window !== "undefined") {
  window.__CLAUDE_PROXY__ = "/api/claude";
}

if (typeof window !== "undefined" && !window.storage) {
  const P = "knsl:";
  window.storage = {
    async get(key) {
      const v = localStorage.getItem(P + key);
      return v == null ? null : { key, value: v };
    },
    async set(key, value) {
      localStorage.setItem(P + key, value);
      return { key, value };
    },
    async delete(key) {
      localStorage.removeItem(P + key);
      return { key, deleted: true };
    },
    async list(prefix = "") {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(P + prefix)) keys.push(k.slice(P.length));
      }
      return { keys, prefix };
    },
  };
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
