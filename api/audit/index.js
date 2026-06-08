import { json, handleOptions } from "../_lib/http.mjs";
import { query, hasDatabase } from "../_lib/db.mjs";
import { requireUser } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  if (!hasDatabase()) return json(res, 503, { error: "Database belum dikonfigurasi." });

  try {
    const user = await requireUser(req);
    if (!["admin", "partner"].includes(user.role)) {
      return json(res, 403, { error: "Hanya admin/partner yang dapat melihat audit log." });
    }

    const r = await query(
      `SELECT id, user_id, action, target, meta, created_at
       FROM audit_log ORDER BY created_at DESC LIMIT 200`
    );
    json(res, 200, { items: r.rows });
  } catch (e) {
    json(res, e.status || 500, { error: String(e.message || e) });
  }
}
