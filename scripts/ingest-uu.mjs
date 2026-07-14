#!/usr/bin/env node
/**
 * Ingest official UU text into src/data/pasalCorpus.js.
 *
 * Usage:
 *   node scripts/ingest-uu.mjs --law "UU 31/1999 jo. 20/2001" --file scripts/_stage.txt
 *
 * The --law value MUST exist in src/data/lawRegistry.js (LAW_META) so badges,
 * colors and the filter family are wired. Re-ingesting the same --law replaces
 * its previous entries (idempotent). Parsing rules:
 *   - Article boundary:  a line that is "Pasal <N>" (N may carry a letter,
 *     e.g. 12A / 12 B).  Everything until the next such line is its text.
 *   - `b` (subtitle) = the most recent "BAB ..." / "Bagian ..." heading.
 *   - Boilerplate (penjelasan, lembaran negara, ttd, etc.) before the first
 *     "Pasal" is ignored.
 */
import { readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CORPUS = process.env.KNSL_CORPUS_PATH
  ? resolve(ROOT, process.env.KNSL_CORPUS_PATH)
  : resolve(ROOT, "src/data/pasalCorpus.js");

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const law = arg("--law");
const file = arg("--file");
if (!law || !file) {
  console.error("Usage: node scripts/ingest-uu.mjs --law \"<code>\" --file <path>");
  process.exit(1);
}

const { LAW_META } = await import(resolve(ROOT, "src/data/lawRegistry.js"));
if (!LAW_META[law]) {
  console.error(`✗ Law code "${law}" is not registered in src/data/lawRegistry.js (LAW_META).`);
  console.error(`  Register it there first so the filter family + badge are wired.`);
  process.exit(1);
}

const raw = readFileSync(resolve(ROOT, file), "utf8");

/* ---- parse ---- */
const PASAL_RE = /^\s*pasal\s+(\d+\s*[A-Za-z]?)\s*$/i;
const HEAD_RE = /^\s*(BAB\s+[IVXLCDM]+\b.*|Bagian\s+(Ke\w+|Pertama|Kedua|Ketiga|Keempat|Kelima)\b.*)$/i;
// PDF page-break artifacts that leak into article text — dropped from `t`.
const NOISE_RE = [
  /^presiden\s*$/i,
  /^republik\s+indonesia\s*$/i,
  /^salinan\s*$/i,
  /^-?\s*\d{1,4}\s*-?$/, // bare page numbers / "- 3 -"
  /^www\./i,
  /^\f+$/,
];
const isNoise = (s) => !s || NOISE_RE.some((re) => re.test(s));

const lines = raw.replace(/\r\n?/g, "\n").split("\n");
const out = [];
let curBab = "";
let cur = null;

const flush = () => {
  if (cur) {
    const t = cur.buf.join(" ").replace(/\s+/g, " ").trim();
    if (t) out.push({ l: law, p: cur.p, b: cur.b, t });
  }
  cur = null;
};

// A short ALL-CAPS line right after "BAB ..." is the chapter title — fold it in.
const isTitleLine = (s) =>
  s && s.length <= 80 && !PASAL_RE.test(s) && /[A-Z]/.test(s) && s === s.toUpperCase() && /^[A-Z0-9 ,.\-/()]+$/.test(s);

for (let i = 0; i < lines.length; i++) {
  const ln = lines[i];
  const mP = ln.match(PASAL_RE);
  if (mP) {
    flush();
    // OCR fix: some PDFs render 0 as letter O (e.g. "Pasal 3O" -> 30, "4OA" -> 40A).
    // Pasal suffixes are A–H, never O, so converting O->0 inside the number is safe.
    const pnum = mP[1].replace(/\s+/g, "").toUpperCase().replace(/O/g, "0");
    cur = { p: pnum, b: curBab, buf: [] };
    continue;
  }
  const mH = ln.match(HEAD_RE);
  if (mH) {
    let head = mH[1].replace(/\s+/g, " ").trim();
    // absorb a following ALL-CAPS title line (e.g. "BAB II" \n "TINDAK PIDANA KORUPSI")
    while (i + 1 < lines.length && isTitleLine(lines[i + 1].trim())) {
      head += " " + lines[i + 1].trim().replace(/\s+/g, " ");
      i++;
    }
    curBab = head;
    continue;
  }
  if (cur && !isNoise(ln.trim())) cur.buf.push(ln.trim());
}
flush();

if (!out.length) {
  console.error("✗ No 'Pasal <N>' blocks found. Check the text format (each article must start with a line like 'Pasal 2').");
  process.exit(1);
}

/* Fail before writing: duplicate article boundaries usually mean corrupted OCR
   or an amendment text that needs manual splitting, and silently keeping one
   copy would truncate the legal corpus. */
const seen = new Set();
const duplicates = [];
for (const e of out) {
  if (seen.has(e.p)) duplicates.push(e.p);
  seen.add(e.p);
}
if (duplicates.length) {
  console.error(`✗ Duplicate Pasal header(s) for ${law}: ${[...new Set(duplicates)].join(", ")}`);
  console.error("  Aborting without writing. Split/clean the source text so each Pasal appears exactly once.");
  process.exit(1);
}

/* ---- merge into corpus ---- */
const { PASAL } = await import(CORPUS + `?t=${Date.now()}`);
const kept = PASAL.filter((e) => e.l !== law); // drop previous entries for this law
const merged = [...kept, ...out];

const header = "/** KNSL indexed statute corpus */\n";
const tmp = resolve(dirname(CORPUS), `.pasalCorpus.${process.pid}.${Date.now()}.tmp`);
try {
  writeFileSync(tmp, header + "export const PASAL = " + JSON.stringify(merged) + ";\n");
  renameSync(tmp, CORPUS);
} catch (e) {
  try { rmSync(tmp, { force: true }); } catch {}
  throw e;
}

console.log(`✓ ${law}: ingested ${out.length} pasal (was ${PASAL.length - kept.length}, corpus now ${merged.length} total).`);
console.log(`  Pasal: ${out.slice(0, 12).map((e) => e.p).join(", ")}${out.length > 12 ? " …" : ""}`);
