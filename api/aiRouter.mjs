/* Shared AI router — used by Vercel api/ai.js and Vite dev proxy. */

export const PROVIDER_META = {
  auto: { label: "Otomatis (gratis dulu)", free: true },
  gemini: { label: "Google Gemini (gratis)", free: true, keyEnv: "GEMINI_API_KEY", signup: "https://aistudio.google.com/apikey" },
  groq: { label: "Groq Llama (gratis)", free: true, keyEnv: "GROQ_API_KEY", signup: "https://console.groq.com/keys" },
  ollama: { label: "Ollama lokal (gratis)", free: true, note: "Jalankan: ollama pull llama3.2" },
  claude: { label: "Claude (berbayar)", free: false, keyEnv: "ANTHROPIC_API_KEY" },
};

const DEFAULT_MODELS = {
  gemini: "gemini-2.0-flash",
  groq: "llama-3.3-70b-versatile",
  ollama: "llama3.2",
  claude: "claude-sonnet-4-20250514",
};

function pickAutoProvider() {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.ANTHROPIC_API_KEY) return "claude";
  return "ollama";
}

async function callGemini({ system, user, maxTokens, model }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY belum di-set. Dapatkan gratis di https://aistudio.google.com/apikey");
  const m = model || process.env.GEMINI_MODEL || DEFAULT_MODELS.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
  const body = {
    systemInstruction: system ? { parts: [{ text: system }] } : undefined,
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: {
      maxOutputTokens: maxTokens || 2000,
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };
  const resp = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error?.message || `Gemini HTTP ${resp.status}`);
  const text = (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
  if (!text) throw new Error("Gemini mengembalikan respons kosong");
  return { text, provider: "gemini", model: m };
}

async function callGroq({ system, user, maxTokens, model }) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY belum di-set. Dapatkan gratis di https://console.groq.com/keys");
  const m = model || process.env.GROQ_MODEL || DEFAULT_MODELS.groq;
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: m, messages, max_tokens: maxTokens || 2000, temperature: 0.2 }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error?.message || `Groq HTTP ${resp.status}`);
  const text = String(data.choices?.[0]?.message?.content || "").trim();
  if (!text) throw new Error("Groq mengembalikan respons kosong");
  return { text, provider: "groq", model: m };
}

async function callOllama({ system, user, maxTokens, model }) {
  const host = (process.env.OLLAMA_HOST || "http://127.0.0.1:11434").replace(/\/$/, "");
  const m = model || process.env.OLLAMA_MODEL || DEFAULT_MODELS.ollama;
  const messages = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: user });
  const resp = await fetch(`${host}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ model: m, messages, stream: false, options: { num_predict: maxTokens || 2000, temperature: 0.2 } }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error || `Ollama HTTP ${resp.status}. Pastikan Ollama jalan: ollama serve`);
  const text = String(data.message?.content || "").trim();
  if (!text) throw new Error("Ollama mengembalikan respons kosong. Coba: ollama pull " + m);
  return { text, provider: "ollama", model: m };
}

async function callClaude({ system, user, maxTokens, model }) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY belum di-set (Claude berbayar). Gunakan Gemini/Groq/Ollama gratis.");
  const m = model || process.env.CLAUDE_MODEL || DEFAULT_MODELS.claude;
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: m, max_tokens: maxTokens || 2000, system: system || undefined, messages: [{ role: "user", content: user }] }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data?.error?.message || data?.error || `Claude HTTP ${resp.status}`);
  const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("").trim();
  if (!text) throw new Error("Claude mengembalikan respons kosong");
  return { text, provider: "claude", model: m };
}

const CALLERS = { gemini: callGemini, groq: callGroq, ollama: callOllama, claude: callClaude };

/** Route to provider; `auto` tries free providers in order with fallback. */
export async function routeAI(payload) {
  const { system, user, maxTokens = 2000, model } = payload || {};
  if (!user) throw new Error("Prompt user kosong");

  let provider = String(payload.provider || "auto").toLowerCase();
  if (provider === "auto") {
    const order = ["gemini", "groq", "ollama", "claude"];
    const available = order.filter((p) => {
      const meta = PROVIDER_META[p];
      if (!meta.keyEnv) return true;
      return !!process.env[meta.keyEnv];
    });
    if (!available.length) available.push("ollama");
    let lastErr;
    for (const p of available) {
      try { return await CALLERS[p]({ system, user, maxTokens, model }); }
      catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("Tidak ada provider AI yang tersedia");
  }

  const fn = CALLERS[provider];
  if (!fn) throw new Error(`Provider tidak dikenal: ${provider}`);
  return fn({ system, user, maxTokens, model });
}

export function listAvailableProviders() {
  return Object.entries(PROVIDER_META).map(([id, meta]) => ({
    id,
    ...meta,
    configured: meta.keyEnv ? !!process.env[meta.keyEnv] : id === "ollama" || id === "auto",
  }));
}
