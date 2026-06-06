/* ============================================================================
 * KNSL Legal Intelligence — Runtime Validators
 *
 * TypeScript enforces SHAPE. These validators enforce the VALUE-level invariants
 * the type system cannot express. Every one of them THROWS on violation — the
 * whole point is that the architecture fails loudly, never silently.
 * ==========================================================================*/

import type {
  Certainty, CertaintyRank, Fact, FactId, FactMatrix,
  IssueSet, RetrievalSet, ElementTestReport, Traceable, UncertaintyAware,
} from "./legalPipeline.types";

export class InvariantError extends Error {
  constructor(public code: string, message: string) {
    super(`[${code}] ${message}`);
    this.name = "InvariantError";
  }
}

/* ----------------------- uncertainty propagation -------------------------- */

const RANK: Record<Certainty, CertaintyRank> = { uncertain: 0, alleged: 1, asserted: 2 };
const BY_RANK: Certainty[] = ["uncertain", "alleged", "asserted"];

export function certaintyRank(c: Certainty): CertaintyRank { return RANK[c]; }

/** derivedCertainty ceiling = the LEAST certain of the referenced facts. */
export function deriveCertainty(sourceFacts: Fact[]): Certainty {
  if (sourceFacts.length === 0) return "uncertain";
  let min: CertaintyRank = 2;
  for (const f of sourceFacts) if (RANK[f.certainty] < min) min = RANK[f.certainty];
  return BY_RANK[min];
}

/** CONSTRAINT (2): a claim may never be MORE certain than its sources allow. */
export function assertCertaintyCeiling(
  claim: UncertaintyAware & Traceable,
  facts: Readonly<Record<FactId, Fact>>,
  ctx = "claim",
): void {
  const refs = claim.factIds.map((id) => facts[id]).filter(Boolean) as Fact[];
  const ceiling = deriveCertainty(refs);
  if (RANK[claim.derivedCertainty] > RANK[ceiling]) {
    throw new InvariantError(
      "UNCERTAINTY_RAISED",
      `${ctx}: derivedCertainty='${claim.derivedCertainty}' exceeds ceiling='${ceiling}' from facts [${claim.factIds.join(", ")}]`,
    );
  }
}

/* ------------------------------ helpers ----------------------------------- */

const STATUTE_RE = /\bpasal\s*\d+/i;
const VERDICT_RE = /\b(terbukti|bersalah|divonis|dijatuhi|memenuhi seluruh unsur|dapat dipidana|pasal yang tepat|vonis)\b/i;

const factMap = (fm: FactMatrix): Record<FactId, Fact> =>
  Object.fromEntries(fm.facts.map((f) => [f.id, f]));
const missingSet = (fm: FactMatrix): Set<FactId> =>
  new Set(fm.missingFacts.map((m) => m.id));

function requireFacts(ids: FactId[], known: Record<FactId, Fact>, code: string, ctx: string) {
  if (ids.length === 0) throw new InvariantError(code, `${ctx}: empty factIds (traceability)`);
  for (const id of ids) if (!known[id]) throw new InvariantError(code, `${ctx}: unknown factId '${id}'`);
}

/* --------------------------- Stage 1: Facts ------------------------------- */

export function validateFactMatrix(fm: FactMatrix): void {
  const seen = new Set<FactId>();
  for (const f of fm.facts) {
    if (seen.has(f.id)) throw new InvariantError("DUP_FACT", `duplicate factId '${f.id}'`);
    seen.add(f.id);
    if (STATUTE_RE.test(f.statement)) {
      throw new InvariantError("STATUTE_IN_FACTS", `fact '${f.id}' cites a statute: "${f.statement}"`);
    }
  }
}

/* --------------------------- Stage 2: Issues ------------------------------ */

export function validateIssueSet(is: IssueSet, fm: FactMatrix): void {
  const facts = factMap(fm);
  for (const issue of is.issues) {
    requireFacts(issue.factIds, facts, "ISSUE_NO_TRACE", `issue '${issue.id}'`);
    assertCertaintyCeiling(issue, facts, `issue '${issue.id}'`);
    const blob = `${issue.statement} ${issue.reason ?? ""}`;
    if (STATUTE_RE.test(blob)) {
      throw new InvariantError("STATUTE_IN_ISSUE", `issue '${issue.id}' references a statute prematurely`);
    }
  }
}

/* ------------------------- Stage 3: Retrieval ----------------------------- */

export function validateRetrievalSet(rs: RetrievalSet, is: IssueSet, fm: FactMatrix): void {
  const facts = factMap(fm);
  const issueIds = new Set(is.issues.map((i) => i.id));
  if (rs.retrieved.length > rs.maxResults) {
    throw new InvariantError("RETRIEVAL_OVERFLOW", `retrieved ${rs.retrieved.length} > maxResults ${rs.maxResults}`);
  }
  for (const s of rs.retrieved) {
    requireFacts(s.factIds, facts, "STATUTE_NO_TRACE", `statute '${s.id}'`);
    assertCertaintyCeiling(s, facts, `statute '${s.id}'`);
    for (const iid of s.issueIds) {
      if (!issueIds.has(iid)) throw new InvariantError("STATUTE_BAD_ISSUE", `statute '${s.id}' cites unknown issue '${iid}'`);
    }
  }
}

/* ----------------------- Stage 4: Element Testing ------------------------- */

export function validateElementTestReport(report: ElementTestReport, rs: RetrievalSet, fm: FactMatrix): void {
  const facts = factMap(fm);
  const missing = missingSet(fm);
  const statuteIds = new Set(rs.retrieved.map((s) => s.id));

  for (const t of report.tests) {
    if (!statuteIds.has(t.statuteId)) {
      throw new InvariantError("ELEMENT_BAD_STATUTE", `test '${t.id}' references un-retrieved statute '${t.statuteId}'`);
    }
    for (const id of [...t.supportingFactIds, ...t.contradictingFactIds]) {
      if (!facts[id]) throw new InvariantError("ELEMENT_BAD_FACT", `test '${t.id}' references unknown fact '${id}'`);
    }
    for (const id of t.missingFactIds) {
      if (!missing.has(id)) throw new InvariantError("ELEMENT_BAD_MISSING", `test '${t.id}' references unknown missing-fact '${id}'`);
    }
    const usedFactIds = [...t.supportingFactIds, ...t.contradictingFactIds];
    assertCertaintyCeiling({ factIds: usedFactIds, derivedCertainty: t.derivedCertainty }, facts, `test '${t.id}'`);

    if (t.note && VERDICT_RE.test(t.note)) {
      throw new InvariantError("VERDICT_LEAK", `test '${t.id}' note contains a conclusion: "${t.note}"`);
    }

    const strong = t.status === "Strong support" || t.status === "Moderate–High support";
    const allExternal = t.supportingFactIds.length > 0 &&
      t.supportingFactIds.every((id) => facts[id]?.externalLabel === true);
    if (strong && allExternal) {
      throw new InvariantError("EXTERNAL_LABEL_LEAK", `test '${t.id}' rests a '${t.status}' solely on external-label fact(s)`);
    }
  }
}

/* ------------------------- end-to-end convenience ------------------------- */

export function validatePipeline(
  fm: FactMatrix, is: IssueSet, rs: RetrievalSet, report: ElementTestReport,
): void {
  validateFactMatrix(fm);
  validateIssueSet(is, fm);
  validateRetrievalSet(rs, is, fm);
  validateElementTestReport(report, rs, fm);
}
