/**
 * PremiumLoginScene.jsx
 * Drop into: src/PremiumLoginScene.jsx
 *
 * Cinematic background for the KNSL login page.
 * Renders: aurora layers, AI particle canvas, Lady Justice
 * hologram (CSS 3D), floating legal-document holograms.
 *
 * Props:
 *   charging {boolean} — true while login is processing;
 *                        activates energy pulses + particle convergence
 *
 * Usage:
 *   import PremiumLoginScene from './PremiumLoginScene.jsx';
 *   <PremiumLoginScene charging={busy} />
 */

import React, { useRef, useEffect } from 'react';

/* ── Particle canvas ─────────────────────────────────────── */
function Particles({ charging }) {
  const ref = useRef(null);
  const chargeRef = useRef(charging);
  chargeRef.current = charging;

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = cv.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0, raf = 0, parts = [], running = true;

    const resize = () => {
      const r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = Math.max(1, w * DPR);
      cv.height = Math.max(1, h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const spawn = (anywhere) => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 14,
      r: 0.6 + Math.random() * 1.7,
      vy: 0.1 + Math.random() * 0.34,
      sway: Math.random() * Math.PI * 2,
      sa: 0.15 + Math.random() * 0.45,
      gold: Math.random() < 0.28,
      a: 0.12 + Math.random() * 0.45,
    });

    resize();
    const N = Math.min(85, Math.max(28, Math.round((w * h) / 17000)));
    for (let i = 0; i < N; i++) parts.push(spawn(true));

    const EM = '31,179,126', GOLD = '222,184,90';

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const ch = chargeRef.current;
      const boost = ch ? 4.2 : 1;
      for (const p of parts) {
        p.sway += 0.011;
        p.y -= p.vy * boost;
        p.x += Math.sin(p.sway) * 0.2 * p.sa;
        if (ch) p.x += (w * 0.5 - p.x) * 0.014;
        if (p.y < -14 || p.x < -20 || p.x > w + 20) Object.assign(p, spawn(!ch));
        const a = Math.min(0.9, p.a * (ch ? 2 : 1));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.gold ? GOLD : EM},${a})`;
        ctx.arc(p.x, p.y, p.r * (ch ? 1.25 : 1), 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onVis = () => {
      running = !document.hidden;
      if (running) raf = requestAnimationFrame(tick);
      else cancelAnimationFrame(raf);
    };
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className="knsl-pc" aria-hidden="true" />;
}

/* ── Floating holographic legal document ─────────────────── */
function HoloDoc({ cls, label, lines = 4 }) {
  return (
    <div className={`knsl-doc ${cls}`} aria-hidden="true">
      <div className="knsl-doc-head">
        <span className="knsl-doc-seal" />
        <span className="knsl-doc-lbl">{label}</span>
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <span key={i} className="knsl-doc-line" style={{ width: 92 - i * 14 + '%' }} />
      ))}
      <span className="knsl-doc-stamp">TERVERIFIKASI · AI</span>
    </div>
  );
}

/* ── Scale pan ───────────────────────────────────────────── */
function Pan({ side }) {
  return (
    <div className={`knsl-scale knsl-${side}`}>
      <span className="knsl-ch knsl-ch1" /><span className="knsl-ch knsl-ch2" /><span className="knsl-ch knsl-ch3" />
      <span className="knsl-pan" /><span className="knsl-pan-glow" />
    </div>
  );
}

/* ── Main export ─────────────────────────────────────────── */
export default function PremiumLoginScene({ charging = false }) {
  return (
    <div className={`knsl-scene${charging ? ' is-charging' : ''}`} aria-hidden="true">
      {/* aurora */}
      <div className="knsl-aurora">
        <span className="knsl-au knsl-au1" /><span className="knsl-au knsl-au2" /><span className="knsl-au knsl-au3" />
      </div>

      {/* grid floor */}
      <span className="knsl-floor" />

      {/* particles */}
      <Particles charging={charging} />

      {/* hologram stage */}
      <div className="knsl-stage">
        <div className="knsl-holo">
          <span className="knsl-cone" />
          <div className="knsl-rings">
            <span className="knsl-ring knsl-r1" /><span className="knsl-ring knsl-r2" /><span className="knsl-ring knsl-r3" />
          </div>
          <div className="knsl-figure">
            <span className="knsl-halo" />
            <span className="knsl-head" />
            <span className="knsl-blindfold" />
            <span className="knsl-body" />
            <span className="knsl-body-core" />
            <div className="knsl-yoke">
              <span className="knsl-beam" /><span className="knsl-boss" />
              <Pan side="l" /><Pan side="r" />
            </div>
          </div>
          <span className="knsl-scanline" />
          <span className="knsl-pulse knsl-p1" /><span className="knsl-pulse knsl-p2" /><span className="knsl-pulse knsl-p3" />
        </div>

        <HoloDoc cls="knsl-d1" label="AKTA · 2024/118" lines={4} />
        <HoloDoc cls="knsl-d2" label="PUTUSAN · 482 K/PDT" lines={3} />
        <HoloDoc cls="knsl-d3" label="UU PT · PASAL 97" lines={3} />
      </div>
    </div>
  );
}
