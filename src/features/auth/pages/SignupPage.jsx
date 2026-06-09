import React, { useState } from "react";
import { Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useI18n } from "../../../i18n/I18nContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthField from "../components/AuthField.jsx";
import AuthButton from "../components/AuthButton.jsx";
import AuthAlert from "../components/AuthAlert.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from "../utils/validation.js";
import { formatAuthError } from "../utils/errors.js";
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from "../../../routes/paths.js";

export default function SignupPage() {
  const { t } = useI18n();
  const { signUp, isSupabase } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [firmName, setFirmName] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const errs = {};
    const nErr = validateRequired(fullName, t("auth.fullName"));
    const eErr = validateEmail(email);
    const pErr = validatePassword(password, { minLength: 8 });
    const mErr = validatePasswordMatch(password, password2);
    if (nErr) errs.fullName = nErr;
    if (eErr) errs.email = eErr;
    if (pErr) errs.password = pErr;
    if (mErr) errs.password2 = mErr;
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const username = email.split("@")[0];
      const r = await signUp({ email, password, fullName, username });
      if (r.needsEmailConfirmation) {
        setSuccess(t("auth.signupSuccessConfirm"));
        setTimeout(() => navigate(ROUTES.LOGIN, { replace: true }), 2500);
      } else {
        navigate(DEFAULT_AUTHENTICATED_ROUTE, { replace: true });
      }
    } catch (err) {
      const msg = formatAuthError(err);
      setError(msg);
      const code = err?.code || "";
      if (
        code === "email_exists"
        || msg.includes("sudah terdaftar")
        || String(err?.message || "").toLowerCase().includes("already registered")
      ) {
        setTimeout(() => navigate(ROUTES.LOGIN, { state: { email: email.trim().toLowerCase() } }), 2800);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.signupTitle")}
      subtitle={t("auth.signupSub")}
    >
      <AuthAlert variant="error">{error}</AuthAlert>
      <AuthAlert variant="success">{success}</AuthAlert>

      {isSupabase && (
        <>
          <GoogleAuthButton
            label={t("auth.googleSignup")}
            disabled={loading}
            onError={(msg) => setError(typeof msg === "string" ? msg : formatAuthError(msg))}
          />
          <div className="auth-divider-row">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">{t("auth.orContinue")}</span>
            <span className="auth-divider-line" />
          </div>
          <p className="auth-phone-signup-hint">{t("auth.phoneSignupHint")}</p>
        </>
      )}

      <form onSubmit={submit} noValidate>
        <AuthField
          label={t("auth.fullName")}
          name="fullName"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setFieldErrors((f) => ({ ...f, fullName: null })); }}
          error={fieldErrors.fullName}
          placeholder={t("auth.namePlaceholder")}
          autoComplete="name"
          icon={User}
          disabled={loading}
        />
        <AuthField
          label={t("auth.email")}
          name="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: null })); }}
          error={fieldErrors.email}
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
          icon={Mail}
          disabled={loading}
        />
        <AuthField
          label={t("auth.firmOptional")}
          name="firmName"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
          placeholder={t("auth.firmPlaceholder")}
          disabled={loading}
        />
        <AuthField
          label={t("auth.password")}
          name="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: null })); }}
          error={fieldErrors.password}
          placeholder={t("auth.passwordMin")}
          autoComplete="new-password"
          disabled={loading}
        />
        <PasswordStrength password={password} />
        <AuthField
          label={t("auth.passwordConfirm")}
          name="password2"
          type="password"
          value={password2}
          onChange={(e) => { setPassword2(e.target.value); setFieldErrors((f) => ({ ...f, password2: null })); }}
          error={fieldErrors.password2}
          placeholder={t("auth.passwordRepeat")}
          autoComplete="new-password"
          disabled={loading}
        />

        <AuthButton loading={loading}>{t("auth.signupBtn")}</AuthButton>
      </form>

      <div className="auth-divider" />

      <p style={{ textAlign: "center", fontSize: 14, color: "var(--auth-muted)", margin: 0 }}>
        {t("auth.hasAccount")}{" "}
        <button type="button" className="auth-link" onClick={() => navigate(ROUTES.LOGIN)}>
          {t("auth.loginLink")}
        </button>
      </p>
    </AuthLayout>
  );
}
