import React from "react";
import { AUTH_STYLES } from "../styles/authStyles.js";
import { LogoMark } from "../../../theme.jsx";

export default function AuthLoader({ message = "Memuat sesi aman…" }) {
  return (
    <div className="auth-root auth-loader-screen">
      <style>{AUTH_STYLES}</style>
      <LogoMark size={40} />
      <div className="auth-loader-ring" aria-hidden />
      <p style={{ fontSize: 14, color: "var(--auth-muted)", margin: 0 }}>{message}</p>
    </div>
  );
}
