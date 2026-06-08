#!/usr/bin/env node
/** Jalankan migrasi DB: DATABASE_URL=... JWT_SECRET=... node scripts/migrate.mjs */
import { runMigrations, hasDatabase } from "../api/_lib/db.mjs";

if (!hasDatabase()) {
  console.error("DATABASE_URL belum di-set.");
  process.exit(1);
}

try {
  await runMigrations();
  console.log("✓ Migrasi schema selesai.");
} catch (e) {
  console.error("Migrasi gagal:", e.message);
  process.exit(1);
}
