import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useI18n } from "../../../i18n/I18nContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthField from "../components/AuthField.jsx";
import AuthButton from "../components/AuthButton.jsx";
import AuthAlert from "../components/AuthAlert.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";
import { validatePassword, validatePasswordMatch } from "../utils/validation.js";
import { formatAuthError } from "../utils/errors.js";
import { DEFAULT_AUTHENTICATED_ROUTE, ROUTES } from "../../../routes/paths.js";

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const errs = {};
    const pErr = validatePassword(password, { minLength: 8 });
    const mErr = validatePasswordMatch(password, password2);
    if (pErr) errs.password = pErr;
    if (mErr) errs.password2 = mErr;
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess(t("auth.resetDone"));
      window.history.replaceState(null, "", ROUTES.RESET_PASSWORD);
      setTimeout(() => navigate(DEFAULT_AUTHENTICATED_ROUTE, { replace: true }), 1500);
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.resetTitle")}
      subtitle={t("auth.resetSub")}
    >
      <AuthAlert variant="error">{error}</AuthAlert>
      <AuthAlert variant="success">{success}</AuthAlert>

      <form onSubmit={submit} noValidate>
        <AuthField
          label={t("auth.passwordNew")}
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
        <AuthButton loading={loading}>{t("auth.savePasswordBtn")}</AuthButton>
      </form>
    </AuthLayout>
  );
}
