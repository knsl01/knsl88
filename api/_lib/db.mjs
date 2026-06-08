import pg from "pg";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let pool;

export function hasDatabase() {
  return !!process.env.DATABASE_URL;
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL belum di-set. Gunakan Neon/Supabase PostgreSQL gratis.");
  }
  if (!pool) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
      max: 5,
    });
  }
  return pool;
}

export async function query(text, params = []) {
  const p = getPool();
  return p.query(text, params);
}

export async function runMigrations() {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
  await query(sql);
}

export async function pingDb() {
  if (!hasDatabase()) return false;
  try {
    await query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export async function writeAudit(userId, action, target, meta = {}) {
  await query(
    "INSERT INTO audit_log (user_id, action, target, meta) VALUES ($1, $2, $3, $4)",
    [userId, action, target, meta]
  );
}
