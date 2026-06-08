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
        `SELECT id, title, law_filter, source, ai_status, created_at, updated_at,
                jsonb_build_object(
                  'facts', jsonb_array_length(COALESCE(payload->'fm'->'facts', '[]'::jsonb)),
                  'issues', jsonb_array_length(COALESCE(payload->'is'->'issues', '[]'::jsonb))
                ) AS summary
         FROM case_analyses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
        [user.id]
      );
      return json(res, 200, { items: r.rows });
    }

    if (req.method === "POST") {
      const body = await readJson(req);
      const payload = body.payload;
      if (!payload || !payload.fm) return json(res, 400, { error: "payload analisa wajib." });

      const title = String(body.title || "Analisa perkara").slice(0, 200);
      const lawFilter = String(body.lawFilter || body.law_filter || "all");
      const source = String(body.source || payload.source || "heuristic");
      const aiStatus = body.aiStatus || body.ai_status || null;

      const r = await query(
        `INSERT INTO case_analyses (user_id, title, law_filter, source, ai_status, payload)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
        [user.id, title, lawFilter, source, aiStatus, payload]
      );
      await writeAudit(user.id, "save_case_analysis", r.rows[0].id, { title });
      return json(res, 201, { id: r.rows[0].id, createdAt: r.rows[0].created_at });
    }

    json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    json(res, e.status || 500, { error: String(e.message || e) });
  }
}
