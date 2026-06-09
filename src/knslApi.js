/* KNSL Backend API client — auth, sync analisa & kontrak ke PostgreSQL */

const TOKEN_KEY = "knsl:jwt";
let backendCache = null;

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export function clearToken() {
  setToken(null);
}

export async function checkBackend() {
  if (backendCache !== null) return backendCache;
  try {
    const r = await fetch("/api/health", { method: "GET" });
    if (!r.ok) { backendCache = false; return false; }
    const d = await r.json();
    backendCache = d.backend === true && d.database === "connected";
    return backendCache;
  } catch {
    backendCache = false;
    return false;
  }
}

export function resetBackendCache() {
  backendCache = null;
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export async function register({ name, username, password, email }) {
  const data = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, username, password, email }),
  });
  setToken(data.token);
  return data;
}

export async function login(username, password) {
  const data = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
  setToken(data.token);
  return data;
}

export async function fetchMe() {
  return api("/api/auth/me");
}

export async function saveCaseAnalysis({ title, lawFilter, source, aiStatus, payload }) {
  return api("/api/case-analyses", {
    method: "POST",
    body: JSON.stringify({ title, lawFilter, source, aiStatus, payload }),
  });
}

export async function listCaseAnalyses() {
  return api("/api/case-analyses");
}

export async function getCaseAnalysis(id) {
  return api(`/api/case-analyses/${id}`);
}

export async function deleteCaseAnalysis(id) {
  return api(`/api/case-analyses/${id}`, { method: "DELETE" });
}

export async function saveContractReview(record) {
  return api("/api/contract-reviews", {
    method: "POST",
    body: JSON.stringify({
      name: record.name,
      perspective: record.ctx,
      usedAI: record.usedAI,
      aiHits: record.aiHits,
      payload: record,
    }),
  });
}

export async function listContractReviews() {
  return api("/api/contract-reviews");
}

export async function getContractReview(id) {
  return api(`/api/contract-reviews/${id}`);
}

export async function deleteContractReview(id) {
  return api(`/api/contract-reviews/${id}`, { method: "DELETE" });
}
