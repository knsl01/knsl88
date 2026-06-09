/**
 * KNSL Agent Prompt Pack — hierarki Layer 0 → 1 → 2
 *
 * Layer 0: shared.js — prinsip hukum bersama
 * Layer 1: master.js — orchestrator routing & synthesis
 * Layer 2: sub-agent prompts — spesialis per tugas
 */

export * from "./shared.js";
export * from "./master.js";
export * from "./caseAnalysis.js";
export * from "./contractReview.js";
export * from "./legalChat.js";
export * from "./scanIntel.js";
export * from "./legalResearch.js";
export * from "./legalDrafting.js";
export * from "./legalMemo.js";
export * from "./compliance.js";
export * from "./critic.js";
