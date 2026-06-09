import assert from "node:assert/strict";

import { routeAI } from "../api/aiRouter.mjs";
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
