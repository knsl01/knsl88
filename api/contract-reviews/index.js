import { json, readJson, handleOptions } from "../_lib/http.mjs";
import { query, writeAudit, hasDatabase } from "../_lib/db.mjs";
import { requireUser } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (!hasDatabase()) return json(res, 503, { error: "Database belum dikonfigurasi." });

  try {
    const user = await requireUser(req);

    if (req.method === "GET") {
      const r = await query(
        `SELECT id, name, perspective, used_ai, ai_hits, risk_score, risk_category, created_at,
                COALESCE(jsonb_array_length(payload->'clauses'), 0) AS clause_count
         FROM contract_reviews WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [user.id]
      );
      return json(res, 200, { items: r.rows });
    }

    if (req.method === "POST") {
      const body = await readJson(req);
      const payload = body.payload || body;
      if (!payload.clauses) return json(res, 400, { error: "payload kontrak wajib." });

      const name = String(body.name || payload.name || "Kontrak").slice(0, 255);
      const perspective = body.perspective || body.ctx || payload.ctx || null;
      const usedAi = !!(body.usedAI ?? body.used_ai ?? payload.usedAI);
      const aiHits = Number(body.aiHits ?? body.ai_hits ?? payload.aiHits ?? 0);
      const risk = payload.risk || {};

      const r = await query(
        `INSERT INTO contract_reviews (user_id, name, perspective, used_ai, ai_hits, risk_score, risk_category, payload)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, created_at`,
        [user.id, name, perspective, usedAi, aiHits, risk.score ?? null, risk.category ?? null, payload]
      );
      await writeAudit(user.id, "save_contract_review", r.rows[0].id, { name });
      return json(res, 201, { id: r.rows[0].id, createdAt: r.rows[0].created_at });
    }

    json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    json(res, e.status || 500, { error: String(e.message || e) });
  }
}
