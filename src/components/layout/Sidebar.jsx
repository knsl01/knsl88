import React from "react";
import {
  LayoutDashboard, Scale, FileSignature, BookOpen, ShieldCheck, FileSearch, ScanLine,
  ChevronRight, Sparkles, LogOut, User,
} from "lucide-react";
import { LogoMark } from "../../theme.jsx";
import { NAV_ITEMS } from "../../app/navigation.js";

import PASAL from "../../data/statutes/pasal.json";

/* ---------- sidebar ---------- */
export function Sidebar({ active, setActive, open, onClose, user, onLogout }) {
  const items = NAV_ITEMS;
  const pick = (id) => { setActive(id); onClose(); };
  return (
    <aside className={`glass sidebar scrollbar ${open ? "open" : ""}`} style={{ borderRadius: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "0 6px 4px" }}>
        <LogoMark size={46} />
        <div>
          <div className="serif" style={{ fontSize: 21, fontWeight: 700, lineHeight: 1, letterSpacing: ".5px" }}>KNSL</div>
          <div style={{ fontSize: 10, letterSpacing: "2.5px", color: "var(--champagne)", marginTop: 3, textTransform: "uppercase" }}>Legal Intelligence</div>
        </div>
      </div>
      <div className="hairline" style={{ margin: "22px 0 18px" }} />
      <div style={{ fontSize: 10.5, letterSpacing: "2px", color: "var(--muted-2)", textTransform: "uppercase", padding: "0 8px 10px" }}>Modul Utama</div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.id} className={`nav-item ${active === it.id ? "active" : ""}`} onClick={() => pick(it.id)}>
              <Icon size={18} strokeWidth={1.8} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {active === it.id && <ChevronRight size={14} className="gold-text" />}
            </div>
          );
        })}
      </nav>
      <div style={{ marginTop: "auto" }}>
        <div className="glass" style={{ padding: 16, background: "linear-gradient(150deg,rgba(19,133,92,0.14),rgba(8,10,9,0.2))" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Sparkles size={15} className="gold-text" /><span className="gold-text" style={{ fontSize: 12.5, fontWeight: 600 }}>AI Counsel · Aktif</span>
          </div>
          <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, margin: 0 }}>{PASAL.length} pasal terindeks dari KUHP, UU PT & UUD 1945.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "16px 6px 0" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,rgba(19,133,92,0.25),#101413)", border: "1px solid var(--line)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600 }} className="gold-text">
            {user ? user.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() : "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user ? user.name : "—"}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>@{user ? user.username : ""}</div>
          </div>
          <LogOut size={16} style={{ color: "var(--muted)", cursor: "pointer", flexShrink: 0 }} onClick={onLogout} title="Keluar" />
        </div>
      </div>
    </aside>
  );
}

