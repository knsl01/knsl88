import React, { useState } from "react";
import { Scale } from "lucide-react";
import {
  KNSL_CHAT_AGENTS,
  getKnslAgent,
  setKnslAgent,
  getKnslAgentConfig,
  getKnslAgentHint,
  getKnslAgentLabel,
} from "./knslAiAgents.js";
import { useI18n } from "./i18n/I18nContext.jsx";

/** Pemilih agen KNSL AI — terpisah dari provider LLM (Gemini/Groq). */
export default function KnslAgentPicker({ compact, minimal, allowedIds, defaultId }) {
  const { locale, t } = useI18n();
  const pool = allowedIds?.length
    ? KNSL_CHAT_AGENTS.filter((a) => allowedIds.includes(a.id))
    : KNSL_CHAT_AGENTS;
  const initial = defaultId && pool.some((a) => a.id === defaultId) ? defaultId : getKnslAgent();
  const [agentId, setAgentId] = useState(() => (
    pool.some((a) => a.id === initial) ? initial : pool[0]?.id || getKnslAgent()
  ));

  const onPick = (id) => {
    setKnslAgent(id);
    setAgentId(id);
  };

  const cur = pool.find((a) => a.id === agentId) || getKnslAgentConfig(agentId);
  const label = getKnslAgentLabel(agentId, locale);
  const hint = getKnslAgentHint(agentId, locale);

  const selectEl = (
    <select
      className="field"
      value={agentId}
      onChange={(e) => onPick(e.target.value)}
      style={compact ? { marginTop: 0, fontSize: 12.5 } : undefined}
      aria-label={t("chat.knslAgentLabel")}
    >
      {pool.map((a) => (
        <option key={a.id} value={a.id}>
          {locale === "en" ? a.labelEn : a.labelId}
        </option>
      ))}
    </select>
  );

  if (minimal) {
    return (
      <div className="ai-provider-minimal knsl-agent-minimal" title={hint}>
        {selectEl}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="ai-provider-wrap knsl-agent-wrap" style={{ marginTop: 10, display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
          <Scale size={12} className="gold-text" />
          <span>{t("chat.knslAgentLabel")}</span>
        </div>
        {selectEl}
        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1.45 }}>{hint}</p>
        {cur.suggested && (
          <p style={{ fontSize: 10.5, color: "var(--gold)", margin: 0, lineHeight: 1.4 }}>
            ★ {t("chat.knslAgentRecommended")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="ai-provider-wrap knsl-agent-wrap glass" style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Scale size={15} className="gold-text" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{t("chat.knslAgentLabel")}</span>
      </div>
      {selectEl}
      <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.45 }}>
        <strong>{label}</strong> — {hint}
      </p>
    </div>
  );
}
