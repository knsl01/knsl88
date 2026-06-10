import assert from "node:assert/strict";

import {
  checkBodySize,
  checkRateLimit,
  isAllowedOrigin,
  resetRateLimitForTests,
} from "../server-ai-guards.mjs";
import { routeAI } from "../server-ai-router.mjs";
import { dispatchKnslChatAgent } from "../src/agents/chatDispatcher.js";

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function geminiResponse(text) {
  return jsonResponse({
    candidates: [{ content: { parts: [{ text }] } }],
  });
}

async function withMockFetch(mock, fn) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = mock;
  try {
    await fn();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

const previousGuardEnv = {
  AI_ALLOWED_ORIGINS: process.env.AI_ALLOWED_ORIGINS,
  AI_RATE_LIMIT_MAX: process.env.AI_RATE_LIMIT_MAX,
  AI_RATE_LIMIT_WINDOW_MS: process.env.AI_RATE_LIMIT_WINDOW_MS,
  AI_MAX_BODY_BYTES: process.env.AI_MAX_BODY_BYTES,
};

process.env.AI_ALLOWED_ORIGINS = "https://preview.knsl.tech";
assert.equal(isAllowedOrigin("https://knsl.tech"), true);
assert.equal(isAllowedOrigin("https://preview.knsl.tech"), true);
assert.equal(isAllowedOrigin("https://evil.example"), false);
assert.equal(isAllowedOrigin("http://localhost:5173"), true);

process.env.AI_MAX_BODY_BYTES = "12";
assert.equal(checkBodySize({ body: { user: "ok" }, headers: {} }).ok, false);
assert.equal(checkBodySize({ body: "small", headers: {} }).ok, true);

resetRateLimitForTests();
process.env.AI_RATE_LIMIT_MAX = "2";
process.env.AI_RATE_LIMIT_WINDOW_MS = "1000";
const req = { headers: { "x-forwarded-for": "203.0.113.8" } };
assert.equal(checkRateLimit(req, 1000).ok, true);
assert.equal(checkRateLimit(req, 1100).ok, true);
const blocked = checkRateLimit(req, 1200);
assert.equal(blocked.ok, false);
assert.equal(blocked.retryAfter, 1);

for (const [key, value] of Object.entries(previousGuardEnv)) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}
resetRateLimitForTests();

process.env.GEMINI_API_KEY = "test-gemini-key";
delete process.env.GROQ_API_KEY;
delete process.env.ANTHROPIC_API_KEY;

await withMockFetch(async (_url, options) => {
  const body = JSON.parse(options.body);
  assert.equal(body.generationConfig.responseMimeType, undefined);
  return geminiResponse("Jawaban prosa");
}, async () => {
  const result = await routeAI({ provider: "gemini", user: "Jelaskan wanprestasi.", responseFormat: "text" });
  assert.equal(result.text, "Jawaban prosa");
});

await withMockFetch(async (_url, options) => {
  const body = JSON.parse(options.body);
  assert.equal(body.generationConfig.responseMimeType, "application/json");
  return geminiResponse('{"ok":true}');
}, async () => {
  const result = await routeAI({ provider: "gemini", user: "Kembalikan JSON.", responseFormat: "json" });
  assert.equal(result.text, '{"ok":true}');
});

await withMockFetch(async (_url, options) => {
  const body = JSON.parse(options.body);
  const firstPart = body.contents[0].parts[0];
  assert.deepEqual(firstPart.inlineData, { mimeType: "image/png", data: "abc123" });
  assert.equal(body.generationConfig.responseMimeType, undefined);
  return geminiResponse("Teks hasil OCR");
}, async () => {
  const result = await routeAI({
    provider: "auto",
    user: "OCR dokumen hukum.",
    images: [{ mimeType: "image/png", data: "abc123" }],
    responseFormat: "text",
  });
  assert.equal(result.provider, "gemini");
  assert.equal(result.text, "Teks hasil OCR");
});

const dispatcherCalls = [];
await withMockFetch(async (url, options) => {
  const body = JSON.parse(options.body);
  if (String(url) === "/api/ai") {
    const result = await routeAI(body);
    return jsonResponse(result);
  }
  dispatcherCalls.push(body);
  if (dispatcherCalls.length === 1) return geminiResponse("bukan json");
  if (dispatcherCalls.length === 2) return geminiResponse("Jawaban chat fallback");
  return geminiResponse("Sintesis fallback");
}, async () => {
  const result = await dispatchKnslChatAgent({
    agentId: "orchestrator",
    provider: "gemini",
    messages: [
      { role: "user", content: "Saya digugat wanprestasi." },
      { role: "assistant", content: "KNSL Lead Counsel memerlukan klarifikasi: posisi Anda?" },
      { role: "user", content: "Saya tergugat dan butuh jawaban." },
    ],
  });

  const routePrompt = dispatcherCalls[0].contents[0].parts.at(-1).text;
  assert.match(routePrompt, /Saya digugat wanprestasi/);
  assert.match(routePrompt, /Saya tergugat dan butuh jawaban/);
  assert.equal(dispatcherCalls[0].generationConfig.responseMimeType, "application/json");
  assert.equal(dispatcherCalls[1].generationConfig.responseMimeType, undefined);
  assert.equal(result.text, "Jawaban chat fallback");
});

console.log("AI smoke tests passed");
