import React from "react";
import { Languages } from "lucide-react";
import { useI18n } from "../i18n/I18nContext.jsx";

/** Compact ID / EN language toggle */
export default function LanguageSwitcher({ compact = false }) {
  const { locale, setLocale, t } = useI18n();

  if (compact) {
    return (
      <div className="lang-switch lang-switch--compact" role="group" aria-label={t("lang.switch")}>
        <button
          type="button"
          className={`lang-switch-btn ${locale === "id" ? "active" : ""}`}
          onClick={() => setLocale("id")}
          aria-pressed={locale === "id"}
        >
          ID
        </button>
        <button
          type="button"
          className={`lang-switch-btn ${locale === "en" ? "active" : ""}`}
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <div className="lang-switch glass" role="group" aria-label={t("lang.switch")}>
      <Languages size={15} className="gold-text" style={{ flexShrink: 0 }} />
      <span className="lang-switch-label">{t("lang.switch")}</span>
      <button
        type="button"
        className={`lang-switch-btn ${locale === "id" ? "active" : ""}`}
        onClick={() => setLocale("id")}
        aria-pressed={locale === "id"}
      >
        ID
      </button>
      <button
        type="button"
        className={`lang-switch-btn ${locale === "en" ? "active" : ""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
