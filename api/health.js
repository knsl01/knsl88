import { json, handleOptions } from "./_lib/http.mjs";
import { hasDatabase, pingDb } from "./_lib/db.mjs";

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const dbConfigured = hasDatabase();
  const dbOk = dbConfigured ? await pingDb() : false;

  json(res, 200, {
    ok: true,
    backend: true,
    database: dbConfigured ? (dbOk ? "connected" : "error") : "not_configured",
    version: "1.0.0",
  });
}
