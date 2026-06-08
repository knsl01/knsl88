import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AuthAlert({ variant = "error", children }) {
  if (!children) return null;
  const isError = variant === "error";
  return (
    <div className={`auth-alert auth-alert-${variant}`} role="alert">
      {isError ? <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
      <span>{children}</span>
    </div>
  );
}
