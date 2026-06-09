import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { AI_PROVIDERS, getAiProvider, setAiProvider, getLastAiMeta, getLastAiError, getProviderLabel, isAiProviderSelectable, getAiServerStatus } from "./aiProviders.js";

/** Pemilih provider AI — native select agar tidak tertutup overflow parent. */
export default function AiProviderPicker({ compact, minimal }) {
  const [provider, setProvider] = useState(getAiProvider);
  const [last, setLast] = useState(getLastAiMeta);
  const [lastError, setLastError] = useState(getLastAiError);
  const [serverStatus, setServerStatus] = useState(null);
  const options = AI_PROVIDERS.map((p) => ({ ...p, selectable: isAiProviderSelectable(p.id) }));

  useEffect(() => {
    const t = setInterval(() => {
      setLast(getLastAiMeta());
      setLastError(getLastAiError());
    }, 1500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let alive = true;
    getAiServerStatus()
      .then((status) => { if (alive) setServerStatus(status); })
      .catch(() => { if (alive) setServerStatus(null); });
    return () => { alive = false; };
  }, []);

  const onPick = (id) => {
    setAiProvider(id);
    setProvider(getAiProvider());
  };

  const cur = options.find((p) => p.id === provider) || options[0];
  const serverProvider = serverStatus?.providers?.find((p) => p.id === provider);
  const statusText = serverStatus
    ? provider === "auto"
      ? serverStatus.autoProvider
        ? `Auto server: ${getProviderLabel(serverStatus.autoProvider)}`
        : "Server belum membaca API key Gemini/Groq"
      : provider === "ollama"
        ? (serverProvider?.configured ? "Ollama lokal tersedia" : "Ollama hanya untuk localhost")
        : (serverProvider?.configured ? `Server membaca ${serverProvider.keyEnv}` : `Server belum membaca ${serverProvider?.keyEnv || "API key"}`)
    : "";
  const statusOk = provider === "auto" ? !!serverStatus?.autoProvider : !!serverProvider?.configured;
  const connectedMeta = lastError ? null : last;

  const selectEl = (
    <select
      className="field"
      value={provider}
      onChange={(e) => onPick(e.target.value)}
      style={compact ? { marginTop: 0, fontSize: 12.5 } : undefined}
      aria-label="Provider AI"
    >
      {options.map((p) => (
        <option key={p.id} value={p.id} disabled={!p.selectable}>
          {p.label}{p.selectable ? "" : " (lokal saja)"}
        </option>
      ))}
    </select>
  );

  if (minimal) {
    const status = connectedMeta
      ? `Terhubung: ${getProviderLabel(connectedMeta.provider)} · ${connectedMeta.model}`
      : cur.hint;
    return (
      <div className="ai-provider-minimal">
        {selectEl}
        {connectedMeta && (
          <span className="ai-provider-minimal-dot" title={status} aria-label={status} />
        )}
      </div>
    );
  }

  if (compact) {
    return (
      <div className="ai-provider-wrap" style={{ marginTop: 10, display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
          <Sparkles size={12} className="gold-text" />
          <span>Provider AI</span>
        </div>
        {selectEl}
        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1.45 }}>{cur.hint}</p>
        {statusText && (
          <p style={{ fontSize: 10.5, color: statusOk ? "var(--emerald-bright)" : "#ffb86b", margin: 0, lineHeight: 1.4 }}>
            {statusText}
          </p>
        )}
        {connectedMeta && (
          <p style={{ fontSize: 10.5, color: "var(--emerald-bright)", margin: 0, lineHeight: 1.4 }}>
            ✓ Terhubung: {getProviderLabel(connectedMeta.provider)} · {connectedMeta.model}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="ai-provider-wrap glass" style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Sparkles size={15} className="gold-text" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Provider AI</span>
      </div>
      {selectEl}
      <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.45 }}>{cur.hint}</p>
      {statusText && (
        <p style={{ fontSize: 10.5, color: statusOk ? "var(--emerald-bright)" : "#ffb86b", margin: "6px 0 0" }}>
          {statusText}
        </p>
      )}
      {connectedMeta && (
        <p style={{ fontSize: 10.5, color: "var(--emerald-bright)", margin: "6px 0 0" }}>
          ✓ Terhubung: {getProviderLabel(connectedMeta.provider)} · {connectedMeta.model}
        </p>
      )}
    </div>
  );
}
