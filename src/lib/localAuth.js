/** Local (non-Supabase) session helpers — persisted in localStorage */

import { clearToken } from "../knslApi.js";

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("knsl:auth");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user) {
  localStorage.setItem("knsl:auth", JSON.stringify(user));
  if (typeof window !== "undefined") {
    window.__KNSL_USER_ID__ = user.id;
    window.dispatchEvent(new Event("knsl:local-auth"));
  }
}

export function clearStoredUser() {
  localStorage.removeItem("knsl:auth");
  clearToken();
  if (typeof window !== "undefined") {
    window.__KNSL_USER_ID__ = "";
    window.dispatchEvent(new Event("knsl:local-auth"));
  }
}

export const LOCAL_AUTH_EVENT = "knsl:local-auth";
