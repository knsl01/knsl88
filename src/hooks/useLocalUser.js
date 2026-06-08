import { useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase.js";
import { getStoredUser, LOCAL_AUTH_EVENT } from "../lib/localAuth.js";

/** Reactive local user for dev / non-Supabase mode */
export function useLocalUser() {
  const [user, setUser] = useState(() => (isSupabaseConfigured ? null : getStoredUser()));

  useEffect(() => {
    if (isSupabaseConfigured) {
      setUser(null);
      return;
    }
    const refresh = () => setUser(getStoredUser());
    refresh();
    window.addEventListener(LOCAL_AUTH_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(LOCAL_AUTH_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return user;
}
