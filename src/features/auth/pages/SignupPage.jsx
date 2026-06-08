import React, { useState } from "react";
import { Mail, User } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthField from "../components/AuthField.jsx";
import AuthButton from "../components/AuthButton.jsx";
import AuthAlert from "../components/AuthAlert.jsx";
import PasswordStrength from "../components/PasswordStrength.jsx";
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
} from "../utils/validation.js";
import { formatAuthError } from "../utils/errors.js";

export default function SignupPage({ onNavigate }) {
  const { signUp } = useAuth();
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
    const nErr = validateRequired(fullName, "Nama lengkap");
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
        setSuccess("Akun dibuat. Cek email Anda untuk konfirmasi, lalu masuk.");
        setTimeout(() => onNavigate("login"), 2500);
      } else {
        setSuccess("Akun berhasil dibuat. Mengalihkan…");
      }
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Buat akun profesional"
      subtitle="Data analisa dan kontrak Anda tersimpan aman di cloud."
    >
      <AuthAlert variant="error">{error}</AuthAlert>
      <AuthAlert variant="success">{success}</AuthAlert>

      <form onSubmit={submit} noValidate>
        <AuthField
          label="Nama lengkap"
          name="fullName"
          value={fullName}
          onChange={(e) => { setFullName(e.target.value); setFieldErrors((f) => ({ ...f, fullName: null })); }}
          error={fieldErrors.fullName}
          placeholder="Adv. Nama Lengkap"
          autoComplete="name"
          icon={User}
          disabled={loading}
        />
        <AuthField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors((f) => ({ ...f, email: null })); }}
          error={fieldErrors.email}
          placeholder="nama@firma.com"
          autoComplete="email"
          icon={Mail}
          disabled={loading}
        />
        <AuthField
          label="Firma / kantor (opsional)"
          name="firm"
          value={firmName}
          onChange={(e) => setFirmName(e.target.value)}
          placeholder="KNSL & Rekan"
          disabled={loading}
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: null })); }}
          error={fieldErrors.password}
          placeholder="Min. 8 karakter"
          autoComplete="new-password"
          disabled={loading}
        />
        <PasswordStrength password={password} />
        <AuthField
          label="Konfirmasi password"
          name="password2"
          type="password"
          value={password2}
          onChange={(e) => { setPassword2(e.target.value); setFieldErrors((f) => ({ ...f, password2: null })); }}
          error={fieldErrors.password2}
          placeholder="Ulangi password"
          autoComplete="new-password"
          disabled={loading}
        />

        <AuthButton loading={loading}>Daftar</AuthButton>
      </form>

      <div className="auth-divider" />

      <p style={{ textAlign: "center", fontSize: 14, color: "var(--auth-muted)", margin: 0 }}>
        Sudah punya akun?{" "}
        <button type="button" className="auth-link" onClick={() => onNavigate("login")}>
          Masuk
        </button>
      </p>
    </AuthLayout>
  );
}
