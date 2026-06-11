/**
 * PremiumLoginScene.jsx
 * Drop into: src/PremiumLoginScene.jsx  (and put lady-justice.png beside it)
 *
 * Cinematic background for the KNSL login page:
 * aurora layers, AI gold-dust particle canvas, a real obsidian-and-gold
 * Lady Justice statue floating with emerald backlight + floor reflection,
 * and a few floating legal-document holograms.
 *
 * Props:
 *   charging {boolean} — true while login is processing; intensifies the
 *                        backlight, brightens the statue, fires energy rings,
 *                        and pulls the particles inward.
 */

import React, { useRef, useEffect } from 'react';
import statueUrl from './lady-justice.png';

/* ── Particle canvas (gold-dust / AI drift) ──────────────── */
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
      y: anywhere ? Math.random() * h : h + 12,
      r: 0.5 + Math.random() * 1.6,
      vy: 0.08 + Math.random() * 0.28,
      sway: Math.random() * Math.PI * 2,
      sa: 0.15 + Math.random() * 0.4,
      gold: Math.random() < 0.5,
      a: 0.1 + Math.random() * 0.4,
    });

    resize();
    const N = Math.min(70, Math.max(24, Math.round((w * h) / 20000)));
    for (let i = 0; i < N; i++) parts.push(spawn(true));

    const EM = '31,179,126', GOLD = '224,190,110';

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const ch = chargeRef.current;
      const boost = ch ? 3.4 : 1;
      for (const p of parts) {
        p.sway += 0.01;
        p.y -= p.vy * boost;
        p.x += Math.sin(p.sway) * 0.18 * p.sa;
        if (ch) p.x += (w * 0.5 - p.x) * 0.012;
        if (p.y < -12 || p.x < -20 || p.x > w + 20) Object.assign(p, spawn(!ch));
        const a = Math.min(0.85, p.a * (ch ? 1.8 : 1));
        ctx.beginPath();
        ctx.fillStyle = `rgba(${p.gold ? GOLD : EM},${a})`;
        ctx.arc(p.x, p.y, p.r * (ch ? 1.2 : 1), 0, Math.PI * 2);
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

/* ── Main export ─────────────────────────────────────────── */
export default function PremiumLoginScene({ charging = false }) {
  return (
    <div className={`knsl-scene${charging ? ' is-charging' : ''}`} aria-hidden="true">
      {/* aurora */}
      <div className="knsl-aurora">
        <span className="knsl-au knsl-au1" /><span className="knsl-au knsl-au2" /><span className="knsl-au knsl-au3" />
      </div>

      {/* cinematic vignette (no grid floor) */}
      <span className="knsl-vignette" />

      {/* particles */}
      <Particles charging={charging} />

      {/* statue stage */}
      <div className="knsl-stage">
        <span className="knsl-bloom" />
        <div className="knsl-rings">
          <span className="knsl-ring knsl-r1" /><span className="knsl-ring knsl-r2" /><span className="knsl-ring knsl-r3" />
        </div>

        <div className="knsl-statue-wrap">
          <span className="knsl-rim" />
          <img className="knsl-statue" src={statueUrl} alt="Lady Justice — obsidian and gold" draggable="false" />
          <img className="knsl-statue-refl" src={statueUrl} alt="" aria-hidden="true" draggable="false" />
          <span className="knsl-godray knsl-gr1" /><span className="knsl-godray knsl-gr2" />
        </div>

        <span className="knsl-pulse knsl-p1" /><span className="knsl-pulse knsl-p2" /><span className="knsl-pulse knsl-p3" />

        <HoloDoc cls="knsl-d1" label="AKTA · 2024/118" lines={4} />
        <HoloDoc cls="knsl-d2" label="PUTUSAN · 482 K/PDT" lines={3} />
        <HoloDoc cls="knsl-d3" label="UU PT · PASAL 97" lines={3} />
      </div>
    </div>
  );
}
