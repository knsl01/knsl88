import * as supabaseProvider from "../providers/supabase.js";
import * as apiProvider from "../providers/api.js";
import { isSupabaseConfigured } from "../../config/env.js";
import { getToken } from "../../services/api/client.js";

export async function save(record) {
  if (isSupabaseConfigured) {
    return supabaseProvider.saveContractReviewCloud(record);
  }
  if (getToken()) {
    return apiProvider.saveContractReview(record);
  }
  return null;
}

export async function list() {
  if (isSupabaseConfigured) return supabaseProvider.listContractReviewsCloud();
  if (getToken()) return apiProvider.listContractReviews();
  return [];
}
