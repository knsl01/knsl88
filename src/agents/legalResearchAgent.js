import { callLLM, parseAgentJson } from "../knslAiAgent.js";
import { LEGAL_RESEARCH_SYSTEM, LEGAL_RESEARCH_SCHEMA } from "./prompts/index.js";
import { searchPasal, formatPasalForRag, outsideHits } from "../services/pasalSearch.js";

const RAG_RULES = `ATURAN RAG (WAJIB):
- Hanya kutip/kaitkan pasal dari blok "KORPUS PASAL KNSL" di bawah.
- Jangan menambah pasal di luar korpus. Jika korpus tidak cukup, nyatakan di uncertainties.
- Gunakan referensi luar korpus hanya sebagai catatan umum di uncertainties (bukan sebagai kutipan pasti).`;

/**
 * Hybrid RAG research — retrieval deterministik + sintesis LLM.
 * @param {{ query: string, context?: string, filter?: string, format?: 'json'|'prose', provider?: string }} opts
 */
export async function runLegalResearch({ query, context, filter = "all", format = "json", provider }) {
  const hits = searchPasal(query, filter);
  const outside = outsideHits(query);
  const corpusBlock = hits.length
    ? formatPasalForRag(hits)
    : "(Tidak ada pasal cocok di korpus indeks — jawab hati-hati, tandai ketidakpastian tinggi.)";
  const outsideBlock = outside.length
    ? outside.map((o) => `- ${o.k}: ${o.v}`).join("\n")
    : "(Tidak ada petunjuk referensi luar indeks.)";

  const ctxBlock = context ? `\n\nKONTEKS MATTER:\n${context.slice(0, 6000)}` : "";
  const ragBlock = `\n\nKORPUS PASAL KNSL (satu-satunya sumber pasal yang boleh dikutip):\n${corpusBlock}\n\nPETUNJUK REFERENSI DI LUAR KORPUS (jangan dikutip sebagai pasal terindeks):\n${outsideBlock}`;

  const user =
    format === "json"
      ? `${RAG_RULES}\n\nSkema output:\n${LEGAL_RESEARCH_SCHEMA}\n\nPERTANYAAN RISET:\n${query}${ctxBlock}${ragBlock}`
      : `${RAG_RULES}\n\nPERTANYAAN RISET:\n${query}${ctxBlock}${ragBlock}\n\nJawab lengkap dalam format riset hukum terstruktur.`;

  const raw = await callLLM({
    system: LEGAL_RESEARCH_SYSTEM,
    user,
    maxTokens: 2800,
    provider,
  });

  const base = { retrievedPasal: hits.slice(0, 12), outsideHints: outside };

  if (format === "prose") return { ...base, text: String(raw).trim() };
  try {
    return { ...base, ...parseAgentJson(raw) };
  } catch {
    return { ...base, text: String(raw).trim(), parseError: true };
  }
}

/** Format hybrid RAG result for UI (markdown-ish). */
export function formatResearchResult(data) {
  if (data.text) return data.text;
  const lines = [];
  if (data.issueRestated) lines.push(`**Isu:** ${data.issueRestated}`);
  if (data.legalDomain) lines.push(`**Bidang:** ${data.legalDomain}`);
  if (data.primarySources?.length) {
    lines.push("\n**Sumber hukum (dari korpus KNSL):**");
    for (const s of data.primarySources) {
      lines.push(`- ${s.instrument} ${s.articles || ""} — ${s.relevance} (${s.confidence})`);
    }
  }
  if (data.elementsOrRequirements?.length) {
    lines.push("\n**Unsur / syarat:**");
    for (const e of data.elementsOrRequirements) {
      lines.push(`- **${e.label}:** ${e.description}`);
    }
  }
  if (data.procedureNotes) lines.push(`\n**Prosedur:** ${data.procedureNotes}`);
  if (data.practicalImplications?.length) {
    lines.push("\n**Implikasi praktis:**");
    data.practicalImplications.forEach((p) => lines.push(`- ${p}`));
  }
  if (data.uncertainties?.length) {
    lines.push("\n**Ketidakpastian:**");
    data.uncertainties.forEach((u) => lines.push(`- ${u}`));
  }
  if (data.retrievedPasal?.length) {
    lines.push(`\n_Pasal terindeks digunakan: ${data.retrievedPasal.length} entri dari basis KNSL._`);
  }
  lines.push("\n_Ini informasi riset hukum, bukan nasihat hukum resmi — konsultasikan advokat untuk keputusan konkret._");
  return lines.join("\n");
}
