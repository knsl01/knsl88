/**
 * Auth service — documents the three strategies:
 * 1. Supabase (primary when VITE_SUPABASE_* set) — AuthContext + AuthGate
 * 2. Vercel PostgreSQL JWT — services/api/client.js (optional legacy backend)
 * 3. Local username/password — features/auth/local (localStorage fallback)
 *
 * React components consume useAuth() from contexts/AuthContext.jsx.
 * This module exposes non-React helpers for API/backend detection.
 */
export { isSupabaseConfigured } from "../../config/env.js";
export { checkBackend, getToken, clearToken, login, register } from "../api/client.js";
