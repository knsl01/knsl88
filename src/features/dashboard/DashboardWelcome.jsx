import React from "react";
import { Sparkles, MessageCircle, Scale } from "lucide-react";
import { useI18n } from "../../i18n/I18nContext.jsx";

function getGreeting(t) {
  const h = new Date().getHours();
  if (h < 11) return t("dashboard.greetingMorning");
  if (h < 15) return t("dashboard.greetingAfternoon");
  if (h < 19) return t("dashboard.greetingEvening");
  return t("dashboard.greetingNight");
}

function firstName(fullName, fallback) {
  const n = String(fullName || "").trim();
  if (!n) return fallback;
  return n.split(/\s+/)[0];
}

export default function DashboardWelcome({ userName, onOpenChat, onOpenAnalysis }) {
  const { t } = useI18n();
  const greeting = getGreeting(t);
  const name = firstName(userName, t("dashboard.user"));

  return (
    <div className="dash-welcome glass rise">
      <div className="dash-welcome-glow" aria-hidden="true" />
      <div className="dash-welcome-body">
        <div>
          <p className="dash-welcome-eyebrow">
            <Sparkles size={13} /> {t("dashboard.workspace")}
          </p>
          <h2 className="serif dash-welcome-title">
            {greeting}, <span className="gold-text">{name}</span>
          </h2>
          <p className="dash-welcome-sub">{t("dashboard.welcomeLead")}</p>
        </div>
        <div className="dash-welcome-actions">
          {onOpenChat && (
            <button type="button" className="btn-primary" onClick={onOpenChat} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <MessageCircle size={16} /> {t("dashboard.openChat")}
            </button>
          )}
          {onOpenAnalysis && (
            <button type="button" className="btn-ghost" onClick={onOpenAnalysis} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <Scale size={16} /> {t("dashboard.openAnalysis")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
