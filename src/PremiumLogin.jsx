/**
 * PremiumLogin.jsx — Drop into: src/PremiumLogin.jsx
 *
 * Wraps any LoginScreen component with the cinematic scene.
 * Accepts LoginScreen as a prop to avoid circular imports.
 *
 * Usage in KNSLLegalIntelligence.jsx:
 *
 *   import PremiumLogin from './PremiumLogin.jsx';
 *   import './premium.css';
 *
 *   // Where you currently render <LoginScreen onLogin={setUser} />
 *   // replace with:
 *   <PremiumLogin LoginScreen={LoginScreen} onLogin={setUser} />
 */

import React, { useState, useEffect, useRef } from 'react';
import PremiumLoginScene from './PremiumLoginScene.jsx';

export default function PremiumLogin({ LoginScreen, onLogin, ...rest }) {
  const [charging, setCharging] = useState(false);
  const [exiting,  setExiting]  = useState(false);
  const wrapRef = useRef(null);

  // Intercept onLogin — play exit veil then hand off
  const handleLogin = (user) => {
    setExiting(true);
    setTimeout(() => onLogin(user), 550);
  };

  // Detect loading spinner → charging state for the hologram
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new MutationObserver(() => {
      const spinner = el.querySelector('.animate-spin, [class*="spin"]');
      setCharging(!!spinner);
    });
    obs.observe(el, {
      subtree: true, childList: true,
      attributes: true, attributeFilter: ['class'],
    });
    return () => obs.disconnect();
  }, []);

  return (
    <div
      className={`login-screen${exiting ? ' is-exiting' : ''}`}
      style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}
    >
      <PremiumLoginScene charging={charging} />

      <div
        ref={wrapRef}
        style={{
          position: 'relative', zIndex: 10,
          width: '100%', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}
      >
        <LoginScreen onLogin={handleLogin} {...rest} />
      </div>
    </div>
  );
}
