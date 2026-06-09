/* Client-side AI provider config & unified LLM call. */

export const AI_PROVIDERS = [
  { id: "auto", label: "Otomatis", free: true, hint: "Prioritas: Gemini → Groq → Ollama → Claude" },
  { id: "gemini", label: "Google Gemini", free: true, hint: "API key: aistudio.google.com/apikey" },
  { id: "groq", label: "Groq (Llama)", free: true, hint: "API key: console.groq.com" },
  { id: "ollama", label: "Ollama (lokal)", free: true, hint: "Model lokal — ollama pull llama3.2" },
  { id: "claude", label: "Claude (Anthropic)", free: false, hint: "API key Anthropic di environment server" },
];

const STORAGE_KEY = "knsl:ai-provider";

export function getAiProvider() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && AI_PROVIDERS.some((p) => p.id === v)) return v;
  } catch { /* ignore */ }
  return "auto";
}

export function setAiProvider(id) {
  if (!AI_PROVIDERS.some((p) => p.id === id)) return;
  try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  if (typeof window !== "undefined") window.__KNSL_AI_PROVIDER__ = id;
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
  const name = getProviderLabel(providerId || getAiProvider());
  if (m.includes("quota") || m.includes("exceeded") || m.includes("resource_exhausted") || m.includes("rate limit")) {
    return `Kuota ${name} habis (limit gratis harian/bulanan). Solusi: (1) tunggu reset kuota ±24 jam, (2) ganti ke Groq di dropdown Provider AI + pasang GROQ_API_KEY di Vercel, (3) pakai Ollama lokal, atau (4) aktifkan billing di Google AI Studio.`;
  }
  if (m.includes("api key") || m.includes("invalid") || m.includes("permission")) {
    return `API key ${name} tidak valid atau tidak punya izin. Buat key baru di dashboard provider, update di Vercel, lalu redeploy.`;
  }
  if (m.includes("ollama") || m.includes("econnrefused") || m.includes("11434")) {
    return "Ollama tidak jalan di server. Untuk Vercel pakai Gemini/Groq. Ollama hanya untuk dev lokal (ollama serve).";
  }
  return String(raw || "AI gagal — cek provider dan API key.");
}
