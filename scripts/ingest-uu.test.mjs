#!/usr/bin/env node
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const ROOT = resolve(import.meta.dirname, "..");
const CORPUS = resolve(ROOT, "src/data/pasalCorpus.js");
const before = readFileSync(CORPUS, "utf8");
const dir = mkdtempSync(join(tmpdir(), "knsl-ingest-"));

try {
  const source = join(dir, "duplicate-pasal.txt");
  writeFileSync(
    source,
    [
      "BAB I",
      "KETENTUAN UMUM",
      "Pasal 1",
      "Teks pertama.",
      "Pasal 1",
      "Teks kedua yang tidak boleh hilang diam-diam.",
      "",
    ].join("\n"),
  );

  const result = spawnSync(
    process.execPath,
    ["scripts/ingest-uu.mjs", "--law", "UU 20/2003", "--file", source],
    { cwd: ROOT, encoding: "utf8" },
  );

  assert.notEqual(result.status, 0, "duplicate pasal ingest should fail");
  assert.match(result.stderr, /Duplicate Pasal blocks found/, "failure should explain duplicate pasal blocks");
  assert.equal(readFileSync(CORPUS, "utf8"), before, "failed duplicate ingest must not mutate pasalCorpus.js");
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log("✓ ingest duplicate-pasal guard");
