import React from "react";
import { Sparkles, MessageCircle, Scale } from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 19) return "Selamat sore";
  return "Selamat malam";
}

function firstName(fullName) {
  const n = String(fullName || "").trim();
  if (!n) return "Pengguna";
  return n.split(/\s+/)[0];
}

export default function DashboardWelcome({ userName, onOpenChat, onOpenAnalysis }) {
  const greeting = getGreeting();
  const name = firstName(userName);

  return (
    <div className="dash-welcome glass rise">
      <div className="dash-welcome-glow" aria-hidden="true" />
      <div className="dash-welcome-body">
        <div>
          <p className="dash-welcome-eyebrow">
            <Sparkles size={13} /> Workspace Anda
          </p>
          <h2 className="serif dash-welcome-title">
            {greeting}, <span className="gold-text">{name}</span>
          </h2>
          <p className="dash-welcome-sub">
            Selamat datang di KNSL Legal Intelligence. Mulai dari ringkasan perkara di bawah,
            atau tanyakan langsung pada asisten hukum AI.
          </p>
        </div>
        <div className="dash-welcome-actions">
          {onOpenChat && (
            <button type="button" className="btn-primary" onClick={onOpenChat} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={16} /> Chat Hukum AI
            </button>
          )}
          {onOpenAnalysis && (
            <button type="button" className="btn-ghost" onClick={onOpenAnalysis} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Scale size={16} /> Analisa Kasus
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
