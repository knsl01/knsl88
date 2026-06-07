/* Vercel Serverless Function — proxy ke Anthropic API.
   Simpan API key di Environment Variables Vercel (aman, tidak bocor ke browser).
   Route: POST /api/claude */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") { res.status(204).end(); return; }
  if (req.method !== "POST")   { res.status(405).json({ error: "Method not allowed" }); return; }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY belum di-set. Tambahkan di Vercel → Settings → Environment Variables, lalu Redeploy." });
    return;
  }

  let payload;
  try { payload = req.body; } catch (e) { res.status(400).json({ error: "Body tidak valid." }); return; }

  if (process.env.CLAUDE_MODEL) payload.model = process.env.CLAUDE_MODEL;
  if (!payload.max_tokens) payload.max_tokens = 1000;

  try {
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    });
    const text = await upstream.text();
    res.status(upstream.status).setHeader("content-type", "application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "Gagal menghubungi Anthropic: " + (e.message || e) });
  }
}
