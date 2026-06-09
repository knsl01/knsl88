/**
 * Dispatcher chat — jalankan agen KNSL yang dipilih user.
 */

import { AGENT_IDS } from "./registry.js";
import { askLegalChat } from "./legalChatAgent.js";
import { runLegalResearch, formatResearchResult } from "./legalResearchAgent.js";
import { runLegalDrafting } from "./legalDraftingAgent.js";
import { runLegalMemo } from "./legalMemoAgent.js";
import { runComplianceReview } from "./complianceAgent.js";
import { routeIntent, runOrchestratedPipeline, synthesizeResults } from "./orchestrator.js";
import { CaseAnalysisAgent } from "../knslAiAgent.js";

function lastUserText(messages) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return last?.content?.trim() || "";
}

/**
 * Permintaan spesialis eksplisit (drafting/analisa/tinjauan dokumen) yang layak
 * memakai pipeline multi-agent penuh. Selain ini, pertanyaan konseptual singkat
 * dijawab via satu panggilan chat agar hemat kuota token harian (Groq/Gemini).
 */
const SPECIALIST_REQUEST =
  /(buatkan|buatlah|tolong buat|susun(kan)?|drafkan|draftkan|buat\s+(draft|surat|gugatan|somasi|kontrak|perjanjian|nda|memo)|tinjau(lah)?\s+(kontrak|perjanjian|klausul)|review\s+(kontrak|perjanjian|klausul)|periksa\s+kontrak|analisa\s+(perkara|kronologi|kasus)|analisis\s+(perkara|kronologi|kasus)|memo\s+hukum|due\s+diligence|gap\s+analysis|audit\s+kepatuhan)/i;

/** True jika pesan berupa tanya-jawab konsep singkat (bukan tugas spesialis / dokumen panjang). */
function isConversationalQuery(text) {
  const t = String(text || "").trim();
  if (!t) return false;
  if (t.length > 600) return false;
  if (t.split(/\s+/).length > 120) return false;
  if (SPECIALIST_REQUEST.test(t)) return false;
  return true;
}

function formatAnalysisResult(data) {
  const lines = ["**Hasil analisa perkara**\n"];
  if (data.facts?.length) {
    lines.push("**Fakta:**");
    data.facts.forEach((f, i) => {
      lines.push(`${i + 1}. [${f.certainty}] ${f.statement}`);
    });
  }
  if (data.missingFacts?.length) {
    lines.push("\n**Fakta yang masih kurang:**");
    data.missingFacts.forEach((m) => lines.push(`- ${m.description} _(untuk: ${m.neededFor})_`));
  }
  if (data.issues?.length) {
    lines.push("\n**Isu hukum:**");
    data.issues.forEach((iss, i) => {
      lines.push(`${i + 1}. [${iss.category}] ${iss.statement} — _keyakinan: ${iss.confidence}_`);
    });
  }
  lines.push("\n_Lanjutkan ke modul Analisis untuk retrieval pasal & uji unsur otomatis._");
  lines.push("\n_Ini informasi riset hukum, bukan nasihat hukum resmi._");
  return lines.join("\n");
}

function formatComplianceResult(data) {
  if (data.text) return data.text;
  const lines = [`**Kepatuhan:** ${data.scope || "—"}\n`];
  if (data.gaps?.length) {
    lines.push("**Gap:**");
    data.gaps.forEach((g) => {
      lines.push(`- [${g.severity}] ${g.area}: ${g.gap} → _${g.recommendation}_`);
    });
  }
  if (data.priorityActions?.length) {
    lines.push("\n**Prioritas:**");
    data.priorityActions.forEach((a) => lines.push(`- ${a}`));
  }
  lines.push("\n_Ini informasi riset hukum, bukan nasihat hukum resmi._");
  return lines.join("\n");
}

/**
 * @param {{ agentId: string, messages: object[], provider?: string }} opts
 * @returns {Promise<{ text: string, meta?: object }>}
 */
export async function dispatchKnslChatAgent({ agentId, messages, provider }) {
  const text = lastUserText(messages);
  if (!text) throw new Error("Pertanyaan kosong.");

  switch (agentId) {
    case "orchestrator": {
      // Hemat kuota: pertanyaan konsep singkat dijawab langsung dengan SATU
      // panggilan LLM. Pipeline multi-agent (banyak panggilan + prompt besar)
      // hanya untuk permintaan spesialis / dokumen panjang.
      if (isConversationalQuery(text)) {
        const reply = await askLegalChat({ messages, provider });
        return { text: reply, meta: { fastPath: true } };
      }
      const route = await routeIntent({ text, provider });
      if (route.needsClarification) {
        const qs = (route.clarifyingQuestions || []).map((q, i) => `${i + 1}. ${q}`).join("\n");
        return {
          text: `**KNSL Lead Counsel** memerlukan klarifikasi sebelum melanjutkan:\n\n${qs}\n\n_Silakan jawab poin di atas dalam pesan berikutnya._`,
          meta: { route },
        };
      }
      const results = await runOrchestratedPipeline({ text, route, provider });
      if (results.status === "clarification_needed") {
        const qs = (results.questions || []).map((q, i) => `${i + 1}. ${q}`).join("\n");
        return { text: `**Klarifikasi diperlukan:**\n\n${qs}`, meta: { route: results.route } };
      }
      // Hemat satu panggilan: jika hanya agen chat yang jalan, kembalikan
      // jawabannya langsung tanpa panggilan sintesis tambahan.
      const agentKeys = Object.keys(results.agents || {});
      if (agentKeys.length === 1 && results.agents.chat?.reply && !results.critic) {
        return { text: String(results.agents.chat.reply).trim(), meta: { route } };
      }
      const summary = await synthesizeResults({ results, provider });
      return {
        text: String(summary).trim(),
        meta: { route, agents: agentKeys },
      };
    }

    case AGENT_IDS.CHAT: {
      const reply = await askLegalChat({ messages, provider });
      return { text: reply };
    }

    case AGENT_IDS.RESEARCH: {
      const data = await runLegalResearch({ query: text, format: "json", filter: "all", provider });
      return { text: formatResearchResult(data) };
    }

    case AGENT_IDS.DRAFTING: {
      const data = await runLegalDrafting({ request: text, format: "prose", provider });
      return { text: data.body || String(data) };
    }

    case AGENT_IDS.MEMO: {
      const data = await runLegalMemo({ facts: text, issues: text, provider });
      return { text: data.body };
    }

    case AGENT_IDS.COMPLIANCE: {
      const data = await runComplianceReview({ scope: text, provider });
      return { text: formatComplianceResult(data) };
    }

    case AGENT_IDS.ANALYSIS: {
      const data = await CaseAnalysisAgent.analyzeChronology(text);
      return { text: formatAnalysisResult(data) };
    }

    default:
      throw new Error(`Agen KNSL tidak dikenal: ${agentId}`);
  }
}
