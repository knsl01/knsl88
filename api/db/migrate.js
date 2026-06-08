import { json, handleOptions } from "../_lib/http.mjs";
import { runMigrations, hasDatabase } from "../_lib/db.mjs";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  const secret = process.env.MIGRATE_SECRET || process.env.JWT_SECRET;
  const auth = req.headers.authorization || "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return json(res, 403, { error: "Forbidden — butuh MIGRATE_SECRET atau JWT_SECRET sebagai Bearer token." });
  }

  if (!hasDatabase()) {
    return json(res, 500, { error: "DATABASE_URL belum di-set." });
  }

  try {
    await runMigrations();
    json(res, 200, { ok: true, message: "Migrasi schema selesai." });
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
}
