/**
 * Agent Registry — katalog kemampuan sub-agent KNSL.
 */

export const AGENT_IDS = {
  INTAKE: "intake",
  ANALYSIS: "analysis",
  RESEARCH: "research",
  CONTRACT: "contract",
  DRAFTING: "drafting",
  MEMO: "memo",
  COMPLIANCE: "compliance",
  CHAT: "chat",
  CRITIC: "critic",
};

export const AGENT_REGISTRY = {
  [AGENT_IDS.INTAKE]: {
    id: AGENT_IDS.INTAKE,
    label: "Document Intake",
    labelId: "Klasifikasi Dokumen",
    outputType: "json",
    module: "scan",
  },
  [AGENT_IDS.ANALYSIS]: {
    id: AGENT_IDS.ANALYSIS,
    label: "Case Analysis",
    labelId: "Analisa Perkara",
    outputType: "json",
    module: "analysis",
  },
  [AGENT_IDS.RESEARCH]: {
    id: AGENT_IDS.RESEARCH,
    label: "Legal Research",
    labelId: "Riset Hukum",
    outputType: "json|prose",
    module: "research",
  },
  [AGENT_IDS.CONTRACT]: {
    id: AGENT_IDS.CONTRACT,
    label: "Contract Review",
    labelId: "Tinjauan Kontrak",
    outputType: "json",
    module: "contract",
  },
  [AGENT_IDS.DRAFTING]: {
    id: AGENT_IDS.DRAFTING,
    label: "Legal Drafting",
    labelId: "Legal Drafting",
    outputType: "prose|json",
    module: "drafting",
  },
  [AGENT_IDS.MEMO]: {
    id: AGENT_IDS.MEMO,
    label: "Legal Memo",
    labelId: "Memo Hukum",
    outputType: "prose",
    module: "memo",
  },
  [AGENT_IDS.COMPLIANCE]: {
    id: AGENT_IDS.COMPLIANCE,
    label: "Compliance & Risk",
    labelId: "Kepatuhan & Risiko",
    outputType: "json",
    module: "compliance",
  },
  [AGENT_IDS.CHAT]: {
    id: AGENT_IDS.CHAT,
    label: "Legal Chat",
    labelId: "Chat Hukum",
    outputType: "prose",
    module: "chat",
  },
  [AGENT_IDS.CRITIC]: {
    id: AGENT_IDS.CRITIC,
    label: "QA Critic",
    labelId: "Review Kualitas",
    outputType: "json",
    module: "internal",
  },
};

/** Map recommendedAction dari scan intel → agent id */
export const SCAN_ACTION_TO_AGENT = {
  contract: AGENT_IDS.CONTRACT,
  analysis: AGENT_IDS.ANALYSIS,
  research: AGENT_IDS.RESEARCH,
  none: null,
};
