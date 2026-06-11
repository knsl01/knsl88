/**
 * PremiumLogin.jsx — Drop into: src/PremiumLogin.jsx
 *
 * Cinematic wrapper for the KNSL login route. It does NOT replace any
 * login form or auth logic — it renders the existing login UI as
 * {children} on top of the animated Lady Justice scene, and reads the
 * form's own busy state to fire the "charging" energy surge.
 *
 * Use it in src/pages/LoginRoutePage.jsx:
 *
 *   import PremiumLogin from "../PremiumLogin.jsx";
 *   import "../premium.css";
 *   // ...
 *   return (
 *     <PremiumLogin>
 *       {!isSupabaseConfigured
 *         ? <LoginScreen onLogin={...} />
 *         : <LoginPage />}
 *     </PremiumLogin>
 *   );
 */

import React, { useState, useEffect, useRef } from 'react';
import PremiumLoginScene from './PremiumLoginScene.jsx';

export default function PremiumLogin({ children }) {
  const [charging, setCharging] = useState(false);
  const rootRef = useRef(null);

  /* Charging = the submit button is disabled (the form's own busy state).
     Works for both the legacy LoginScreen and the Supabase LoginPage. */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const read = () => {
      const btn = root.querySelector(
        'button[type="submit"], form button[disabled], .btn-primary[disabled]'
      );
      const busy =
        !!root.querySelector('button[type="submit"]:disabled') ||
        !!root.querySelector('[class*="spin"]') ||
        !!root.querySelector('[aria-busy="true"]');
      setCharging(busy);
      return btn;
    };

    read();
    const obs = new MutationObserver(read);
    obs.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['disabled', 'class', 'aria-busy'],
    });
    return () => obs.disconnect();
  }, []);

  /* Mouse parallax → drives the scene layers via CSS vars. */
  const onMove = (e) => {
    const root = rootRef.current;
    if (!root) return;
    const r = root.getBoundingClientRect();
    root.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    root.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onLeave = () => {
    const root = rootRef.current;
    if (!root) return;
    root.style.setProperty('--px', '0');
    root.style.setProperty('--py', '0');
  };

  return (
    <div
      ref={rootRef}
      className={`knsl-plogin${charging ? ' is-charging' : ''}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <PremiumLoginScene charging={charging} />
      <div className="knsl-plogin-content">{children}</div>
    </div>
  );
}
