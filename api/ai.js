/* Vercel Serverless — unified AI proxy (Gemini, Groq, Ollama, Claude).
   Route: POST /api/ai
   Body: { provider, system, user, maxTokens, model } */
import { routeAI, getAIStatus } from "./aiRouter.mjs";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }

  if (req.method === "GET") {
    res.status(200).json(getAIStatus());
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const result = await routeAI(req.body);
    res.status(200).json(result);
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
}
