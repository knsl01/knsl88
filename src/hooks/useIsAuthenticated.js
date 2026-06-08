import { useAuth } from "../contexts/AuthContext.jsx";
import { useLocalUser } from "./useLocalUser.js";

/** True when user has a valid Supabase session or local dev session */
export function useIsAuthenticated() {
  const { isSupabase, user, loading, recoveryMode } = useAuth();
  const localUser = useLocalUser();

  if (isSupabase) {
    return { isAuthenticated: !!user, loading, recoveryMode, user };
  }

  return { isAuthenticated: !!localUser, loading: false, recoveryMode: false, user: localUser };
}
