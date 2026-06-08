import React, { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "../../../contexts/AuthContext.jsx";
import AuthLayout from "../components/AuthLayout.jsx";
import AuthField from "../components/AuthField.jsx";
import AuthButton from "../components/AuthButton.jsx";
import AuthAlert from "../components/AuthAlert.jsx";
import { validateEmail } from "../utils/validation.js";
import { formatAuthError } from "../utils/errors.js";

export default function ForgotPasswordPage({ onNavigate }) {
  const { resetPassword } = useAuth();
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
      setSuccess("Link reset password telah dikirim. Periksa inbox dan folder spam.");
    } catch (err) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Kami akan mengirim link aman ke email terdaftar Anda."
    >
      <AuthAlert variant="error">{error}</AuthAlert>
      <AuthAlert variant="success">{success}</AuthAlert>

      <form onSubmit={submit} noValidate>
        <AuthField
          label="Email akun"
          name="email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setFieldErrors({}); }}
          error={fieldErrors.email}
          placeholder="nama@firma.com"
          autoComplete="email"
          icon={Mail}
          disabled={loading}
        />
        <AuthButton loading={loading}>Kirim link reset</AuthButton>
      </form>

      <button type="button" className="auth-btn-ghost" onClick={() => onNavigate("login")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <ArrowLeft size={16} /> Kembali ke masuk
      </button>
    </AuthLayout>
  );
}
