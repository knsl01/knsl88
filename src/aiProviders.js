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
  const other = /groq/i.test(name) ? "Google Gemini" : "Groq (Llama)";
  if (
    m.includes("tokens per day") || m.includes("tpd") || m.includes("quota") ||
    m.includes("exceeded") || m.includes("resource_exhausted") || m.includes("rate limit") ||
    m.includes("too many requests") || m.includes("429")
  ) {
    return `Kuota/limit ${name} tercapai (tier gratis dibatasi per menit & per hari). Solusi: (1) tunggu reset (limit harian Groq reset tiap 24 jam), (2) ganti sementara ke ${other} di dropdown Provider AI, (3) persingkat pertanyaan/percakapan, atau (4) upgrade ke tier berbayar provider.`;
  }
  if (m.includes("credit balance") || m.includes("billing") || m.includes("payment") || m.includes("insufficient")) {
    return `${name} memerlukan saldo/billing aktif. Pilih provider gratis (Google Gemini atau Groq) di dropdown Provider AI, atau aktifkan billing di dashboard ${name}.`;
  }
  if (m.includes("api key") || m.includes("invalid") || m.includes("permission")) {
    return `API key ${name} tidak valid atau tidak punya izin. Buat key baru di dashboard provider, update di Vercel, lalu redeploy.`;
  }
  if (m.includes("ollama") || m.includes("econnrefused") || m.includes("11434")) {
    return "Ollama tidak jalan di server. Untuk Vercel pakai Gemini/Groq. Ollama hanya untuk dev lokal (ollama serve).";
  }
  return String(raw || "AI gagal — cek provider dan API key.");
}
