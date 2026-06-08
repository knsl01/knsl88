/** Premium auth shell — Bloomberg / Harvey-inspired legal-tech aesthetic */
export const AUTH_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

.auth-root {
  --auth-void: #050706;
  --auth-panel: #0a0d0c;
  --auth-card: #0e1210;
  --auth-border: rgba(212, 189, 138, 0.14);
  --auth-border-focus: rgba(31, 179, 126, 0.55);
  --auth-emerald: #13855c;
  --auth-emerald-bright: #1fb37e;
  --auth-emerald-glow: rgba(31, 179, 126, 0.35);
  --auth-gold: #d4af37;
  --auth-gold-soft: #e7d6ac;
  --auth-text: #eef2ef;
  --auth-muted: #8a9690;
  --auth-muted-2: #5c6863;
  --auth-error: #ff8a7a;
  --auth-error-bg: rgba(220, 68, 55, 0.1);
  --auth-success: #1fb37e;
  --auth-success-bg: rgba(31, 179, 126, 0.1);
  font-family: 'DM Sans', 'Hanken Grotesk', system-ui, sans-serif;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--auth-void);
  color: var(--auth-text);
  -webkit-font-smoothing: antialiased;
}

.auth-shell {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  min-height: 100dvh;
}

.auth-brand {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 56px;
  background:
    linear-gradient(165deg, rgba(19, 133, 92, 0.12) 0%, transparent 42%),
    linear-gradient(220deg, rgba(212, 175, 55, 0.06) 0%, transparent 50%),
    var(--auth-panel);
  border-right: 1px solid var(--auth-border);
  overflow: hidden;
}

.auth-brand::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(212, 189, 138, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212, 189, 138, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, black 0%, transparent 85%);
  pointer-events: none;
}

.auth-brand-glow {
  position: absolute;
  width: 420px;
  height: 420px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(31, 179, 126, 0.15) 0%, transparent 70%);
  top: -80px;
  right: -120px;
  pointer-events: none;
  animation: authPulse 8s ease-in-out infinite;
}

@keyframes authPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}

.auth-brand-inner { position: relative; z-index: 1; }

.auth-brand h1 {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: clamp(2.5rem, 4vw, 3.25rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  margin: 20px 0 0;
  line-height: 1.05;
}

.auth-brand-tag {
  font-size: 10px;
  letter-spacing: 0.35em;
  text-transform: uppercase;
  color: var(--auth-gold-soft);
  margin-top: 10px;
}

.auth-brand-lead {
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--auth-muted);
  max-width: 400px;
  margin-top: 28px;
}

.auth-trust {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: auto;
  padding-top: 40px;
}

.auth-trust-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: var(--auth-muted);
}

.auth-trust-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--auth-emerald-bright);
  box-shadow: 0 0 10px var(--auth-emerald-glow);
  flex-shrink: 0;
}

.auth-form-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  background: var(--auth-void);
}

.auth-form-wrap {
  width: 100%;
  max-width: 400px;
  animation: authFadeUp 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes authFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.auth-mobile-brand {
  display: none;
  text-align: center;
  margin-bottom: 32px;
}

.auth-mobile-brand h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2rem;
  font-weight: 700;
  margin: 12px 0 0;
}

.auth-form-header { margin-bottom: 28px; }

.auth-form-header h2 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 1.75rem;
  font-weight: 600;
  margin: 0 0 8px;
  letter-spacing: 0.01em;
}

.auth-form-header p {
  margin: 0;
  font-size: 14px;
  color: var(--auth-muted);
  line-height: 1.55;
}

.auth-field { margin-bottom: 18px; }

.auth-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--auth-muted);
  margin-bottom: 8px;
}

.auth-input-wrap { position: relative; }

.auth-input {
  width: 100%;
  padding: 14px 16px;
  padding-right: 44px;
  font-size: 15px;
  font-family: inherit;
  color: var(--auth-text);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--auth-border);
  border-radius: 12px;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
}

.auth-input::placeholder { color: var(--auth-muted-2); }

.auth-input:hover { border-color: rgba(212, 189, 138, 0.22); }

.auth-input:focus {
  border-color: var(--auth-border-focus);
  box-shadow: 0 0 0 3px rgba(19, 133, 92, 0.12);
  background: rgba(255, 255, 255, 0.04);
}

.auth-input.auth-input-error {
  border-color: rgba(255, 138, 122, 0.5);
  box-shadow: 0 0 0 3px rgba(220, 68, 55, 0.08);
}

.auth-input-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--auth-muted-2);
  pointer-events: none;
}

.auth-field-error {
  font-size: 12px;
  color: var(--auth-error);
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.auth-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 15px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.02em;
  color: #eafff4;
  background: linear-gradient(180deg, #1a9d6e 0%, var(--auth-emerald) 45%, #0c4a33 100%);
  border: 1px solid rgba(31, 179, 126, 0.45);
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.25s, filter 0.2s;
  box-shadow: 0 4px 24px -4px var(--auth-emerald-glow);
  margin-top: 8px;
}

.auth-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.06);
  box-shadow: 0 8px 32px -4px var(--auth-emerald-glow);
}

.auth-btn:active:not(:disabled) { transform: translateY(0); }

.auth-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.auth-btn-ghost {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--auth-muted);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;
}

.auth-btn-ghost:hover {
  color: var(--auth-gold-soft);
  background: rgba(212, 175, 55, 0.04);
}

.auth-link {
  font-size: 13px;
  color: var(--auth-emerald-bright);
  text-decoration: none;
  font-weight: 500;
  cursor: pointer;
  background: none;
  border: none;
  font-family: inherit;
  padding: 0;
  transition: color 0.2s;
}

.auth-link:hover { color: var(--auth-gold-soft); }

.auth-row-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.auth-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 18px;
  animation: authFadeUp 0.35s ease both;
}

.auth-alert-error {
  background: var(--auth-error-bg);
  border: 1px solid rgba(220, 68, 55, 0.28);
  color: var(--auth-error);
}

.auth-alert-success {
  background: var(--auth-success-bg);
  border: 1px solid rgba(31, 179, 126, 0.28);
  color: var(--auth-success);
}

.auth-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--auth-border), transparent);
  margin: 24px 0;
}

.auth-divider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 18px;
}
.auth-divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--auth-border), transparent);
}
.auth-divider-text {
  font-size: 11.5px;
  color: var(--auth-muted-2);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
}

.auth-social-btn {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 12px;
  border: 1px solid var(--auth-border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--auth-text);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s, transform 0.15s;
}
.auth-social-btn:hover:not(:disabled) {
  border-color: rgba(212, 189, 138, 0.35);
  background: rgba(255, 255, 255, 0.07);
}
.auth-social-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.auth-social-google svg {
  flex-shrink: 0;
}

.auth-method-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 18px;
}
.auth-method-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--auth-border);
  background: transparent;
  color: var(--auth-muted);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.auth-method-tab.active {
  border-color: rgba(31, 179, 126, 0.45);
  background: rgba(31, 179, 126, 0.1);
  color: var(--auth-emerald-bright);
}
.auth-method-tab:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auth-phone-hint {
  font-size: 12.5px;
  color: var(--auth-muted);
  line-height: 1.5;
  margin: 0 0 14px;
}
.auth-phone-signup-hint {
  font-size: 12.5px;
  color: var(--auth-muted);
  line-height: 1.5;
  margin: 0 0 18px;
  text-align: center;
}

.auth-footer-note {
  text-align: center;
  font-size: 11px;
  color: var(--auth-muted-2);
  margin-top: 28px;
  letter-spacing: 0.02em;
}

.auth-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: authSpin 0.7s linear infinite;
}

@keyframes authSpin { to { transform: rotate(360deg); } }

.auth-loader-screen {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: var(--auth-void);
}

.auth-loader-ring {
  width: 44px;
  height: 44px;
  border: 2px solid rgba(212, 189, 138, 0.15);
  border-top-color: var(--auth-emerald-bright);
  border-radius: 50%;
  animation: authSpin 0.9s linear infinite;
}

.auth-strength {
  display: flex;
  gap: 4px;
  margin-top: 8px;
}

.auth-strength-bar {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.08);
  transition: background 0.3s;
}

.auth-strength-bar.on { background: var(--auth-emerald-bright); }
.auth-strength-bar.mid { background: var(--auth-gold); }
.auth-strength-bar.weak { background: var(--auth-error); }

/* Mobile-only ambient layer (hidden on desktop) */
.auth-mobile-ambient,
.auth-marquee { display: none; }

@media (max-width: 900px) {
  .auth-shell { grid-template-columns: 1fr; }
  .auth-brand { display: none; }
  .auth-mobile-brand { display: block; }

  .auth-root {
    position: relative;
    overflow-x: hidden;
    background:
      radial-gradient(ellipse 130% 70% at 50% -15%, rgba(19, 133, 92, 0.28) 0%, transparent 52%),
      radial-gradient(ellipse 90% 55% at 100% 85%, rgba(212, 175, 55, 0.1) 0%, transparent 48%),
      radial-gradient(ellipse 70% 45% at -10% 60%, rgba(31, 179, 126, 0.08) 0%, transparent 50%),
      linear-gradient(175deg, #0c1210 0%, #050706 38%, #080c0a 100%);
  }

  .auth-root::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background-image:
      linear-gradient(rgba(212, 189, 138, 0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(212, 189, 138, 0.035) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: linear-gradient(180deg, rgba(0,0,0,0.55) 0%, transparent 72%);
  }

  .auth-mobile-ambient {
    display: block;
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .auth-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(60px);
    animation: authOrbFloat 14s ease-in-out infinite;
  }

  .auth-orb-emerald {
    width: 280px;
    height: 280px;
    top: -60px;
    right: -80px;
    background: radial-gradient(circle, rgba(31, 179, 126, 0.35) 0%, transparent 70%);
  }

  .auth-orb-gold {
    width: 220px;
    height: 220px;
    bottom: 18%;
    left: -70px;
    background: radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, transparent 70%);
    animation-delay: -5s;
  }

  @keyframes authOrbFloat {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.75; }
    50% { transform: translate(12px, 18px) scale(1.06); opacity: 1; }
  }

  .auth-shell { position: relative; z-index: 1; }

  .auth-form-panel {
    padding: 20px 18px calc(72px + env(safe-area-inset-bottom, 0px));
    padding-top: calc(var(--knsl-safe-top, env(safe-area-inset-top, 0px)) + 16px);
    align-items: flex-start;
    background: transparent;
    min-height: 100dvh;
  }

  .auth-form-wrap {
    background: rgba(12, 16, 14, 0.78);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    border: 1px solid rgba(212, 189, 138, 0.14);
    border-radius: 22px;
    padding: 26px 20px 22px;
    box-shadow:
      0 28px 72px -24px rgba(0, 0, 0, 0.75),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  .auth-mobile-brand {
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(212, 189, 138, 0.1);
  }

  .auth-mobile-brand .auth-brand-tag {
    margin-top: 8px;
    font-size: 9px;
    letter-spacing: 0.32em;
  }

  .auth-footer-note {
    margin-top: 22px;
    padding-top: 16px;
    border-top: 1px solid rgba(212, 189, 138, 0.08);
  }

  /* Bottom marquee — login only */
  .auth-marquee {
    display: block;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 30;
    height: 46px;
    padding-bottom: env(safe-area-inset-bottom, 0px);
    background: linear-gradient(180deg, rgba(5, 7, 6, 0) 0%, rgba(5, 7, 6, 0.92) 28%, rgba(8, 12, 10, 0.98) 100%);
    border-top: 1px solid rgba(31, 179, 126, 0.18);
    overflow: hidden;
  }

  .auth-marquee-track {
    display: flex;
    width: max-content;
    height: 46px;
    align-items: center;
    animation: authMarqueeScroll 38s linear infinite;
    will-change: transform;
  }

  .auth-marquee-text {
    flex-shrink: 0;
    padding: 0 28px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;
    color: rgba(231, 214, 172, 0.88);
    background: linear-gradient(90deg, var(--auth-gold-soft), var(--auth-emerald-bright), var(--auth-gold-soft));
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: authMarqueeShimmer 6s linear infinite;
  }

  @keyframes authMarqueeScroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  @keyframes authMarqueeShimmer {
    0% { background-position: 0% center; }
    100% { background-position: 200% center; }
  }

  .auth-marquee-fade {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 48px;
    z-index: 2;
    pointer-events: none;
  }

  .auth-marquee-fade-left {
    left: 0;
    background: linear-gradient(90deg, rgba(8, 12, 10, 0.98), transparent);
  }

  .auth-marquee-fade-right {
    right: 0;
    background: linear-gradient(270deg, rgba(8, 12, 10, 0.98), transparent);
  }
}

@media (max-width: 480px) {
  .auth-input { font-size: 16px; }
  .auth-btn { padding: 16px; }
  .auth-form-wrap { padding: 22px 16px 18px; border-radius: 18px; }
  .auth-marquee-text { font-size: 10px; letter-spacing: 0.12em; }
}

@media (max-width: 900px) and (prefers-reduced-motion: reduce) {
  .auth-marquee-track,
  .auth-marquee-text,
  .auth-orb { animation: none !important; }
}
`;
