/* ============================================================================
 * KNSL Legal Intelligence — AI Agent Layer
 *
 * Centralized agent for Contract Review & Case Analysis.
 * Design: heuristic floor + AI enrichment; strict JSON; retry; no verdicts.
 * ========================================================================== */

import {
  resolveAiProvider,
  isLocalDevHost,
  getAiProxyEndpoint,
  setLastAiMeta,
  setLastAiError,
  formatAiError,
} from "./aiProviders.js";
import {
  CASE_SYSTEM,
  CASE_SCHEMA,
  CASE_RERANK_SYSTEM,
  CR_SYSTEM_BASE,
} from "./agents/prompts/index.js";

export const DEFAULT_MODEL = "auto";

/** Strip markdown fences and parse JSON with a forgiving fallback. */
export function parseAgentJson(text) {
  const raw = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(raw.slice(start, end + 1));
    throw new Error("JSON agent tidak valid");
  }
}

const LLM_TIMEOUT_MS = 65000;

async function fetchAi(ep, body, prov, timeoutMs = LLM_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(ep, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const raw = data.error || `AI HTTP ${resp.status}`;
      throw new Error(formatAiError(raw, prov));
    }
    return data;
  } catch (e) {
    if (e && e.name === "AbortError") {
      throw new Error(`Permintaan AI timeout (${Math.round(timeoutMs / 1000)}s). Coba lagi, ganti provider ke Gemini/Groq, atau matikan AI untuk hasil heuristik.`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Unified LLM call — routes to Gemini / Groq / Ollama / Claude via /api/ai. */
export async function callLLM({
  system,
  user,
  maxTokens = 2000,
  provider,
  retries = 2,
  timeoutMs,
  responseFormat = "text",
}) {
  const ep = getAiProxyEndpoint();
  const prov = resolveAiProvider(provider);
  if (prov === "ollama" && !isLocalDevHost()) {
    throw new Error("Ollama hanya untuk dev lokal. Di knsl.tech pilih Google Gemini atau Groq.");
  }
  const fmt = String(responseFormat || "text").toLowerCase() === "json" ? "json" : "text";
  const body = { provider: prov, system: system || undefined, user, maxTokens, responseFormat: fmt };
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const data = await fetchAi(ep, body, prov, timeoutMs || LLM_TIMEOUT_MS);
      const txt = String(data.text || "").trim();
      if (!txt) throw new Error("Respons AI kosong");
      setLastAiMeta({ provider: data.provider, model: data.model });
      setLastAiError(null);
      return txt;
    } catch (e) {
      lastErr = e;
      setLastAiError(formatAiError(e.message || e, prov));
      if (attempt < retries) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  throw lastErr;
}

/** @deprecated use callLLM */
export const callClaude = callLLM;

/* ===================== CASE ANALYSIS AGENT ===================== */

export const CaseAnalysisAgent = {
  /**
   * Stage 1–2 AI: extract facts & issues from chronology.
   * @param {string} text - kronologi
   * @param {{ heuristicFacts?: string[], heuristicIssues?: string[] }} hint - optional baseline from heuristic engine
   */
  async analyzeChronology(text, hint = {}) {
    let user = `Skema output:\n${CASE_SCHEMA}\n\nKRONOLOGI:\n${String(text).slice(0, 9000)}`;
    if (hint.heuristicFacts?.length || hint.heuristicIssues?.length) {
      user += "\n\nPETUNJUK HEURISTIK (gunakan sebagai baseline, perbaiki & lengkapi — jangan salin mentah jika kurang tepat):";
      if (hint.heuristicFacts?.length) {
        user += "\nFakta terdeteksi: " + hint.heuristicFacts.slice(0, 12).map((s, i) => `[${i}] ${s}`).join("; ");
      }
      if (hint.heuristicIssues?.length) {
        user += "\nIsu terdeteksi: " + hint.heuristicIssues.slice(0, 8).join("; ");
      }
    }
    const txt = await callLLM({ system: CASE_SYSTEM, user, maxTokens: 2500, retries: 1, timeoutMs: 55000, responseFormat: "json" });
    return parseAgentJson(txt);
  },

  /**
   * Stage 3 AI reranker: reorder & rescore statutes from deterministic retrieval.
   * Never invents articles — only reorders/filters the provided candidates.
   */
  async rerankStatutes(retrievalSet, facts, issues) {
    const candidates = (retrievalSet?.retrieved || []).map((s) => ({
      id: `${s.law}|${s.article}`,
      law: s.law,
      article: s.article,
      title: s.title || s.bab || "",
      snippet: String(s.text || s.t || "").slice(0, 280),
      currentRel: s.rel,
      factIds: s.factIds,
    }));
    if (candidates.length < 2) return null;

    const factList = (facts || []).slice(0, 14).map((f) => `${f.id}: ${f.statement}`).join("\n");
    const issueList = (issues || []).slice(0, 8).map((i) => `- [${i.category}] ${i.statement}`).join("\n");

    const system = CASE_RERANK_SYSTEM;

    const user = `FAKTA:\n${factList}\n\nISU:\n${issueList}\n\nKANDIDAT PASAL:\n${JSON.stringify(candidates)}`;

    const txt = await callLLM({ system, user, maxTokens: 1200, retries: 0, timeoutMs: 35000, responseFormat: "json" });
    const parsed = parseAgentJson(txt);
    const rankMap = {};
    for (const r of (parsed.rankings || [])) {
      if (r && r.id) rankMap[r.id] = { relevance: Number(r.relevance) || 0, reason: r.reason || "" };
    }

    const byId = {};
    candidates.forEach((c) => { byId[c.id] = c; });

    const reordered = [...(retrievalSet.retrieved || [])]
      .map((s) => {
        const id = `${s.law}|${s.article}`;
        const rank = rankMap[id];
        return {
          ...s,
          rel: rank ? Math.min(100, Math.max(0, Math.round(rank.relevance))) : s.rel,
          aiReason: rank?.reason || undefined,
        };
      })
      .sort((a, b) => b.rel - a.rel);

    return { ...retrievalSet, retrieved: reordered, aiReranked: true };
  },
};

/* ===================== CONTRACT REVIEW AGENT ===================== */

export const ContractReviewAgent = {
  /** Build contract-level context for cross-clause awareness. */
  async extractContractContext(text, ctx) {
    const system = CR_SYSTEM_BASE;
    const user = `Ringkas kontrak ini dalam JSON ketat:
{"contractType":string,"parties":string,"governingTheme":string,"keyRisks":string[],"reviewPerspective":string}

Perspektif tinjauan: ${ctx || "netral"}

KONTRAK:\n${String(text).slice(0, 6000)}`;

    try {
      const txt = await callLLM({ system, user, maxTokens: 800, responseFormat: "json" });
      return parseAgentJson(txt);
    } catch {
      return { contractType: "Kontrak", parties: "", governingTheme: "", keyRisks: [], reviewPerspective: ctx };
    }
  },

  /** Review a batch of clauses with full contract context. */
  async reviewClauses(clauses, ctx, contractContext = null) {
    const list = clauses.map((c) => ({
      idx: c.idx, num: c.num, type: c.type, heading: c.heading,
      text: c.text.slice(0, 1400),
    }));

    const ctxBlock = contractContext
      ? `\nKONTEKS KONTRAK: Jenis=${contractContext.contractType || "—"}; Para pihak=${contractContext.parties || "—"}; Tema=${contractContext.governingTheme || "—"}; Risiko utama=${(contractContext.keyRisks || []).join(", ") || "—"}`
      : "";

    const system = CR_SYSTEM_BASE + `\nPerspektif tinjauan: ${ctx || "pihak yang ditinjau"}.`;
    const user = `Untuk SETIAP klausul, kembalikan analisis dalam skema:
{"reviews":[{"idx":number,"summary":string,"risk":"high"|"med"|"low","legalConcern":string,"commercialConcern":string,"reasoning":string,"deficiency":string[],"suggestedRedraft":string,"missing":string[],"improvements":string[]}]}
${ctxBlock}

KLAUSUL:\n${JSON.stringify(list)}`;

    const txt = await callLLM({ system, user, maxTokens: 3500, responseFormat: "json" });
    const parsed = parseAgentJson(txt);
    const map = {};
    for (const r of (parsed.reviews || [])) {
      if (r && typeof r.idx === "number") map[r.idx] = r;
    }
    return map;
  },

  /** Extract key business terms from contract. */
  async extractDataPoints(text, ctx) {
    const system = CR_SYSTEM_BASE;
    const user = `Ekstrak data poin bisnis dari kontrak. Perspektif: ${ctx || "netral"}.
Skema: {"points":{"Para pihak":string,"Nilai kontrak":string,"Termin pembayaran":string,"Denda keterlambatan":string,"Tanggal mulai":string,"Tanggal berakhir":string,"Jangka waktu":string,"Perpanjangan otomatis":string,"Masa pemberitahuan pengakhiran":string,"Hukum yang berlaku":string,"Forum penyelesaian sengketa":string}}
Gunakan "-" jika tidak dinyatakan.

KONTRAK:\n${String(text).slice(0, 9000)}`;

    const txt = await callLLM({ system, user, maxTokens: 1200, responseFormat: "json" });
    const parsed = parseAgentJson(txt);
    return parsed.points || {};
  },
};
