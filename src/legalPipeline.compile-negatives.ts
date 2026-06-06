/* ============================================================================
 * COMPILE-TIME NEGATIVE FIXTURES
 *
 * These violations are caught by the TYPE SYSTEM, not runtime. Each is marked
 * with `@ts-expect-error`: if the expected compile error ever STOPS happening,
 * tsc itself fails ("Unused '@ts-expect-error' directive") — so the guarantee
 * is self-testing. This file is meant to COMPILE CLEAN under `tsc --strict`.
 * ==========================================================================*/

import type {
  Fact, FactMatrix, Issue, RetrievedStatute, ElementTest,
  SpotIssues, TestElements, RawCaseInput, IssueSet, RetrievalSet,
} from "./legalPipeline.types";

declare const raw: RawCaseInput;
declare const fm: FactMatrix;
declare const is: IssueSet;
declare const rs: RetrievalSet;
declare const spotIssues: SpotIssues;
declare const testElements: TestElements;

/* A. TRACEABILITY (shape) ---------------------------------------------------*/
// @ts-expect-error issue cannot exist without factIds
const a1: Issue = { id: "i", category: "criminal", statement: "x", confidence: "High", derivedCertainty: "asserted" };
// @ts-expect-error retrieved statute cannot exist without factIds
const a2: RetrievedStatute = { id: "s", law: "KUHP", article: "338", text: "...", issueIds: [], reasonRetrieved: "x", relevance: "High", derivedCertainty: "asserted" };

/* C. STAGE ISOLATION --------------------------------------------------------*/
// @ts-expect-error Stage 4 must not consume RawCaseInput
testElements(raw);
// @ts-expect-error Stage 2 cannot read raw chronology — FactMatrix has no such field
const leak: string = (fm as FactMatrix).chronology;
// @ts-expect-error Stage 2 input is FactMatrix, not raw text
spotIssues(raw);

/* D. LEGAL INVARIANTS (shape subset) ---------------------------------------*/
// @ts-expect-error Stage 2 shape carries no statute reference field
const d1: Issue = { id: "i", category: "criminal", statement: "x", confidence: "High", factIds: ["f1"], derivedCertainty: "asserted", statuteId: "kuhp_338" };
// @ts-expect-error Stage 4 shape carries no verdict/conclusion field
const d2: ElementTest = { id: "e", statuteId: "s", element: "x", supportingFactIds: [], contradictingFactIds: [], missingFactIds: [], status: "Strong support", derivedCertainty: "asserted", verdict: "bersalah" };

export { a1, a2, leak, d1, d2 };
