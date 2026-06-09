/* Client-side AI provider config & unified LLM call. */

export const AI_PROVIDERS = [
  { id: "auto", label: "Otomatis", free: true, hint: "Prioritas: Gemini → Groq → Ollama → Claude" },
  { id: "gemini", label: "Google Gemini", free: true, hint: "API key: aistudio.google.com/apikey" },
  { id: "groq", label: "Groq (Llama)", free: true, hint: "API key: console.groq.com" },
  { id: "ollama", label: "Ollama (lokal)", free: true, hint: "Model lokal — ollama pull llama3.2" },
  { id: "claude", label: "Claude (Anthropic)", free: false, hint: "API key Anthropic di environment server" },
];

const STORAGE_KEY = "knsl:ai-provider";

export function isLocalOllamaHost(hostname) {
  const host = String(
    hostname ?? (typeof window !== "undefined" ? window.location?.hostname : "")
  ).toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1" || host.endsWith(".localhost");
}

export function normalizeAiProvider(id) {
  const selected = AI_PROVIDERS.some((p) => p.id === id) ? id : "auto";
  if (selected === "ollama" && !isLocalOllamaHost()) return "auto";
  return selected;
}

export function isAiProviderSelectable(id) {
  return normalizeAiProvider(id) === id;
}

export function getAiProvider() {
  let selected = "auto";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && AI_PROVIDERS.some((p) => p.id === v)) selected = v;
  } catch { /* ignore */ }
  const normalized = normalizeAiProvider(selected);
  if (normalized !== selected) {
    try { localStorage.setItem(STORAGE_KEY, normalized); } catch { /* ignore */ }
  }
  if (typeof window !== "undefined") window.__KNSL_AI_PROVIDER__ = normalized;
  return normalized;
}

export function setAiProvider(id) {
  const normalized = normalizeAiProvider(id);
  try { localStorage.setItem(STORAGE_KEY, normalized); } catch { /* ignore */ }
  if (typeof window !== "undefined") window.__KNSL_AI_PROVIDER__ = normalized;
}

export function getAiProxyEndpoint() {
  if (typeof window !== "undefined" && window.__AI_PROXY__) return window.__AI_PROXY__;
  return "/api/ai";
}

export async function getAiServerStatus() {
  const resp = await fetch(getAiProxyEndpoint(), { method: "GET" });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error || `AI status HTTP ${resp.status}`);
  return data;
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
  const inferredProvider =
    m.includes("groq") || m.includes("gsk_") || m.includes("groq_api_key") ? "groq" :
    m.includes("gemini") || m.includes("google") || m.includes("gemini_api_key") ? "gemini" :
    m.includes("claude") || m.includes("anthropic") || m.includes("anthropic_api_key") ? "claude" :
    m.includes("ollama") ? "ollama" :
    providerId || getAiProvider();
  const name = getProviderLabel(inferredProvider);
  if (m.includes("tidak ada provider") || m.includes("belum di-set di vercel")) {
    return "Server belum membaca API key AI. Pastikan GROQ_API_KEY dipasang di Environment Variables untuk environment yang sedang dibuka (Production/Preview), lalu redeploy.";
  }
  if (m.includes("groq_api_key") && (m.includes("belum") || m.includes("missing"))) {
    return "Server belum membaca GROQ_API_KEY. Tambahkan env var GROQ_API_KEY di Vercel untuk environment yang sedang dibuka, lalu redeploy.";
  }
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
