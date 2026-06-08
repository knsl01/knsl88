/* ui.jsx — KNSL design system primitives: icons, eyebrow, header, cards, buttons, chips */

// ─────────────────────────────────────────────────────────────
// Icon set — clean 1.6px stroke line icons, currentColor
// ─────────────────────────────────────────────────────────────
const ICON_PATHS = {
  menu: <><path d="M4 7h16M4 12h12M4 17h16" /></>,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.4" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" /></>,
  scale: <><path d="M12 4v16M7 20h10" /><path d="M5 7h14M9 5l-1 2M15 5l1 2" /><path d="M5 7l-2.5 5a2.5 2.5 0 0 0 5 0L5 7zM19 7l-2.5 5a2.5 2.5 0 0 0 5 0L19 7z" /></>,
  penEdit: <><path d="M5 19h4l9.5-9.5a2.1 2.1 0 0 0-3-3L6 16v3z" /><path d="M14 6.5l3 3" /></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 5.5V20.5" /><path d="M19 18v3H6.5A2.5 2.5 0 0 1 4 18.5" /></>,
  scan: <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" /><path d="M4 12h16" /></>,
  fileSearch: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6" /><path d="M14 3v5h5" /><circle cx="16.5" cy="16.5" r="2.8" /><path d="M19 19l2 2" /></>,
  shield: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>,
  sparkles: <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" /><path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" /></>,
  gear: <><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1l2.1-2.1M17 7l2.1-2.1" /></>,
  chevronRight: <><path d="M9 5l7 7-7 7" /></>,
  chevronDown: <><path d="M5 9l7 7 7-7" /></>,
  chevronUpDown: <><path d="M8 9l4-4 4 4M8 15l4 4 4-4" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M16.5 16.5L21 21" /></>,
  bolt: <><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z" /></>,
  upload: <><path d="M12 16V4M12 4l-4 4M12 4l4 4" /><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  fileText: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M8.5 13h7M8.5 17h5" /></>,
  check: <><path d="M5 12.5l4.5 4.5L19 7" /></>,
  checkCircle: <><circle cx="12" cy="12" r="8.5" /><path d="M8.5 12l2.5 2.5L16 9" /></>,
  camera: <><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L18 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z" transform="translate(0 0)" /><circle cx="12" cy="13" r="3.5" /></>,
  image: <><rect x="4" y="5" width="16" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M5 17l4.5-4.5 3 3L16 11l4 4" /></>,
  download: <><path d="M12 4v11M12 15l-4-4M12 15l4-4" /><path d="M5 19h14" /></>,
  arrowRight: <><path d="M5 12h14M14 6l6 6-6 6" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  x: <><path d="M6 6l12 12M18 6L6 18" /></>,
  alert: <><path d="M12 3l9 16H3l9-16z" /><path d="M12 10v4M12 17.5v.2" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.2" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></>,
  trendUp: <><path d="M3 17l6-6 4 4 8-8" /><path d="M21 7v5M21 7h-5" /></>,
  layers: <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5M3 16l9 5 9-5" /></>,
};

function Icon({ name, size = 22, className = "", strokeWidth = 1.6, style = {} }) {
  const p = ICON_PATHS[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">
      {p}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// Eyebrow — gold gradient, uppercase, wide tracking
// ─────────────────────────────────────────────────────────────
function Eyebrow({ children, className = "" }) {
  return (
    <div className={"font-sans font-semibold uppercase text-[10.5px] leading-none " + className}
      style={{
        letterSpacing: '0.22em',
        background: 'linear-gradient(95deg, #E7CE7A 0%, #D4AF37 45%, #9A7B22 100%)',
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
      }}>
      {children}
    </div>
  );
}

// Glass card — charcoal with hairline border + faint inner sheen
function Card({ children, className = "", glow = false, style = {} }) {
  return (
    <div className={"relative rounded-[22px] " + className}
      style={{
        background: 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: glow
          ? '0 18px 50px -22px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 12px 36px -24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.04)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        ...style,
      }}>
      {children}
    </div>
  );
}

// Pill chip with thin border. tone: 'gold' | 'emerald' | 'muted' | 'active'
function Chip({ children, tone = "muted", className = "", onClick, active = false }) {
  const tones = {
    muted: { c: 'rgba(235,235,240,0.72)', b: 'rgba(255,255,255,0.12)', bg: 'rgba(255,255,255,0.02)' },
    emerald: { c: '#34D399', b: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.07)' },
    gold: { c: '#E7CE7A', b: 'rgba(212,175,55,0.42)', bg: 'rgba(212,175,55,0.07)' },
    danger: { c: '#F0A88C', b: 'rgba(220,120,80,0.4)', bg: 'rgba(220,120,80,0.06)' },
  };
  const t = active ? tones.emerald : tones[tone];
  return (
    <button type="button" onClick={onClick}
      className={"inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold font-sans transition-all duration-200 " + (onClick ? "active:scale-95 " : "") + className}
      style={{ color: t.c, border: '1px solid ' + t.b, background: t.bg }}>
      {children}
    </button>
  );
}

// Primary emerald button with glow
function PrimaryButton({ children, onClick, className = "", icon }) {
  return (
    <button type="button" onClick={onClick}
      className={"relative w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 font-sans font-bold text-[15.5px] text-white transition-all duration-200 active:scale-[0.985] " + className}
      style={{
        background: 'linear-gradient(180deg, #15C98E 0%, #10B981 40%, #0E9B6E 100%)',
        boxShadow: '0 0 34px -6px rgba(16,185,129,0.55), 0 10px 30px -12px rgba(16,185,129,0.6), inset 0 1px 0 rgba(255,255,255,0.35)',
      }}>
      {icon && <Icon name={icon} size={19} strokeWidth={2.1} />}
      {children}
    </button>
  );
}

// Ghost button — gold or neutral hairline outline
function GhostButton({ children, onClick, className = "", icon, tone = "muted" }) {
  const border = tone === 'gold' ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.13)';
  const color = tone === 'gold' ? '#E7CE7A' : 'rgba(235,235,240,0.9)';
  const iconColor = tone === 'gold' ? '#D4AF37' : 'rgba(235,235,240,0.7)';
  return (
    <button type="button" onClick={onClick}
      className={"inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-sans font-semibold text-[14.5px] transition-all duration-200 active:scale-[0.97] " + className}
      style={{ color, border: '1px solid ' + border, background: 'rgba(255,255,255,0.018)' }}>
      {icon && <span style={{ color: iconColor }}><Icon name={icon} size={18} /></span>}
      {children}
    </button>
  );
}

// Section eyebrow label used between blocks (gray, tracked)
function SectionLabel({ children, className = "" }) {
  return (
    <div className={"font-sans font-semibold uppercase text-[11px] text-white/30 " + className}
      style={{ letterSpacing: '0.18em' }}>
      {children}
    </div>
  );
}

// App header: hamburger + eyebrow/serif-title + bell. Clears the status bar.
function ScreenHeader({ eyebrow, title, onMenu, onBell }) {
  return (
    <div className="relative px-4" style={{ paddingTop: 58 }}>
      <div className="absolute inset-x-0 top-0 h-[150px] pointer-events-none"
        style={{ background: 'radial-gradient(120% 80% at 50% -20%, rgba(16,185,129,0.10), transparent 60%)' }} />
      <div className="relative flex items-start justify-between gap-3 pb-3">
        <button onClick={onMenu} type="button"
          className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white/85 transition active:scale-95"
          style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.025)' }}>
          <Icon name="menu" size={22} />
        </button>
        <div className="flex-1 pt-0.5 text-center">
          <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>
          <h1 className="font-display text-white leading-[1.05]"
            style={{ fontSize: 27, fontWeight: 600, letterSpacing: '0.01em' }}>{title}</h1>
        </div>
        <button onClick={onBell} type="button"
          className="relative mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white/85 transition active:scale-95"
          style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.025)' }}>
          <Icon name="bell" size={20} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
            style={{ background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
        </button>
      </div>
    </div>
  );
}

Object.assign(window, {
  Icon, Eyebrow, Card, Chip, PrimaryButton, GhostButton, SectionLabel, ScreenHeader,
});
