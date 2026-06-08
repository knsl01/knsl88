import React from "react";

export default function AuthButton({ children, loading, disabled, type = "submit", onClick }) {
  return (
    <button type={type} className="auth-btn" disabled={disabled || loading} onClick={onClick}>
      {loading ? <span className="auth-spinner" aria-hidden /> : null}
      <span>{loading ? "Memproses…" : children}</span>
    </button>
  );
}
