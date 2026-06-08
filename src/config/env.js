/** Centralized environment & feature flags (build-time for VITE_*). */

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
  aiProxy: "/api/ai",
  claudeProxy: "/api/claude",
};

export const isSupabaseConfigured = !!(env.supabaseUrl && env.supabaseAnonKey);
