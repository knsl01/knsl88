/**
 * KNSL AI Agents — katalog agen yang bisa dipilih user di Chat & modul lain.
 * Terpisah dari provider LLM (Gemini/Groq) di aiProviders.js.
 */

import { AGENT_IDS } from "./agents/registry.js";

const STORAGE_KEY = "knsl:knsl-agent";
const ENABLED_KEY = "knsl:knsl-agent-enabled";

export function getKnslAgentEnabled(defaultOn = true) {
  try {
    const v = localStorage.getItem(ENABLED_KEY);
    if (v === "0" || v === "false") return false;
    if (v === "1" || v === "true") return true;
  } catch { /* ignore */ }
  return defaultOn;
}

/** Agen yang dipakai saat ini (fallback ke Chat Hukum jika routing agen dimatikan). */
export function effectiveKnslAgentId(fallback = AGENT_IDS.CHAT) {
  return getKnslAgentEnabled() ? getKnslAgent() : fallback;
}

export function setKnslAgentEnabled(on) {
  try {
    localStorage.setItem(ENABLED_KEY, on ? "1" : "0");
  } catch { /* ignore */ }
}

/** Agen yang tersedia di UI chat (urutan tampilan) */
export const KNSL_CHAT_AGENTS = [
  {
    id: "orchestrator",
    labelId: "KNSL AI (Otomatis)",
    labelEn: "KNSL AI (Auto)",
    hintId: "Lead Counsel — memilih sub-agent terbaik untuk pertanyaan Anda.",
    hintEn: "Lead Counsel — picks the best sub-agent for your question.",
    suggested: true,
  },
  {
    id: AGENT_IDS.CHAT,
    labelId: "Chat Hukum",
    labelEn: "Legal Chat",
    hintId: "Q&A riset hukum Indonesia — pasal, prosedur, konsep.",
    hintEn: "Indonesian legal Q&A — statutes, procedure, concepts.",
  },
  {
    id: AGENT_IDS.RESEARCH,
    labelId: "Riset Hukum",
    labelEn: "Legal Research",
    hintId: "Riset mendalam: unsur pasal, norma, prosedur, implikasi praktis.",
    hintEn: "Deep research: elements, norms, procedure, practical implications.",
  },
  {
    id: AGENT_IDS.DRAFTING,
    labelId: "Legal Drafting",
    labelEn: "Legal Drafting",
    hintId: "Susun draft surat, somasi, gugatan, NDA, atau klausul kontrak.",
    hintEn: "Draft letters, demand letters, claims, NDAs, or contract clauses.",
  },
  {
    id: AGENT_IDS.MEMO,
    labelId: "Memo Hukum",
    labelEn: "Legal Memo",
    hintId: "Memo terstruktur: fakta → issue → analisa → kesimpulan.",
    hintEn: "Structured memo: facts → issues → analysis → conclusion.",
  },
  {
    id: AGENT_IDS.COMPLIANCE,
    labelId: "Kepatuhan & Risiko",
    labelEn: "Compliance & Risk",
    hintId: "Gap analysis regulasi, checklist kepatuhan, mitigasi risiko.",
    hintEn: "Regulatory gap analysis, compliance checklist, risk mitigation.",
  },
  {
    id: AGENT_IDS.ANALYSIS,
    labelId: "Analisa Perkara",
    labelEn: "Case Analysis",
    hintId: "Strukturkan kronologi menjadi fakta atomik dan isu hukum.",
    hintEn: "Structure chronology into atomic facts and legal issues.",
  },
];

export const DEFAULT_KNSL_AGENT = "orchestrator";

export function getKnslAgent() {
  try {
    const id = localStorage.getItem(STORAGE_KEY);
    if (id && KNSL_CHAT_AGENTS.some((a) => a.id === id)) return id;
  } catch { /* ignore */ }
  return DEFAULT_KNSL_AGENT;
}

export function setKnslAgent(id) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch { /* ignore */ }
}

export function getKnslAgentConfig(id) {
  return KNSL_CHAT_AGENTS.find((a) => a.id === id) || KNSL_CHAT_AGENTS[0];
}

export function getKnslAgentLabel(id, locale = "id") {
  const cfg = getKnslAgentConfig(id);
  return locale === "en" ? cfg.labelEn : cfg.labelId;
}

export function getKnslAgentHint(id, locale = "id") {
  const cfg = getKnslAgentConfig(id);
  return locale === "en" ? cfg.hintEn : cfg.hintId;
}
