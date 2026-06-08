import { json, handleOptions } from "../_lib/http.mjs";
import { query, writeAudit, hasDatabase } from "../_lib/db.mjs";
import { requireUser } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const id = req.query?.id;
  if (!id) return json(res, 400, { error: "ID wajib." });
  if (!hasDatabase()) return json(res, 503, { error: "Database belum dikonfigurasi." });

  try {
    const user = await requireUser(req);

    if (req.method === "GET") {
      const r = await query(
        "SELECT id, title, law_filter, source, ai_status, payload, created_at FROM case_analyses WHERE id = $1 AND user_id = $2",
        [id, user.id]
      );
      if (!r.rows.length) return json(res, 404, { error: "Tidak ditemukan." });
      return json(res, 200, { item: r.rows[0] });
    }

    if (req.method === "DELETE") {
      const r = await query(
        "DELETE FROM case_analyses WHERE id = $1 AND user_id = $2 RETURNING id",
        [id, user.id]
      );
      if (!r.rows.length) return json(res, 404, { error: "Tidak ditemukan." });
      await writeAudit(user.id, "delete_case_analysis", id, {});
      return json(res, 200, { ok: true });
    }

    json(res, 405, { error: "Method not allowed" });
  } catch (e) {
    json(res, e.status || 500, { error: String(e.message || e) });
  }
}
