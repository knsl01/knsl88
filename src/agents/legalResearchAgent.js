import { callLLM, parseAgentJson } from "../knslAiAgent.js";
import { LEGAL_RESEARCH_SYSTEM, LEGAL_RESEARCH_SCHEMA } from "./prompts/index.js";

/**
 * @param {{ query: string, context?: string, format?: 'json'|'prose', provider?: string }} opts
 */
export async function runLegalResearch({ query, context, format = "json", provider }) {
  const ctxBlock = context ? `\n\nKONTEKS MATTER:\n${context.slice(0, 6000)}` : "";
  const user =
    format === "json"
      ? `Skema output:\n${LEGAL_RESEARCH_SCHEMA}\n\nPERTANYAAN RISET:\n${query}${ctxBlock}`
      : `PERTANYAAN RISET:\n${query}${ctxBlock}\n\nJawab lengkap dalam format riset hukum terstruktur.`;

  const raw = await callLLM({
    system: LEGAL_RESEARCH_SYSTEM,
    user,
    maxTokens: 2800,
    provider,
  });

  if (format === "prose") return { text: String(raw).trim() };
  try {
    return parseAgentJson(raw);
  } catch {
    return { text: String(raw).trim(), parseError: true };
  }
}
