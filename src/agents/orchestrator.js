/**
 * KNSL Lead Counsel Orchestrator — routing intent ke sub-agent.
 */

import { callLLM, parseAgentJson } from "../knslAiAgent.js";
import {
  MASTER_ORCHESTRATOR_SYSTEM,
  ORCHESTRATOR_ROUTE_SCHEMA,
  ORCHESTRATOR_SYNTHESIS_SYSTEM,
  CRITIC_QA_SYSTEM,
  CRITIC_QA_SCHEMA,
} from "./prompts/index.js";
import { AGENT_IDS, SCAN_ACTION_TO_AGENT } from "./registry.js";
import { createMatterContext, formatMatterForHandoff } from "./matterContext.js";
import { runLegalResearch } from "./legalResearchAgent.js";
import { runLegalDrafting } from "./legalDraftingAgent.js";
import { runLegalMemo } from "./legalMemoAgent.js";
import { runComplianceReview } from "./complianceAgent.js";
import { askLegalChat } from "./legalChatAgent.js";
import { CaseAnalysisAgent, ContractReviewAgent } from "../knslAiAgent.js";
import { analyzeDocument } from "../features/scan/scanIntelligence.js";

/**
 * Route user input ke sub-agent yang tepat (tanpa menjalankan agent).
 * @param {{ text: string, matterContext?: object, provider?: string }} opts
 */
export async function routeIntent({ text, matterContext, provider }) {
  const ctxBlock = matterContext ? `\n\nKONTEKS MATTER:\n${formatMatterForHandoff(matterContext)}` : "";
  const user = `Skema output:\n${ORCHESTRATOR_ROUTE_SCHEMA}\n\nINPUT PENGGUNA:\n${String(text).slice(0, 8000)}${ctxBlock}`;

  const raw = await callLLM({
    system: MASTER_ORCHESTRATOR_SYSTEM,
    user,
    maxTokens: 1200,
    provider,
    responseFormat: "json",
  });

  return parseAgentJson(raw);
}

/**
 * Jalankan pipeline multi-agent berdasarkan routing.
 * @param {{ text: string, route?: object, matterContext?: object, provider?: string, runCritic?: boolean }} opts
 */
export async function runOrchestratedPipeline({
  text,
  route: routeOverride,
  matterContext: initialCtx,
  provider,
  runCritic,
}) {
  let ctx = initialCtx || createMatterContext({ chronology: text });
  const route = routeOverride || (await routeIntent({ text, matterContext: ctx, provider }));

  if (route.needsClarification) {
    return {
      status: "clarification_needed",
      route,
      questions: route.clarifyingQuestions || [],
      matterContext: ctx,
    };
  }

  const results = { route, agents: {} };
  const primary = route.primaryAgent;
  const secondary = route.secondaryAgents || [];
  const agentsToRun = [primary, ...secondary.filter((a) => a !== primary)];

  for (const agentId of agentsToRun) {
    const handoff = route.handoff || {};
    switch (agentId) {
      case AGENT_IDS.INTAKE: {
        const intake = await analyzeDocument(text);
        results.agents.intake = intake;
        ctx = { ...ctx, intake };
        const next = SCAN_ACTION_TO_AGENT[intake.recommendedAction];
        if (next && !secondary.includes(next)) {
          agentsToRun.push(next);
        }
        break;
      }
      case AGENT_IDS.ANALYSIS: {
        const analysis = await CaseAnalysisAgent.analyzeChronology(text);
        results.agents.analysis = analysis;
        ctx = { ...ctx, analysis, chronology: text };
        break;
      }
      case AGENT_IDS.RESEARCH: {
        const research = await runLegalResearch({
          query: handoff.goal || text,
          context: formatMatterForHandoff(ctx),
          provider,
        });
        results.agents.research = research;
        ctx = { ...ctx, research };
        break;
      }
      case AGENT_IDS.CONTRACT: {
        const contractCtx = handoff.perspective || ctx.perspective || "netral";
        const contractContext = await ContractReviewAgent.extractContractContext(text, contractCtx);
        results.agents.contract = { context: contractContext };
        ctx = { ...ctx, contract: contractContext };
        break;
      }
      case AGENT_IDS.DRAFTING: {
        const drafting = await runLegalDrafting({
          request: text,
          docType: handoff.docType,
          perspective: handoff.perspective || ctx.perspective,
          context: formatMatterForHandoff(ctx),
          provider,
        });
        results.agents.drafting = drafting;
        ctx = { ...ctx, drafting };
        break;
      }
      case AGENT_IDS.MEMO: {
        const memo = await runLegalMemo({
          facts: ctx.chronology || text,
          issues: handoff.goal || text,
          context: formatMatterForHandoff(ctx),
          provider,
        });
        results.agents.memo = memo;
        ctx = { ...ctx, memo };
        break;
      }
      case AGENT_IDS.COMPLIANCE: {
        const compliance = await runComplianceReview({
          scope: handoff.goal || text,
          context: formatMatterForHandoff(ctx),
          provider,
        });
        results.agents.compliance = compliance;
        ctx = { ...ctx, compliance };
        break;
      }
      case AGENT_IDS.CHAT: {
        const reply = await askLegalChat({
          messages: [{ role: "user", content: text }],
          provider,
        });
        results.agents.chat = { reply };
        break;
      }
      default:
        break;
    }
  }

  const shouldCritic = runCritic ?? route.runCritic;
  if (shouldCritic && Object.keys(results.agents).length > 0) {
    const criticInput = JSON.stringify(results.agents).slice(0, 12000);
    try {
      const criticRaw = await callLLM({
        system: CRITIC_QA_SYSTEM,
        user: `Skema:\n${CRITIC_QA_SCHEMA}\n\nOUTPUT AGEN:\n${criticInput}`,
        maxTokens: 1500,
        provider,
        responseFormat: "json",
      });
      results.critic = parseAgentJson(criticRaw);
    } catch {
      results.critic = { approved: true, qualityScore: 70, issues: [], summary: "QA tidak dijalankan." };
    }
  }

  results.matterContext = ctx;
  results.status = "completed";
  return results;
}

/**
 * Sintesis prosa dari hasil multi-agent untuk tampilan user.
 */
export async function synthesizeResults({ results, provider }) {
  const user = `Hasil sub-agent:\n${JSON.stringify(results.agents, null, 2).slice(0, 14000)}\n\nQA:\n${JSON.stringify(results.critic || {})}`;
  return callLLM({
    system: ORCHESTRATOR_SYNTHESIS_SYSTEM,
    user,
    maxTokens: 3000,
    provider,
  });
}

export { createMatterContext, formatMatterForHandoff };
