/* ============================================================================
 * KNSL Legal Intelligence — Unit Tests (fixtures)
 *
 * Goal (per design): tests do not merely pass — they prove the architecture
 * FAILS EXPLICITLY when an invariant is violated.
 *   • Positive fixtures      -> validatePipeline must NOT throw.
 *   • Runtime negatives      -> the matching validator MUST throw (value-level).
 *   • Compile-time negatives -> see legalPipeline.compile-negatives.ts (@ts-expect-error).
 *
 * Framework-agnostic: run with `ts-node` or transpile + `node`. Exits non-zero
 * on any failure.
 * ==========================================================================*/

import type {
  FactMatrix, IssueSet, RetrievalSet, ElementTestReport,
} from "./legalPipeline.types";
import {
  InvariantError, validatePipeline,
  validateIssueSet, validateRetrievalSet, validateElementTestReport,
} from "./legalPipeline.validators";

declare const console: { log(...a: unknown[]): void; error(...a: unknown[]): void };
declare const process: { exit(code?: number): never };

/* ----------------------------- tiny harness ------------------------------- */
let passed = 0, failed = 0;
const ok = (name: string) => { passed++; console.log(`  PASS  ${name}`); };
const bad = (name: string, e: unknown) => { failed++; console.error(`  FAIL  ${name}\n        ${String(e)}`); };

function expectPass(name: string, fn: () => void) {
  try { fn(); ok(name); } catch (e) { bad(name, e); }
}
function expectThrow(name: string, code: string, fn: () => void) {
  try { fn(); bad(name, `expected throw [${code}], but nothing was thrown`); }
  catch (e) {
    if (e instanceof InvariantError && e.code === code) ok(`${name}  (threw ${code})`);
    else bad(name, `expected [${code}], got ${String(e)}`);
  }
}

/* ===========================================================================
 * POSITIVE FIXTURE — case 12 April 2026 (end-to-end, internally consistent)
 * ======================================================================== */

const FM: FactMatrix = {
  caseId: "case_2026_0412",
  facts: [
    { id: "fact_01", category: "party",        statement: "Korban bernama Budi Santoso.", certainty: "asserted", sourceRef: "para-1" },
    { id: "fact_02", category: "party",        statement: "Pelaku bernama Andi Pratama.", certainty: "asserted", sourceRef: "para-1" },
    { id: "fact_03", category: "timeline",     statement: "12 April 2026 ~22.30 WIB di warung kopi, Lowokwaru, Malang.", certainty: "asserted", sourceRef: "para-1" },
    { id: "fact_04", category: "relationship", statement: "Korban dan pelaku punya riwayat permasalahan utang piutang.", certainty: "asserted", sourceRef: "para-1" },
    { id: "fact_05", category: "action",       statement: "~23.00 adu mulut, dilerai saksi, pelaku meninggalkan lokasi.", certainty: "asserted", sourceRef: "para-2" },
    { id: "fact_06", category: "action",       statement: "Pelaku diduga menghadang korban di lokasi sepi ~30 menit kemudian.", certainty: "alleged", sourceRef: "para-3" },
    { id: "fact_07", category: "action",       statement: "Terjadi perkelahian di lokasi kedua.", certainty: "asserted", sourceRef: "para-3" },
    { id: "fact_08", category: "action",       statement: "Pelaku mengeluarkan pisau yang sebelumnya telah dibawa.", certainty: "asserted", sourceRef: "para-4" },
    { id: "fact_09", category: "action",       statement: "Pelaku menusuk korban beberapa kali pada dada dan perut.", certainty: "asserted", sourceRef: "para-4" },
    { id: "fact_10", category: "action",       statement: "Pelaku melarikan diri.", certainty: "asserted", sourceRef: "para-4" },
    { id: "fact_11", category: "action",       statement: "Warga membawa korban ke rumah sakit.", certainty: "asserted", sourceRef: "para-5" },
    { id: "fact_12", category: "action",       statement: "Menurut keterangan RS, korban meninggal akibat luka tusuk & kehilangan banyak darah.", certainty: "asserted", sourceRef: "para-5" },
    { id: "fact_13", category: "document",     statement: "Terdapat keterangan saksi, rekaman CCTV, dan barang bukti di lokasi.", certainty: "asserted", sourceRef: "para-6" },
    { id: "fact_14", category: "action",       statement: "Keluarga korban melapor ke kepolisian.", certainty: "asserted", sourceRef: "para-6" },
    { id: "fact_15", category: "action",       statement: "Kepolisian menetapkan Andi Pratama sebagai tersangka tindak pidana pembunuhan.", certainty: "asserted", sourceRef: "para-6", externalLabel: true },
  ],
  missingFacts: [
    { id: "fact_m1", category: "forensic",   description: "Visum et repertum / autopsi resmi." },
    { id: "fact_m2", category: "forensic",   description: "Jumlah & lokasi tiap luka tusuk." },
    { id: "fact_m3", category: "timeline",   description: "Jarak waktu dari penusukan hingga kematian." },
    { id: "fact_m4", category: "action",     description: "Siapa memulai kontak fisik di lokasi kedua." },
    { id: "fact_m6", category: "action",     description: "Niat/keadaan batin pelaku.", neededFor: "membedakan unsur sikap batin" },
  ],
};

const IS: IssueSet = {
  caseId: FM.caseId,
  emptyCategories: ["corporate"],
  issues: [
    { id: "issue_kill",   category: "criminal", statement: "Dugaan perbuatan yang mengakibatkan hilangnya nyawa orang lain.", confidence: "High",          factIds: ["fact_09", "fact_12"],                       derivedCertainty: "asserted" },
    { id: "issue_intent", category: "criminal", statement: "Elemen kesengajaan/perencanaan sebagai isu pembuktian.", confidence: "Moderate–High", reason: "Banyak indikator faktual; niat tetap isu pembuktian.", factIds: ["fact_05", "fact_06", "fact_08", "fact_09"], derivedCertainty: "alleged" },
    { id: "issue_alt",    category: "criminal", statement: "Potential alternative narratives: insufficient facts to evaluate.", confidence: "Not assessable", factIds: ["fact_07"],                       derivedCertainty: "asserted" },
    { id: "issue_debt",   category: "civil",    statement: "Sengketa utang piutang yang belum selesai (latar/motif).", confidence: "Low",        factIds: ["fact_04"],                               derivedCertainty: "asserted" },
    { id: "issue_proc",   category: "procedural", statement: "Kecukupan & keabsahan alat bukti serta proses penetapan tersangka.", confidence: "Moderate", factIds: ["fact_13", "fact_15"],                derivedCertainty: "asserted" },
  ],
};

const RS: RetrievalSet = {
  caseId: FM.caseId,
  maxResults: 8,
  notRetrieved: [
    { scope: "KUHAP", reason: "Ranah prosedural; belum ada di index." },
    { scope: "KUHPerdata", reason: "Utang piutang; di luar index & relevansi rendah." },
  ],
  retrieved: [
    { id: "kuhp_338", law: "KUHP", article: "338", modernEquivalent: "458", text: "Barang siapa dengan sengaja merampas nyawa orang lain, diancam karena pembunuhan...", issueIds: ["issue_kill", "issue_intent"], reasonRetrieved: "Relevant factual overlap exists: hilangnya nyawa akibat perbuatan pelaku.", relevance: "High", factIds: ["fact_09", "fact_12"], derivedCertainty: "asserted" },
    { id: "kuhp_340", law: "KUHP", article: "340", modernEquivalent: "459", text: "Barang siapa dengan sengaja dan dengan rencana terlebih dahulu merampas nyawa orang lain...", issueIds: ["issue_intent"], reasonRetrieved: "Relevant factual overlap with 'rencana terlebih dahulu' (sebagai bahan, bukan kesimpulan).", relevance: "Moderate–High", factIds: ["fact_05", "fact_06", "fact_08"], derivedCertainty: "alleged" },
    { id: "kuhp_351", law: "KUHP", article: "351", modernEquivalent: "466", text: "(3) Jika mengakibatkan mati, diancam dengan pidana penjara paling lama tujuh tahun.", issueIds: ["issue_kill", "issue_intent"], reasonRetrieved: "Alternative statutory candidate: kematian sebagai akibat penganiayaan.", relevance: "Moderate", isAlternativeCandidate: true, factIds: ["fact_09", "fact_12"], derivedCertainty: "asserted" },
    { id: "kuhp_353", law: "KUHP", article: "353", text: "(3) Jika perbuatan itu mengakibatkan kematian ... paling lama sembilan tahun.", issueIds: ["issue_intent"], reasonRetrieved: "Alternative statutory candidate (low): penganiayaan berencana berakibat mati.", relevance: "Low", isAlternativeCandidate: true, factIds: ["fact_05", "fact_06", "fact_08"], derivedCertainty: "alleged" },
  ],
};

const ETR: ElementTestReport = {
  caseId: FM.caseId,
  tests: [
    { id: "kuhp_338__subjek",  statuteId: "kuhp_338", element: "Barang siapa", supportingFactIds: ["fact_02"], contradictingFactIds: [], missingFactIds: [], status: "Strong support", derivedCertainty: "asserted" },
    { id: "kuhp_338__nyawa",   statuteId: "kuhp_338", element: "Merampas nyawa orang lain", supportingFactIds: ["fact_09", "fact_12"], contradictingFactIds: [], missingFactIds: ["fact_m1", "fact_m2"], status: "Moderate–High support", derivedCertainty: "asserted" },
    { id: "kuhp_338__sengaja", statuteId: "kuhp_338", element: "Dengan sengaja", supportingFactIds: ["fact_08", "fact_09"], contradictingFactIds: ["fact_07"], missingFactIds: ["fact_m4", "fact_m6"], status: "Moderate support", derivedCertainty: "asserted" },
    { id: "kuhp_340__rencana", statuteId: "kuhp_340", element: "Dengan rencana terlebih dahulu", supportingFactIds: ["fact_05", "fact_06", "fact_08"], contradictingFactIds: ["fact_07"], missingFactIds: ["fact_m6"], status: "Weak support", derivedCertainty: "alleged" },
    { id: "kuhp_351__aniaya",  statuteId: "kuhp_351", element: "Penganiayaan (perbuatan menimbulkan luka)", supportingFactIds: ["fact_09"], contradictingFactIds: [], missingFactIds: [], status: "Strong support", derivedCertainty: "asserted" },
    { id: "kuhp_351__batin",   statuteId: "kuhp_351", element: "Kehendak menganiaya (bukan menghilangkan nyawa)", supportingFactIds: ["fact_07"], contradictingFactIds: ["fact_09"], missingFactIds: ["fact_m6"], status: "Not enough facts", derivedCertainty: "asserted" },
    { id: "kuhp_351__mati",    statuteId: "kuhp_351", element: "Mengakibatkan mati", supportingFactIds: ["fact_12"], contradictingFactIds: [], missingFactIds: ["fact_m1"], status: "Moderate–High support", derivedCertainty: "asserted" },
  ],
};

console.log("\n# POSITIVE FIXTURE");
expectPass("end-to-end pipeline validates", () => validatePipeline(FM, IS, RS, ETR));

/* ===========================================================================
 * NEGATIVE FIXTURES — value-level (must THROW)
 * ======================================================================== */

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

console.log("\n# NEGATIVE FIXTURES (runtime invariants)");

// A. Traceability — empty factIds (type allows [], runtime must reject)
expectThrow("A. issue with empty factIds", "ISSUE_NO_TRACE", () => {
  const is = clone(IS); is.issues[0].factIds = []; validateIssueSet(is, FM);
});
expectThrow("A. retrieved statute with empty factIds", "STATUTE_NO_TRACE", () => {
  const rs = clone(RS); rs.retrieved[0].factIds = []; validateRetrievalSet(rs, IS, FM);
});

// B. Uncertainty propagation
expectThrow("B. issue certainty raised above ceiling", "UNCERTAINTY_RAISED", () => {
  const is = clone(IS); is.issues[1].derivedCertainty = "asserted"; // refs fact_06 (alleged)
  validateIssueSet(is, FM);
});
expectThrow("B. alleged fact -> asserted element conclusion", "UNCERTAINTY_RAISED", () => {
  const etr = clone(ETR); etr.tests[3].derivedCertainty = "asserted"; // kuhp_340__rencana refs fact_06
  validateElementTestReport(etr, RS, FM);
});

// D. Legal invariants
expectThrow("D. Stage 2 references a statute", "STATUTE_IN_ISSUE", () => {
  const is = clone(IS); is.issues[0].statement += " (lihat Pasal 338)"; validateIssueSet(is, FM);
});
expectThrow("D. Stage 4 verdict leaks via note", "VERDICT_LEAK", () => {
  const etr = clone(ETR); etr.tests[0].note = "Pelaku terbukti bersalah."; validateElementTestReport(etr, RS, FM);
});
expectThrow("D. retrieval exceeds maxResults", "RETRIEVAL_OVERFLOW", () => {
  const rs = clone(RS); rs.maxResults = 2; validateRetrievalSet(rs, IS, FM);
});
expectThrow("D. external label leaks as sole strong support", "EXTERNAL_LABEL_LEAK", () => {
  const etr = clone(ETR);
  etr.tests.push({ id: "leak", statuteId: "kuhp_338", element: "Merampas nyawa orang lain",
    supportingFactIds: ["fact_15"], contradictingFactIds: [], missingFactIds: [],
    status: "Strong support", derivedCertainty: "asserted" }); // fact_15 = police label
  validateElementTestReport(etr, RS, FM);
});

console.log(`\n# RESULT  ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
