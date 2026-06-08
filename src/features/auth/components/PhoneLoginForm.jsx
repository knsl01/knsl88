import React, { useState } from "react";
import { Phone } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import { useI18n } from "../../../i18n/I18nContext.jsx";
import AuthField from "./AuthField.jsx";
import AuthButton from "./AuthButton.jsx";
import { normalizePhoneId, formatPhoneDisplay } from "../../../lib/phoneAuth.js";
import { formatAuthError } from "../utils/errors.js";
import { DEFAULT_AUTHENTICATED_ROUTE } from "../../../routes/paths.js";

export default function PhoneLoginForm({ onError, disabled }) {
  const { t } = useI18n();
  const { sendPhoneOtp, verifyPhoneOtp, isSupabase } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [normalized, setNormalized] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isSupabase) return null;

  const sendOtp = async (e) => {
    e?.preventDefault();
    onError?.("");
    const e164 = normalizePhoneId(phone);
    if (!e164) {
      setFieldError(t("auth.phoneRequired"));
      return;
    }
    if (!/^\+62[0-9]{9,13}$/.test(e164)) {
      setFieldError(t("auth.phoneInvalid"));
      return;
    }
    setLoading(true);
    try {
      await sendPhoneOtp(e164);
      setNormalized(e164);
      setStep("otp");
      setFieldError("");
      setOtp("");
    } catch (ex) {
      onError?.(formatAuthError(ex));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    onError?.("");
    const code = otp.replace(/\D/g, "");
    if (code.length < 4) {
      setFieldError(t("auth.phoneOtpInvalid"));
      return;
    }
    setLoading(true);
    try {
      await verifyPhoneOtp(normalized, code);
      const redirectTo = location.state?.from?.pathname || DEFAULT_AUTHENTICATED_ROUTE;
      navigate(redirectTo, { replace: true });
    } catch (ex) {
      onError?.(formatAuthError(ex));
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <form onSubmit={verify} noValidate>
        <p className="auth-phone-hint">
          {t("auth.phoneOtpSent")}{" "}
          <strong>{formatPhoneDisplay(normalized)}</strong>
        </p>
        <AuthField
          label={t("auth.phoneOtpLabel")}
          name="otp"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={otp}
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 8)); setFieldError(""); }}
          error={fieldError}
          placeholder="123456"
          disabled={loading || disabled}
        />
        <AuthButton loading={loading} disabled={disabled}>{t("auth.phoneVerifyBtn")}</AuthButton>
        <div className="auth-row-between" style={{ marginTop: 12 }}>
          <button type="button" className="auth-link" onClick={() => { setStep("phone"); setOtp(""); onError?.(""); }}>
            {t("auth.phoneChange")}
          </button>
          <button type="button" className="auth-link" onClick={sendOtp} disabled={loading}>
            {t("auth.phoneResend")}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={sendOtp} noValidate>
      <AuthField
        label={t("auth.phoneLabel")}
        name="phone"
        type="tel"
        value={phone}
        onChange={(e) => { setPhone(e.target.value); setFieldError(""); }}
        error={fieldError}
        placeholder={t("auth.phonePlaceholder")}
        autoComplete="tel"
        icon={Phone}
        disabled={loading || disabled}
      />
      <p className="auth-phone-hint">{t("auth.phoneHint")}</p>
      <AuthButton loading={loading} disabled={disabled}>{t("auth.phoneSendOtp")}</AuthButton>
    </form>
  );
}
