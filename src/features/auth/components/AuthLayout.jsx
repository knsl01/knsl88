import React from "react";
import { Shield, Lock, Cloud } from "lucide-react";
import { LogoMark } from "../../../theme.jsx";
import { AUTH_STYLES } from "../styles/authStyles.js";
import AuthMobileMarquee from "./AuthMobileMarquee.jsx";

const TRUST = [
  { icon: Shield, text: "Enkripsi sesi & data terisolasi per akun" },
  { icon: Lock, text: "Autentikasi enterprise via Supabase" },
  { icon: Cloud, text: "Sinkronisasi analisa & kontrak di cloud" },
];

export default function AuthLayout({ children, title, subtitle, showMobileMarquee = false }) {
  return (
    <div className="auth-root">
      <style>{AUTH_STYLES}</style>
      <div className="auth-mobile-ambient" aria-hidden="true">
        <div className="auth-orb auth-orb-emerald" />
        <div className="auth-orb auth-orb-gold" />
      </div>
      {showMobileMarquee && <AuthMobileMarquee />}
      <div className="auth-shell">
        <aside className="auth-brand" aria-hidden="false">
          <div className="auth-brand-glow" />
          <div className="auth-brand-inner">
            <LogoMark size={52} />
            <h1>KNSL</h1>
            <div className="auth-brand-tag">Legal Intelligence</div>
            <p className="auth-brand-lead">
              Platform AI untuk praktisi hukum Indonesia — analisa kasus, drafting, riset pasal,
              dan review kontrak dalam satu workspace aman.
            </p>
          </div>
          <div className="auth-trust">
            {TRUST.map(({ icon: Icon, text }) => (
              <div key={text} className="auth-trust-item">
                <span className="auth-trust-dot" />
                <Icon size={14} style={{ color: "var(--auth-gold-soft)", flexShrink: 0 }} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="auth-form-panel">
          <div className="auth-form-wrap">
            <div className="auth-mobile-brand">
              <LogoMark size={48} />
              <h1>KNSL</h1>
              <div className="auth-brand-tag">Legal Intelligence</div>
            </div>
            {(title || subtitle) && (
              <header className="auth-form-header">
                {title && <h2>{title}</h2>}
                {subtitle && <p>{subtitle}</p>}
              </header>
            )}
            {children}
            <p className="auth-footer-note">
              © {new Date().getFullYear()} KNSL · Confidential legal workspace
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
