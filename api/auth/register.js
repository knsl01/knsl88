import { json, readJson, handleOptions } from "../_lib/http.mjs";
import { query, writeAudit, hasDatabase } from "../_lib/db.mjs";
import { hashPassword, findUserByUsername, signToken, publicUser } from "../_lib/auth.mjs";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });
  if (!hasDatabase()) return json(res, 503, { error: "Database belum dikonfigurasi (DATABASE_URL)." });

  try {
    const body = await readJson(req);
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const email = body.email ? String(body.email).trim().toLowerCase() : null;

    if (!name) return json(res, 400, { error: "Nama wajib diisi." });
    if (!username || username.length < 3) return json(res, 400, { error: "Username minimal 3 karakter." });
    if (!/^[a-z0-9._-]+$/.test(username)) return json(res, 400, { error: "Username tidak valid." });
    if (password.length < 6) return json(res, 400, { error: "Password minimal 6 karakter." });

    const existing = await findUserByUsername(username);
    if (existing) return json(res, 409, { error: "Username sudah terdaftar." });

    const passwordHash = await hashPassword(password);
    const r = await query(
      `INSERT INTO users (username, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'reviewer') RETURNING id, username, name, role, email`,
      [username, name, email, passwordHash]
    );
    const user = publicUser(r.rows[0]);
    const token = await signToken(user);
    await writeAudit(user.id, "register", username, {});

    json(res, 201, { token, user });
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
}
