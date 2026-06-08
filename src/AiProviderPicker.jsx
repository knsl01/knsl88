import React, { useState, useEffect } from "react";
import { Sparkles, ChevronDown } from "lucide-react";
import { AI_PROVIDERS, getAiProvider, setAiProvider, getLastAiMeta, getProviderLabel } from "./aiProviders.js";

/** Dropdown pemilihan provider AI (gratis / berbayar). */
export default function AiProviderPicker({ compact }) {
  const [provider, setProvider] = useState(getAiProvider);
  const [last, setLast] = useState(getLastAiMeta);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setLast(getLastAiMeta()), 2000);
    return () => clearInterval(t);
  }, []);

  const onPick = (id) => {
    setAiProvider(id);
    setProvider(id);
    setOpen(false);
  };

  const cur = AI_PROVIDERS.find((p) => p.id === provider) || AI_PROVIDERS[0];

  if (compact) {
    return (
      <div style={{ position: "relative", marginTop: 8 }}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: "flex", alignItems: "center", gap: 6, width: "100%",
            padding: "8px 10px", borderRadius: 10, cursor: "pointer",
            border: "1px solid var(--line)", background: "rgba(8,10,9,0.5)",
            color: "var(--silver)", fontSize: 12,
          }}
        >
          <Sparkles size={13} className="gold-text" />
          <span style={{ flex: 1, textAlign: "left" }}>{cur.label}{cur.free ? " · gratis" : ""}</span>
          <ChevronDown size={13} style={{ opacity: 0.6 }} />
        </button>
        {open && (
          <div className="glass" style={{ position: "absolute", zIndex: 20, left: 0, right: 0, top: "100%", marginTop: 4, padding: 6, borderRadius: 12 }}>
            {AI_PROVIDERS.map((p) => (
              <div
                key={p.id}
                onClick={() => onPick(p.id)}
                style={{
                  padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 12,
                  background: p.id === provider ? "rgba(31,179,126,0.12)" : "transparent",
                  color: p.id === provider ? "var(--emerald-bright)" : "var(--silver)",
                }}
              >
                <div style={{ fontWeight: 600 }}>{p.label}{p.free ? " ✓ gratis" : ""}</div>
                <div style={{ fontSize: 10.5, color: "var(--muted)", marginTop: 2 }}>{p.hint}</div>
              </div>
            ))}
          </div>
        )}
        {last && (
          <div style={{ fontSize: 10.5, color: "var(--muted-2)", marginTop: 5 }}>
            Terakhir: {getProviderLabel(last.provider)} ({last.model})
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: 14, marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Sparkles size={15} className="gold-text" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>Provider AI</span>
        {cur.free && <span className="badge badge-low" style={{ marginLeft: "auto" }}>Gratis</span>}
      </div>
      <select className="field" value={provider} onChange={(e) => onPick(e.target.value)}>
        {AI_PROVIDERS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}{p.free ? " (gratis)" : " (berbayar)"}</option>
        ))}
      </select>
      <p style={{ fontSize: 11, color: "var(--muted)", margin: "8px 0 0", lineHeight: 1.45 }}>{cur.hint}</p>
      {last && (
        <p style={{ fontSize: 10.5, color: "var(--muted-2)", margin: "6px 0 0" }}>
          Panggilan terakhir: {getProviderLabel(last.provider)} · {last.model}
        </p>
      )}
    </div>
  );
}
