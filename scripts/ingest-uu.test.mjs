#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const INGEST = resolve(ROOT, "scripts/ingest-uu.mjs");
const CORPUS = resolve(ROOT, "src/data/pasalCorpus.js");
const LAW = "UU 31/1999 jo. 20/2001";

const originalCorpus = readFileSync(CORPUS, "utf8");
const workDir = mkdtempSync(join(tmpdir(), "knsl-ingest-"));

function runIngest(file) {
  return spawnSync(process.execPath, [INGEST, "--law", LAW, "--file", file], {
    cwd: ROOT,
    encoding: "utf8",
  });
}

try {
  const duplicateFixture = join(workDir, "duplicate.txt");
  writeFileSync(
    duplicateFixture,
    [
      "Pasal 1",
      "Ayat pertama harus tetap ada.",
      "",
      "Pasal 1",
      "Ayat kedua tidak boleh dibuang diam-diam.",
      "",
    ].join("\n"),
  );

  const duplicate = runIngest(duplicateFixture);
  assert.notEqual(duplicate.status, 0, "duplicate pasal ingest must fail");
  assert.match(duplicate.stderr, /Duplicate Pasal blocks found/);
  assert.match(duplicate.stderr, /1 \(2x\)/);
  assert.equal(readFileSync(CORPUS, "utf8"), originalCorpus, "failed ingest must not rewrite the corpus");

  const uniqueFixture = join(workDir, "unique.txt");
  writeFileSync(
    uniqueFixture,
    [
      "BAB I",
      "KETENTUAN TEST",
      "",
      "Pasal 901",
      "Konten pasal uji pertama.",
      "",
      "Pasal 902A",
      "Konten pasal uji kedua.",
      "",
    ].join("\n"),
  );

  const unique = runIngest(uniqueFixture);
  assert.equal(unique.status, 0, unique.stderr || unique.stdout);
  assert.match(unique.stdout, /ingested 2 pasal/);
  assert.equal(existsSync(`${CORPUS}.${unique.pid}.tmp`), false, "successful ingest must not leave its temp file behind");

  const { PASAL } = await import(`${pathToFileURL(CORPUS).href}?t=${Date.now()}`);
  const inserted = PASAL.filter((entry) => entry.l === LAW);
  assert.deepEqual(
    inserted.map((entry) => entry.p),
    ["901", "902A"],
    "successful ingest should replace the law with parsed unique articles",
  );
  assert.equal(inserted[0].b, "BAB I KETENTUAN TEST");
  assert.match(inserted[1].t, /Konten pasal uji kedua/);

  console.log("✓ ingest-uu duplicate guard and write path passed");
} finally {
  writeFileSync(CORPUS, originalCorpus);
  rmSync(workDir, { recursive: true, force: true });
}
