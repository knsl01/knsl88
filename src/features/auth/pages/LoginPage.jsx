import React, { useState } from "react";
import { Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useI18n } from "../../../i18n/I18nContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthField from "../components/AuthField.jsx";
import AuthButton from "../components/AuthButton.jsx";
import AuthAlert from "../components/AuthAlert.jsx";
import GoogleAuthButton from "../components/GoogleAuthButton.jsx";
import PhoneLoginForm from "../components/PhoneLoginForm.jsx";
import AuthMethodTabs from "../components/AuthMethodTabs.jsx";
import { validateEmail, validatePassword } from "../utils/validation.js";
import { formatAuthError } from "../utils/errors.js";
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from "../../../routes/paths.js";

export default function LoginPage() {
  const { t } = useI18n();
  const { signIn, isSupabase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [method, setMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const errs = {};
    const eErr = validateEmail(email);
    const pErr = validatePassword(password, { minLength: 6 });
    if (eErr) errs.email = eErr;
    if (pErr) errs.password = pErr;
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await signIn(email, password);
      const redirectTo = location.state?.from?.pathname || DEFAULT_AUTHENTICATED_ROUTE;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSub")}
      showMobileMarquee
    >
      <AuthAlert variant="error">{error}</AuthAlert>

      {isSupabase && (
        <>
          <GoogleAuthButton
            label={t("auth.googleLogin")}
            disabled={loading}
            onError={setError}
          />
          <div className="auth-divider-row">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">{t("auth.orContinue")}</span>
            <span className="auth-divider-line" />
          </div>
          <AuthMethodTabs method={method} onChange={setMethod} disabled={loading} />
        </>
      )}

      {method === "phone" && isSupabase ? (
        <PhoneLoginForm onError={setError} disabled={loading} />
      ) : (
        <form onSubmit={submit} noValidate>
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
            label={t("auth.password")}
            name="password"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: null })); }}
            error={fieldErrors.password}
            placeholder={t("auth.passwordPlaceholder")}
            autoComplete="current-password"
            disabled={loading}
          />

          <div className="auth-row-between">
            <span />
            <button type="button" className="auth-link" onClick={() => navigate(ROUTES.FORGOT_PASSWORD)}>
              {t("auth.forgotLink")}
            </button>
          </div>

          <AuthButton loading={loading}>{t("auth.loginBtn")}</AuthButton>
        </form>
      )}

      <div className="auth-divider" />

      <p style={{ textAlign: "center", fontSize: 14, color: "var(--auth-muted)", margin: 0 }}>
        {t("auth.noAccount")}{" "}
        <button type="button" className="auth-link" onClick={() => navigate(ROUTES.SIGNUP)}>
          {t("auth.signupLink")}
        </button>
      </p>
    </AuthLayout>
  );
}
