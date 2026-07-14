#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(fileURLToPath(new URL("..", import.meta.url)));
const SCRIPT = resolve(ROOT, "scripts/ingest-uu.mjs");

function runIngest({ law, source, corpus }) {
  return spawnSync(process.execPath, [SCRIPT, "--law", law, "--file", source], {
    cwd: ROOT,
    env: { ...process.env, KNSL_CORPUS_PATH: corpus },
    encoding: "utf8",
  });
}

const dir = mkdtempSync(join(tmpdir(), "knsl-ingest-"));
const corpus = join(dir, "pasalCorpus.js");
const duplicateSource = join(dir, "duplicate.txt");
const validSource = join(dir, "valid.txt");

writeFileSync(corpus, "/** KNSL indexed statute corpus */\nexport const PASAL = [{\"l\":\"KUHP\",\"p\":\"1\",\"b\":\"\",\"t\":\"existing article\"}];\n");
const originalCorpus = readFileSync(corpus, "utf8");

writeFileSync(duplicateSource, `
BAB I
KETENTUAN UMUM
Pasal 1
Isi duplikat pertama.
Pasal 1
Isi duplikat kedua yang tidak boleh ditelan diam-diam.
`);

const duplicate = runIngest({ law: "UU 19/2019", source: duplicateSource, corpus });
assert.notEqual(duplicate.status, 0, "duplicate Pasal headers must fail the ingest");
assert.match(duplicate.stderr, /Duplicate Pasal header\(s\).*1/);
assert.equal(readFileSync(corpus, "utf8"), originalCorpus, "failed ingest must leave corpus untouched");

writeFileSync(validSource, `
BAB I
KETENTUAN UMUM
Pasal 1
Isi pasal pertama.
Pasal 2
Isi pasal kedua.
`);

const valid = runIngest({ law: "UU 19/2019", source: validSource, corpus });
assert.equal(valid.status, 0, valid.stderr || valid.stdout);
assert.match(valid.stdout, /ingested 2 pasal/);

const imported = await import(pathToFileURL(corpus).href + `?t=${Date.now()}`);
assert.deepEqual(
  imported.PASAL.map((e) => [e.l, e.p, e.t]),
  [
    ["KUHP", "1", "existing article"],
    ["UU 19/2019", "1", "Isi pasal pertama."],
    ["UU 19/2019", "2", "Isi pasal kedua."],
  ],
);

console.log("✓ ingest duplicate safety tests passed");
