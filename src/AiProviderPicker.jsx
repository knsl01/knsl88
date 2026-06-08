import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { AI_PROVIDERS, getAiProvider, setAiProvider, getLastAiMeta, getProviderLabel } from "./aiProviders.js";

/** Pemilih provider AI — native select agar tidak tertutup overflow parent. */
export default function AiProviderPicker({ compact }) {
  const [provider, setProvider] = useState(getAiProvider);
  const [last, setLast] = useState(getLastAiMeta);

  useEffect(() => {
    const t = setInterval(() => setLast(getLastAiMeta()), 1500);
    return () => clearInterval(t);
  }, []);

  const onPick = (id) => {
    setAiProvider(id);
    setProvider(id);
  };

  const cur = AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];

  const selectEl = (
    <select
      className="field"
      value={provider}
      onChange={(e) => onPick(e.target.value)}
      style={compact ? { marginTop: 0, fontSize: 12.5 } : undefined}
      aria-label="Provider AI"
    >
      {AI_PROVIDERS.map((p) => (
        <option key={p.id} value={p.id}>
          {p.label}{p.free ? " (gratis)" : " (berbayar)"}
        </option>
      ))}
    </select>
  );

  if (compact) {
    return (
      <div className="ai-provider-wrap" style={{ marginTop: 10, display: "grid", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: "0.6px" }}>
          <Sparkles size={12} className="gold-text" />
          <span>Provider AI</span>
          {cur.free && <span className="badge badge-low" style={{ marginLeft: "auto", fontSize: 9.5, padding: "2px 7px" }}>Gratis</span>}
        </div>
        {selectEl}
        <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, lineHeight: 1.45 }}>{cur.hint}</p>
        {last && (
          <p style={{ fontSize: 10.5, color: "var(--emerald-bright)", margin: 0, lineHeight: 1.4 }}>
            ✓ Terhubung: {getProviderLabel(last.provider)} · {last.model}
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
        {cur.free && <span className="badge badge-low" style={{ marginLeft: "auto" }}>Gratis</span>}
      </div>
      {selectEl}
      <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.45 }}>{cur.hint}</p>
      {last && (
        <p style={{ fontSize: 10.5, color: "var(--emerald-bright)", margin: "6px 0 0" }}>
          ✓ Terhubung: {getProviderLabel(last.provider)} · {last.model}
        </p>
      )}
    </div>
  );
}
