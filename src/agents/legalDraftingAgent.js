import { callLLM, parseAgentJson } from "../knslAiAgent.js";
import { LEGAL_DRAFTING_SYSTEM, LEGAL_DRAFTING_SCHEMA } from "./prompts/index.js";

/**
 * @param {{ request: string, docType?: string, perspective?: string, context?: string, format?: 'json'|'prose', provider?: string }} opts
 */
export async function runLegalDrafting({
  request,
  docType,
  perspective,
  context,
  format = "prose",
  provider,
}) {
  const meta = [
    docType ? `Jenis dokumen: ${docType}` : "",
    perspective ? `Perspektif: ${perspective}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const ctxBlock = context ? `\n\nKONTEKS / FAKTA:\n${context.slice(0, 8000)}` : "";
  const user =
    format === "json"
      ? `Skema output:\n${LEGAL_DRAFTING_SCHEMA}\n\n${meta}\n\nPERMINTAAN:\n${request}${ctxBlock}`
      : `${meta}\n\nPERMINTAAN DRAFTING:\n${request}${ctxBlock}`;

  const raw = await callLLM({
    system: LEGAL_DRAFTING_SYSTEM,
    user,
    maxTokens: 4000,
    provider,
  });

  if (format === "prose") return { body: String(raw).trim() };
  try {
    return parseAgentJson(raw);
  } catch {
    return { body: String(raw).trim(), parseError: true };
  }
}
