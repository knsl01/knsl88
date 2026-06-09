import { callLLM } from "../knslAiAgent.js";
import { LEGAL_MEMO_SYSTEM } from "./prompts/index.js";

/**
 * @param {{ facts: string, issues: string, context?: string, provider?: string }} opts
 */
export async function runLegalMemo({ facts, issues, context, provider }) {
  const ctxBlock = context ? `\n\nKONTEKS TAMBAHAN:\n${context.slice(0, 4000)}` : "";
  const user = `FAKTA:\n${facts.slice(0, 6000)}\n\nISSUE / PERTANYAAN HUKUM:\n${issues.slice(0, 3000)}${ctxBlock}`;

  const text = await callLLM({
    system: LEGAL_MEMO_SYSTEM,
    user,
    maxTokens: 3500,
    provider,
  });

  return { body: String(text).trim() };
}
