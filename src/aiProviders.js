/* Client-side AI provider config & unified LLM call. */

export const AI_PROVIDERS = [
  { id: "auto", label: "Otomatis", free: true, hint: "Prioritas: Gemini → Groq → Ollama → Claude" },
  { id: "gemini", label: "Google Gemini", free: true, hint: "API key: aistudio.google.com/apikey" },
  { id: "groq", label: "Groq (Llama)", free: true, hint: "API key: console.groq.com" },
  { id: "ollama", label: "Ollama (lokal)", free: true, hint: "Model lokal — ollama pull llama3.2" },
  { id: "claude", label: "Claude (Anthropic)", free: false, hint: "API key Anthropic di environment server" },
];

const STORAGE_KEY = "knsl:ai-provider";

/** Dev lokal saja — Ollama tidak jalan di knsl.tech / Vercel. */
export function isLocalDevHost() {
  if (typeof window === "undefined") return false;
  return /localhost|127\.0\.0\.1/.test(window.location.hostname);
}

/** Provider yang boleh ditampilkan di dropdown (sembunyikan Ollama di cloud). */
export function getVisibleAiProviders() {
  return AI_PROVIDERS.filter((p) => p.id !== "ollama" || isLocalDevHost());
}

export function getAiProvider() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && AI_PROVIDERS.some((p) => p.id === v)) {
      if (v === "ollama" && !isLocalDevHost()) return "auto";
      return v;
    }
  } catch { /* ignore */ }
  return "auto";
}

/** Provider yang benar-benar dikirim ke /api/ai (hindari Ollama nyangkut di localStorage). */
export function resolveAiProvider(explicit) {
  const raw = explicit || getAiProvider();
  if (raw === "ollama" && !isLocalDevHost()) return "auto";
  return raw;
}

export function setAiProvider(id) {
  if (!AI_PROVIDERS.some((p) => p.id === id)) return;
  if (id === "ollama" && !isLocalDevHost()) return;
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  if (typeof window !== "undefined") {
    window.__KNSL_AI_PROVIDER__ = id;
    window.__KNSL_AI_LAST__ = null;
    window.__KNSL_AI_LAST_ERR__ = null;
  }
}

export function getAiProxyEndpoint() {
  if (typeof window !== "undefined" && window.__AI_PROXY__) return window.__AI_PROXY__;
  return "/api/ai";
}

export function getProviderLabel(id) {
  return AI_PROVIDERS.find((p) => p.id === id)?.label || id;
}

/** Last successful provider from agent (for UI feedback). */
export function setLastAiMeta(meta) {
  if (typeof window !== "undefined") window.__KNSL_AI_LAST__ = meta;
}

export function getLastAiMeta() {
  return (typeof window !== "undefined" && window.__KNSL_AI_LAST__) || null;
}

export function setLastAiError(msg) {
  if (typeof window !== "undefined") window.__KNSL_AI_LAST_ERR__ = msg || null;
}

export function getLastAiError() {
  return (typeof window !== "undefined" && window.__KNSL_AI_LAST_ERR__) || null;
}

/** Terjemahkan error API ke pesan yang mudah dipahami (ID). */
export function formatAiError(raw, providerId) {
  const m = String(raw || "").toLowerCase();
  const selected = resolveAiProvider(providerId);
  const name = getProviderLabel(selected);
  if (m.includes("quota") || m.includes("exceeded") || m.includes("resource_exhausted") || m.includes("rate limit")) {
    const alt = selected === "groq" ? "Gemini" : "Groq";
    return `Kuota ${name} habis (limit gratis harian/bulanan). Solusi: (1) tunggu reset kuota ±24 jam, (2) ganti ke ${alt} di dropdown Provider AI + pasang API key di Vercel, atau (3) aktifkan billing di dashboard provider.`;
  }
  if (m.includes("api key") || m.includes("invalid") || m.includes("permission")) {
    return `API key ${name} tidak valid atau tidak punya izin. Buat key baru di dashboard provider, update di Vercel Environment Variables, lalu redeploy.`;
  }
  if ((m.includes("ollama") || m.includes("econnrefused") || m.includes("11434")) && selected !== "ollama") {
    return `Provider ${name} gagal terhubung. Pastikan API key ${name} sudah di-set di Vercel lalu redeploy. (Pesan server menyebut Ollama — abaikan jika Anda memilih ${name}.)`;
  }
  if (m.includes("ollama") || m.includes("11434")) {
    return "Ollama tidak jalan di server cloud. Untuk knsl.tech pilih Gemini atau Groq. Ollama hanya untuk dev lokal (ollama serve).";
  }
  return String(raw || "AI gagal — cek provider dan API key.");
}
