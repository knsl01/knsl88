import React from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

function alertText(children) {
  if (children == null || children === false) return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (typeof children === "object" && typeof children.message === "string") return children.message;
  return "";
}

export default function AuthAlert({ variant = "error", children }) {
  const text = alertText(children);
  if (!text) return null;
  const isError = variant === "error";
  return (
    <div className={`auth-alert auth-alert-${variant}`} role="alert">
      {isError ? <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />}
      <span>{text}</span>
    </div>
  );
}
