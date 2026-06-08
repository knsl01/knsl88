import { createClient } from "@supabase/supabase-js";
import { env, isSupabaseConfigured } from "../config/env.js";

export { isSupabaseConfigured };

export const supabase = isSupabaseConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
      },
    })
  : null;
