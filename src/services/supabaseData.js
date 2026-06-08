import { supabase, isSupabaseConfigured } from "../lib/supabase.js";

export function isCloudSyncEnabled() {
  return isSupabaseConfigured && !!supabase;
}

export async function saveCaseAnalysisCloud({ title, lawFilter, source, aiStatus, payload }) {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.from("case_analyses").insert({
    user_id: user.id,
    title: title || "Analisa perkara",
    law_filter: lawFilter || "all",
    source: source || "heuristic",
    ai_status: aiStatus || null,
    payload,
  }).select("id").single();

  if (error) throw error;
  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "save_case_analysis",
    target: data.id,
    meta: { title },
  });
  return data.id;
}

export async function saveContractReviewCloud(record) {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const risk = record.risk || {};
  const { data, error } = await supabase.from("contract_reviews").insert({
    user_id: user.id,
    name: record.name || "Kontrak",
    perspective: record.ctx || null,
    used_ai: !!record.usedAI,
    ai_hits: record.aiHits || 0,
    risk_score: risk.score ?? null,
    risk_category: risk.category ?? null,
    payload: record,
  }).select("id").single();

  if (error) throw error;
  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "save_contract_review",
    target: data.id,
    meta: { name: record.name },
  });
  return data.id;
}

export async function listCaseAnalysesCloud() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("case_analyses")
    .select("id, title, law_filter, source, ai_status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}

export async function listContractReviewsCloud() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("contract_reviews")
    .select("id, name, perspective, used_ai, ai_hits, risk_score, risk_category, created_at, payload")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return data || [];
}
