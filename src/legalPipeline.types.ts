/* ============================================================================
 * KNSL Legal Intelligence — Reasoning Pipeline Contract (TypeScript interfaces)
 *
 * Stage 1  Fact Extraction      RawCaseInput      -> FactMatrix
 * Stage 2  Issue Spotting       FactMatrix        -> IssueSet
 * Stage 3  Statute Retrieval    {issues, facts}   -> RetrievalSet
 * Stage 4  Element Testing      {retrieval, facts}-> ElementTestReport
 *
 * Three architectural constraints are encoded below:
 *   (1) TRACEABILITY        — every downstream claim references source factIds.
 *   (2) UNCERTAINTY PROPAGATION — a claim can never be MORE certain than its
 *                             least-certain supporting fact ("diduga" stays diduga).
 *   (3) STAGE ISOLATION     — RawCaseInput reaches Stage 1 ONLY. Stages 2–4 take
 *                             structured prior outputs, never the raw chronology.
 *
 * NOTE: TypeScript enforces *shape* (who references what, what reaches which stage).
 * Value-level invariants (e.g. certainty ceiling, "no statute in Stage 2") are
 * enforced by the runtime validators declared at the bottom — to be added in the
 * "JSON schema / validation" step, after unit tests.
 * ==========================================================================*/

/* ----------------------------- 0. shared ---------------------------------- */

export type CaseId = string;        // "case_2026_0412"
export type FactId = string;        // "fact_12"
export type IssueId = string;       // "issue_3"
export type StatuteId = string;     // "kuhp_338"
export type ElementId = string;     // "kuhp_338__sengaja"

/** Source certainty of a fact. "diduga" maps to 'alleged'. */
export type Certainty = "asserted" | "alleged" | "uncertain";

/** Numeric rank used to compute the certainty ceiling of derived claims. */
export type CertaintyRank = 0 | 1 | 2; // uncertain=0, alleged=1, asserted=2

/**
 * CONSTRAINT (1) TRACEABILITY.
 * Any claim produced after Stage 1 must extend this — it cannot exist without
 * pointing back to the facts that justify it.
 */
export interface Traceable {
  factIds: FactId[]; // non-empty by validator; [] is rejected downstream
}

/**
 * CONSTRAINT (2) UNCERTAINTY PROPAGATION.
 * Every derived claim carries the ceiling it inherited from its source facts.
 * Validator invariant: derivedCertainty === min(certainty of all referenced facts).
 * A claim may be LESS certain, never MORE.
 */
export interface UncertaintyAware {
  derivedCertainty: Certainty;
}

/* --------------------------- Stage 1: Facts ------------------------------- */

export type FactCategory =
  | "party" | "timeline" | "transaction" | "document"
  | "action" | "financial" | "relationship";

export interface Fact {
  id: FactId;
  category: FactCategory;
  /** The fact as stated — NO legal inference, NO crime labels. */
  statement: string;
  certainty: Certainty;
  /** Where it came from in the raw input (paragraph/sentence) for audit. */
  sourceRef?: string;
  /**
   * True when the statement is a label asserted by an external actor
   * (e.g. police "menetapkan tersangka pembunuhan"). Downstream stages must
   * treat it as a process-fact, NOT adopt it as their own conclusion.
   */
  externalLabel?: boolean;
}

export interface MissingFact {
  id: FactId;
  category: FactCategory | "forensic" | "procedural";
  description: string;
  /** What this missing fact would help determine (kept neutral, no conclusion). */
  neededFor?: string;
}

export interface FactMatrix {
  caseId: CaseId;
  facts: Fact[];
  missingFacts: MissingFact[];
  // INVARIANT (validator): no statute refs, no issue classification, no liability.
}

/* --------------------------- Stage 2: Issues ------------------------------ */

export type IssueCategory = "civil" | "criminal" | "corporate" | "procedural";

export type IssueConfidence =
  | "High" | "Moderate–High" | "Moderate" | "Low" | "Not assessable";

export interface Issue extends Traceable, UncertaintyAware {
  id: IssueId;
  category: IssueCategory;
  /** The issue framed as an open question — NOT a liability conclusion. */
  statement: string;
  confidence: IssueConfidence;
  reason?: string;
}

export interface IssueSet {
  caseId: CaseId;
  issues: Issue[];
  /** Categories explicitly found irrelevant -> rendered as
   *  "No relevant <category> issues identified." (avoids empty-category noise). */
  emptyCategories: IssueCategory[];
  // INVARIANT (validator): NO statute/pasal references at this stage.
}

/* ------------------------- Stage 3: Retrieval ----------------------------- */

export type LawSource = "KUHP" | "UU PT" | "UUD 1945";

export type RetrievalConfidence = "High" | "Moderate–High" | "Moderate" | "Low";

export interface RetrievedStatute extends Traceable, UncertaintyAware {
  id: StatuteId;
  law: LawSource;
  article: string;            // "338"
  /** KUHP 2023 (UU 1/2023) counterpart, if mapped & verified. */
  modernEquivalent?: string;  // "458"
  text: string;               // bunyi pasal, copied from the index
  issueIds: IssueId[];        // which issues triggered this retrieval
  /** Relevance rationale ONLY — must not test elements or conclude. */
  reasonRetrieved: string;
  relevance: RetrievalConfidence;
  isAlternativeCandidate?: boolean;
}

export interface RetrievalSet {
  caseId: CaseId;
  retrieved: RetrievedStatute[];
  /** Things deliberately NOT retrieved (out of index / low relevance). */
  notRetrieved?: Array<{ scope: string; reason: string }>;
  /** Hard cap (3–10). Validator rejects retrieved.length > maxResults. */
  maxResults: number;
  // INVARIANT (validator): no element testing, no "best statute", no verdict.
}

/* ----------------------- Stage 4: Element Testing ------------------------- */

/** Single, consistent status scale across all elements. */
export type ElementStatus =
  | "Strong support"
  | "Moderate–High support"
  | "Moderate support"
  | "Weak support"
  | "Not enough facts";

export interface ElementTest extends UncertaintyAware {
  id: ElementId;
  statuteId: StatuteId;
  /** The statutory element under test, e.g. "dengan sengaja". */
  element: string;
  // CONSTRAINT (1): granular traceability — each bucket points to facts.
  supportingFactIds: FactId[];
  contradictingFactIds: FactId[];
  missingFactIds: FactId[]; // reference MissingFact.id
  status: ElementStatus;
  note?: string;
}

export interface ElementTestReport {
  caseId: CaseId;
  tests: ElementTest[];
  // INVARIANT (validator): NO final verdict, NO selection of a "best" statute.
}

/* ------------------- Stage function signatures (isolation) ---------------- */
/**
 * CONSTRAINT (3) STAGE ISOLATION.
 * RawCaseInput is accepted by Stage 1 ONLY. The compiler refuses to pass it to
 * later stages, so e.g. Stage 4 physically cannot re-read the chronology.
 */
export interface RawCaseInput {
  caseId: CaseId;
  chronology: string;     // the only place raw text is allowed
  attachments?: string[];
}

export type ExtractFacts     = (input: RawCaseInput) => FactMatrix;
export type SpotIssues       = (facts: FactMatrix) => IssueSet;
export type RetrieveStatutes = (ctx: { issues: IssueSet; facts: FactMatrix }) => RetrievalSet;
export type TestElements     = (ctx: { retrieval: RetrievalSet; facts: FactMatrix }) => ElementTestReport;

/* NOTE: Behavior (certaintyRank/deriveCertainty/assertCertaintyCeiling + the
 * validators that enforce the INVARIANTs) lives in legalPipeline.validators.ts,
 * keeping this file a pure type contract. */

/* ------------------------------ Example ----------------------------------- *
 * Minimal typed sample from the 12 Apr 2026 case — useful as a unit-test
 * fixture (next step in the roadmap). Trimmed for brevity.

const fact_07: Fact = {
  id: "fact_07", category: "action",
  statement: "Pelaku menusuk korban beberapa kali pada dada dan perut.",
  certainty: "asserted", sourceRef: "para-4",
};
const fact_05: Fact = {
  id: "fact_05", category: "action",
  statement: "Pelaku diduga menghadang korban di lokasi sepi.",
  certainty: "alleged", sourceRef: "para-3",
};

const issue_intent: Issue = {
  id: "issue_intent", category: "criminal",
  statement: "Elemen kesengajaan/perencanaan sebagai isu pembuktian.",
  confidence: "Moderate–High", factIds: ["fact_05", "fact_07"],
  derivedCertainty: "alleged", // ceiling pulled down by fact_05 ("diduga")
};

const test_sengaja: ElementTest = {
  id: "kuhp_338__sengaja", statuteId: "kuhp_338", element: "dengan sengaja",
  supportingFactIds: ["fact_07"], contradictingFactIds: [], missingFactIds: ["fact_m1"],
  status: "Moderate support", derivedCertainty: "asserted",
};
* --------------------------------------------------------------------------- */

/* --------------------------- Build order ---------------------------------- *
 * 1) TypeScript interfaces        <- THIS FILE
 * 2) unit testing per stage       (mock each stage with typed fixtures above)
 * 3) JSON schema / validation     (generate from these types; enforce INVARIANTs)
 * 4) analyze/route.ts integration (chain pure stage fns; no stage skips isolation)
 * --------------------------------------------------------------------------- */
