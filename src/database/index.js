/**
 * Database layer — single entry for persistence.
 * Hides whether data lives in Supabase, Vercel PostgreSQL, or local storage.
 */
import * as caseAnalysis from "./repositories/caseAnalysisRepository.js";
import * as contractReview from "./repositories/contractReviewRepository.js";

export const db = {
  caseAnalyses: caseAnalysis,
  contractReviews: contractReview,
};

export { isSupabaseConfigured } from "../config/env.js";
