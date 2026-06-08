import React, { useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthField from "../components/AuthField.jsx";
import AuthButton from "../components/AuthButton.jsx";
import AuthAlert from "../components/AuthAlert.jsx";
import { validateEmail, validatePassword } from "../utils/validation.js";
import { formatAuthError } from "../utils/errors.js";

export default function LoginPage({ onNavigate }) {
  const { signIn } = useAuth();
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
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Masuk ke workspace"
      subtitle="Akses analisa hukum, drafting, dan review kontrak Anda."
    >
      <AuthAlert variant="error">{error}</AuthAlert>

      <form onSubmit={submit} noValidate>
        <AuthField
          label="Email profesional"
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
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setFieldErrors((f) => ({ ...f, password: null })); }}
          error={fieldErrors.password}
          placeholder="••••••••"
          autoComplete="current-password"
          disabled={loading}
        />

        <div className="auth-row-between">
          <span />
          <button type="button" className="auth-link" onClick={() => onNavigate("forgot")}>
            Lupa password?
          </button>
        </div>

        <AuthButton loading={loading}>Masuk</AuthButton>
      </form>

      <div className="auth-divider" />

      <p style={{ textAlign: "center", fontSize: 14, color: "var(--auth-muted)", margin: 0 }}>
        Belum punya akun?{" "}
        <button type="button" className="auth-link" onClick={() => onNavigate("signup")}>
          Daftar sekarang
        </button>
      </p>
    </AuthLayout>
  );
}
