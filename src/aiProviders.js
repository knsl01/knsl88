/* Client-side AI provider config & unified LLM call. */

export const AI_PROVIDERS = [
  { id: "auto", label: "Otomatis (gratis dulu)", free: true, hint: "Coba Gemini → Groq → Ollama → Claude" },
  { id: "gemini", label: "Google Gemini", free: true, hint: "Gratis — API key di aistudio.google.com/apikey" },
  { id: "groq", label: "Groq (Llama)", free: true, hint: "Gratis — API key di console.groq.com" },
  { id: "ollama", label: "Ollama (lokal)", free: true, hint: "100% gratis — jalankan: ollama pull llama3.2" },
  { id: "claude", label: "Claude (Anthropic)", free: false, hint: "Berbayar per token" },
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
