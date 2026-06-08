import React from "react";
import { useI18n } from "../../../i18n/I18nContext.jsx";

export default function AuthMobileMarquee() {
  const { t } = useI18n();
  const text = `${t("auth.marquee")} • `;

  return (
    <div className="auth-marquee" aria-hidden="true">
      <div className="auth-marquee-fade auth-marquee-fade-left" />
      <div className="auth-marquee-fade auth-marquee-fade-right" />
      <div className="auth-marquee-track">
        <span className="auth-marquee-text">{text}</span>
        <span className="auth-marquee-text">{text}</span>
      </div>
    </div>
  );
}
