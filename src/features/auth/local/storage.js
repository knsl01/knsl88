import { clearToken } from "../../../services/api/client.js";

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
  if (typeof window !== "undefined") window.__KNSL_USER_ID__ = user.id;
}

export function clearStoredUser() {
  localStorage.removeItem("knsl:auth");
  clearToken();
  if (typeof window !== "undefined") window.__KNSL_USER_ID__ = "";
}

export function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem("knsl:accounts") || "{}");
  } catch {
    return {};
  }
}

export async function hashPW(pw) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw + ":knsl-salt-2026"));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function saveAccount(username, data) {
  const accs = getAccounts();
  accs[username.toLowerCase()] = data;
  localStorage.setItem("knsl:accounts", JSON.stringify(accs));
}
