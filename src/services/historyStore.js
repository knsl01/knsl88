import {
  isCloudSyncEnabled,
  listCaseAnalysesCloud,
  getCaseAnalysisCloud,
  deleteCaseAnalysisCloud,
  listContractReviewsCloud,
  getContractReviewCloud,
  deleteContractReviewCloud,
} from "./supabaseData.js";
import {
  getToken,
  listCaseAnalyses as listCaseAnalysesApi,
  listContractReviews as listContractReviewsApi,
} from "../knslApi.js";

function tsFrom(row) {
  if (row.ts) return row.ts;
  if (row.created_at) return new Date(row.created_at).getTime();
  if (row.createdAt) return new Date(row.createdAt).getTime();
  return Date.now();
}

function mapCaseRow(row, { remote = false } = {}) {
  const payload = row.payload || {};
  return {
    id: row.id,
    title: row.title || "Analisa perkara",
    ts: tsFrom(row),
    lawFilter: row.law_filter || row.lawFilter || "all",
    source: row.source || "heuristic",
    aiStatus: row.ai_status ?? row.aiStatus ?? null,
    facts: payload.fm?.facts?.length ?? row.summary?.facts ?? 0,
    issues: payload.is?.issues?.length ?? row.summary?.issues ?? 0,
    remote,
  };
}

function mapContractRow(row, { remote = false } = {}) {
  const payload = row.payload || row;
  const clauses = payload.clauses || [];
  return {
    id: row.id,
    name: row.name || payload.name || "Kontrak",
    ts: tsFrom(row),
    score: row.risk_score ?? payload.risk?.score ?? null,
    category: row.risk_category ?? payload.risk?.category ?? "—",
    clauses: clauses.length || row.clause_count || 0,
    remote,
    payload: row.payload || null,
  };
}

export async function fetchCaseAnalysisHistory() {
  if (isCloudSyncEnabled()) {
    const rows = await listCaseAnalysesCloud();
    return rows.map((r) => mapCaseRow(r, { remote: true }));
  }
  if (getToken()) {
    try {
      const data = await listCaseAnalysesApi();
      const items = data.items || data || [];
      return items.map((r) => mapCaseRow(r, { remote: true }));
    } catch {
      return [];
    }
  }
  return [];
}

export async function loadCaseAnalysisRecord(id, { remote = true } = {}) {
  if (remote && isCloudSyncEnabled()) {
    const row = await getCaseAnalysisCloud(id);
    if (!row) return null;
    return {
      data: row.payload,
      title: row.title,
      filter: row.law_filter || "all",
      id: row.id,
    };
  }
  if (remote && getToken()) {
    const res = await fetch(`/api/case-analyses/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) return null;
    const { item } = await res.json();
    if (!item) return null;
    return {
      data: item.payload,
      title: item.title,
      filter: item.law_filter || "all",
      id: item.id,
    };
  }
  return null;
}

export async function removeCaseAnalysisRecord(id, { remote = true } = {}) {
  if (remote && isCloudSyncEnabled()) {
    await deleteCaseAnalysisCloud(id);
    return;
  }
  if (remote && getToken()) {
    await fetch(`/api/case-analyses/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
  }
}

export async function fetchContractReviewHistory(localIndex = []) {
  if (isCloudSyncEnabled()) {
    try {
      const rows = await listContractReviewsCloud();
      return rows.map((r) => mapContractRow(r, { remote: true }));
    } catch {
      return localIndex;
    }
  }
  if (getToken()) {
    try {
      const data = await listContractReviewsApi();
      const items = data.items || data || [];
      return items.map((r) => mapContractRow(r, { remote: true }));
    } catch {
      return localIndex;
    }
  }
  return localIndex;
}

export async function loadContractReviewRecord(id, meta, localGet) {
  if (meta?.remote && meta.payload) return meta.payload;

  if (meta?.remote && isCloudSyncEnabled()) {
    const row = await getContractReviewCloud(id);
    if (row?.payload) return { ...row.payload, cloudId: row.id };
  }

  if (meta?.remote && getToken()) {
    const res = await fetch(`/api/contract-reviews/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (res.ok) {
      const { item } = await res.json();
      if (item?.payload) return item.payload;
    }
  }

  if (localGet) return localGet(id);
  return null;
}

export async function removeContractReviewRecord(id, { remote = false } = {}, localDelete) {
  if (remote && isCloudSyncEnabled()) {
    await deleteContractReviewCloud(id);
    return;
  }
  if (remote && getToken()) {
    await fetch(`/api/contract-reviews/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return;
  }
  if (localDelete) await localDelete(id);
}

export function isRemoteHistoryEnabled() {
  return isCloudSyncEnabled() || !!getToken();
}
