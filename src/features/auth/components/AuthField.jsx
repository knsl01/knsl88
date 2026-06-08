import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthField({
  label,
  type = "text",
  name,
  value,
  onChange,
  error,
  placeholder,
  autoComplete,
  icon: Icon,
  disabled,
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && show ? "text" : type;

  return (
    <div className="auth-field">
      {label && (
        <label className="auth-label" htmlFor={name}>
          {label}
        </label>
      )}
      <div className="auth-input-wrap">
        <input
          id={name}
          name={name}
          type={inputType}
          className={`auth-input${error ? " auth-input-error" : ""}`}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {isPassword ? (
          <button
            type="button"
            className="auth-input-icon"
            style={{ pointerEvents: "auto", background: "none", border: "none", cursor: "pointer", padding: 4 }}
            onClick={() => setShow((s) => !s)}
            tabIndex={-1}
            aria-label={show ? "Sembunyikan password" : "Tampilkan password"}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        ) : Icon ? (
          <span className="auth-input-icon">
            <Icon size={18} />
          </span>
        ) : null}
      </div>
      {error && (
        <div id={`${name}-error`} className="auth-field-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
