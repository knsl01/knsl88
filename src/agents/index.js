/**
 * KNSL Multi-Agent Layer — entry point
 *
 * Hierarki:
 *   Layer 0: prompts/shared.js — prinsip hukum bersama
 *   Layer 1: orchestrator.js — routing & pipeline
 *   Layer 2: sub-agents — spesialis per modul
 */

export * from "./prompts/index.js";
export * from "./registry.js";
export * from "./matterContext.js";
export * from "./orchestrator.js";
export { askLegalChat, SUGGESTED_PROMPTS } from "./legalChatAgent.js";
export { runLegalResearch } from "./legalResearchAgent.js";
export { runLegalDrafting } from "./legalDraftingAgent.js";
export { runLegalMemo } from "./legalMemoAgent.js";
export { runComplianceReview } from "./complianceAgent.js";
export { dispatchKnslChatAgent } from "./chatDispatcher.js";
