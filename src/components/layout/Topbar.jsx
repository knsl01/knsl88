import React, { useState } from "react";
import { Menu, Search } from "lucide-react";

/* ---------- topbar ---------- */
export function Topbar({ title, subtitle, onMenu, onGlobalSearch, action }) {
  const [v, setV] = useState("");
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <div className="hamburger glass" onClick={onMenu}><Menu size={20} style={{ color: "var(--silver)" }} /></div>
        <div className="rise" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, letterSpacing: "2px", color: "var(--champagne)", textTransform: "uppercase", marginBottom: 5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</div>
          <h1 className="serif" style={{ fontSize: 26, fontWeight: 600, margin: 0, lineHeight: 1 }}>{title}</h1>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="glass topbar-search">
          <Search size={16} style={{ color: "var(--muted)" }} />
          <input className="field" style={{ border: "none", background: "transparent", padding: 0, fontSize: 13.5 }} placeholder="Cari pasal (mis. pencurian)..."
            value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && v.trim()) onGlobalSearch(v.trim()); }} />
        </div>
        {action}
        <div className="glass glass-hover" style={{ position: "relative", width: 44, height: 44, display: "grid", placeItems: "center", cursor: "pointer", borderRadius: 14 }}>
          <Bell size={18} style={{ color: "var(--silver)" }} />
          <span style={{ position: "absolute", top: 11, right: 12, width: 7, height: 7, borderRadius: "50%", background: "var(--emerald-bright)", boxShadow: "0 0 8px var(--emerald-bright)" }} />
        </div>
      </div>
    </header>
  );
}

