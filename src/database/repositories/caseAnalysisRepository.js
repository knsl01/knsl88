import * as supabaseProvider from "../providers/supabase.js";
import * as apiProvider from "../providers/api.js";
import { isSupabaseConfigured } from "../../config/env.js";
import { getToken } from "../../services/api/client.js";

/**
 * Unified case-analysis persistence.
 * Priority: Supabase → Vercel PostgreSQL API → no-op.
 */
export async function save({ title, lawFilter, source, aiStatus, payload }) {
  if (isSupabaseConfigured) {
    return supabaseProvider.saveCaseAnalysisCloud({ title, lawFilter, source, aiStatus, payload });
  }
  if (getToken()) {
    return apiProvider.saveCaseAnalysis({ title, lawFilter, source, aiStatus, payload });
  }
  return null;
}

export async function list() {
  if (isSupabaseConfigured) return supabaseProvider.listCaseAnalysesCloud();
  if (getToken()) return apiProvider.listCaseAnalyses();
  return [];
}
