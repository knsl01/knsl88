import React, { useState } from "react";
import { Scale } from "lucide-react";
import {
  KNSL_CHAT_AGENTS,
  getKnslAgent,
  setKnslAgent,
  getKnslAgentConfig,
  getKnslAgentHint,
  getKnslAgentLabel,
  getKnslAgentEnabled,
  setKnslAgentEnabled,
} from "./knslAiAgents.js";
import { useI18n } from "./i18n/I18nContext.jsx";

/**
 * Pemilih agen KNSL AI — terpisah dari provider LLM (Gemini/Groq).
 * @param {{ compact?: boolean, minimal?: boolean, allowedIds?: string[], defaultId?: string, showEnableToggle?: boolean, defaultEnabled?: boolean }} props
 */
export default function KnslAgentPicker({
  compact,
  minimal,
  allowedIds,
  defaultId,
  showEnableToggle = false,
  defaultEnabled = true,
}) {
  const { locale, t } = useI18n();
  const pool = allowedIds?.length
    ? KNSL_CHAT_AGENTS.filter((a) => allowedIds.includes(a.id))
    : KNSL_CHAT_AGENTS;
  const initial = defaultId && pool.some((a) => a.id === defaultId) ? defaultId : getKnslAgent();
  const [agentId, setAgentId] = useState(() => (
    pool.some((a) => a.id === initial) ? initial : pool[0]?.id || getKnslAgent()
  ));
  const [enabled, setEnabled] = useState(() => (
    showEnableToggle ? getKnslAgentEnabled(defaultEnabled) : true
  ));

  const onPick = (id) => {
    setKnslAgent(id);
    setAgentId(id);
  };

  const onToggle = (on) => {
    setKnslAgentEnabled(on);
    setEnabled(on);
  };

  const cur = pool.find((a) => a.id === agentId) || getKnslAgentConfig(agentId);
  const label = getKnslAgentLabel(agentId, locale);
  const hint = getKnslAgentHint(agentId, locale);

  const enableRow = showEnableToggle ? (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        cursor: "pointer",
        fontSize: 12.5,
        color: "var(--silver)",
        marginBottom: enabled ? 8 : 0,
      }}
    >
      <input
        type="checkbox"
        checked={enabled}
        onChange={(e) => onToggle(e.target.checked)}
        style={{ accentColor: "#1fb37e", width: 15, height: 15 }}
      />
      <span>{t("chat.knslAgentEnable")}</span>
    </label>
  ) : null;

  if (showEnableToggle && !enabled) {
    return (
      <div className="ai-provider-wrap knsl-agent-wrap" style={{ marginTop: compact ? 10 : 0 }}>
        {enableRow}
        <p style={{ fontSize: 11, color: "var(--muted)", margin: "6px 0 0", lineHeight: 1.45 }}>
          {t("chat.knslAgentOffHint")}
        </p>
      </div>
    );
  }

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
        {enableRow}
        {selectEl}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="ai-provider-wrap knsl-agent-wrap" style={{ marginTop: 10, display: "grid", gap: 6 }}>
        {enableRow}
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
      {enableRow}
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
