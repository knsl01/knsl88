/** Application service: persist analyses & contract reviews via database layer. */
import { db } from "../database/index.js";

export function persistCaseAnalysis(data) {
  return db.caseAnalyses.save(data).catch(() => null);
}

export function persistContractReview(record) {
  return db.contractReviews.save(record).catch(() => null);
}
