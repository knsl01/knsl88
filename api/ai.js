/* Vercel Serverless — unified AI proxy (Gemini, Groq, Ollama, Claude).
   Route: POST /api/ai
   Body: { provider, system, user, maxTokens, model } */
import { routeAI, getAIStatus } from "./aiRouter.mjs";
import { applyCors, checkBodySize, checkRateLimit } from "./aiGuards.mjs";

export default async function handler(req, res) {
  const corsOk = applyCors(req, res);
  if (!corsOk) {
    res.status(403).json({ error: "Origin tidak diizinkan untuk /api/ai." });
    return;
  }

  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  if (req.method === "GET") {
    res.status(200).json(getAIStatus());
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const size = checkBodySize(req);
  if (!size.ok) {
    res.status(413).json({ error: `Payload AI terlalu besar (${size.size} bytes). Maksimum ${size.maxBytes} bytes.` });
    return;
  }

  const rate = checkRateLimit(req);
  if (!rate.ok) {
    res.setHeader("Retry-After", String(rate.retryAfter));
    res.status(429).json({ error: `Terlalu banyak request AI. Coba lagi dalam ${rate.retryAfter} detik.` });
    return;
  }

  try {
    const result = await routeAI(req.body);
    res.status(200).json(result);
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
