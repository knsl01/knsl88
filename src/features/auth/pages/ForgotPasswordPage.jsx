import React, { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useI18n } from "../../../i18n/I18nContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthField from "../components/AuthField.jsx";
import AuthButton from "../components/AuthButton.jsx";
import AuthAlert from "../components/AuthAlert.jsx";
import { validateEmail } from "../utils/validation.js";
import { formatAuthError } from "../utils/errors.js";
import { ROUTES } from "../../../routes/paths.js";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const eErr = validateEmail(email);
    setFieldErrors(eErr ? { email: eErr } : {});
    if (eErr) return;

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(t("auth.resetSent"));
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.forgotTitle")}
      subtitle={t("auth.forgotSub")}
    >
      <AuthAlert variant="error">{error}</AuthAlert>
      <AuthAlert variant="success">{success}</AuthAlert>

      <form onSubmit={submit} noValidate>
        <AuthField
          label={t("auth.emailAccount")}
          name="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors({}); }}
          error={fieldErrors.email}
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          icon={Mail}
          disabled={loading}
        />
        <AuthButton loading={loading}>{t("auth.resetBtn")}</AuthButton>
      </form>

      <button
        type="button"
        className="auth-btn-ghost"
        onClick={() => navigate(ROUTES.LOGIN)}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <ArrowLeft size={16} /> {t("auth.backLogin")}
      </button>
    </AuthLayout>
  );
}
