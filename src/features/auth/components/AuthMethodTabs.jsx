import React from "react";
import { Mail, Phone } from "lucide-react";
import { useI18n } from "../../../i18n/I18nContext.jsx";

export default function AuthMethodTabs({ method, onChange, disabled }) {
  const { t } = useI18n();
  const tabs = [
    { id: "email", label: t("auth.tabEmail"), icon: Mail },
    { id: "phone", label: t("auth.tabPhone"), icon: Phone },
  ];

  return (
    <div className="auth-method-tabs" role="tablist" aria-label={t("auth.loginMethod")}>
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={method === id}
          className={`auth-method-tab ${method === id ? "active" : ""}`}
          onClick={() => !disabled && onChange(id)}
          disabled={disabled}
        >
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}
