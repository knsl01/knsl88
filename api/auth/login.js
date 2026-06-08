import { json, readJson, handleOptions } from "../_lib/http.mjs";
import { writeAudit, hasDatabase } from "../_lib/db.mjs";
import { findUserByUsername, verifyPassword, signToken, publicUser } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!hasDatabase()) return json(res, 503, { error: "Database belum dikonfigurasi (DATABASE_URL)." });

  try {
    const body = await readJson(req);
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!username || !password) return json(res, 400, { error: "Username dan password wajib." });

    const row = await findUserByUsername(username);
    if (!row) return json(res, 401, { error: "Username tidak ditemukan." });

    const ok = await verifyPassword(password, row.password_hash);
    if (!ok) return json(res, 401, { error: "Password salah." });

    const user = publicUser(row);
    const token = await signToken(user);
    await writeAudit(user.id, "login", username, {});

    json(res, 200, { token, user });
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
}
