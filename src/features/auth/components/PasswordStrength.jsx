import React from "react";
import { passwordStrength } from "../utils/validation.js";

export default function PasswordStrength({ password }) {
  const { score, label } = passwordStrength(password);
  if (!password) return null;
  const bars = [1, 2, 3].map((i) => {
    let cls = "auth-strength-bar";
    if (i <= score) {
      cls += score === 1 ? " weak" : score === 2 ? " mid" : " on";
    }
    return <div key={i} className={cls} />;
  });
  return (
    <div style={{ marginTop: -10, marginBottom: 12 }}>
      <div className="auth-strength">{bars}</div>
      <div style={{ fontSize: 11, color: "var(--auth-muted)", marginTop: 6 }}>Kekuatan: {label}</div>
    </div>
  );
}
