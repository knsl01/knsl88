import { json, handleOptions } from "../_lib/http.mjs";
import { hasDatabase } from "../_lib/db.mjs";
import { requireUser, findUserById } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
  if (!hasDatabase()) return json(res, 503, { error: "Database belum dikonfigurasi." });

  try {
    const session = await requireUser(req);
    const user = await findUserById(session.id);
    if (!user) return json(res, 404, { error: "User tidak ditemukan." });
    json(res, 200, { user: { id: user.id, username: user.username, name: user.name, role: user.role, email: user.email } });
  } catch (e) {
    json(res, e.status || 500, { error: String(e.message || e) });
  }
}
