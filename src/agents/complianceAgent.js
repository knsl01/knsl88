import { callLLM, parseAgentJson } from "../knslAiAgent.js";
import { COMPLIANCE_SYSTEM, COMPLIANCE_SCHEMA } from "./prompts/index.js";

/**
 * @param {{ scope: string, context?: string, provider?: string }} opts
 */
export async function runComplianceReview({ scope, context, provider }) {
  const ctxBlock = context ? `\n\nKONTEKS OPERASIONAL:\n${context.slice(0, 8000)}` : "";
  const user = `Skema output:\n${COMPLIANCE_SCHEMA}\n\nRUANG LINGKUP KEPATUHAN:\n${scope}${ctxBlock}`;

  const raw = await callLLM({
    system: COMPLIANCE_SYSTEM,
    user,
    maxTokens: 3000,
    provider,
  });

  try {
    return parseAgentJson(raw);
  } catch {
    return { text: String(raw).trim(), parseError: true };
  }
}
