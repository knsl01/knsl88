import React from "react";

export const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Hanken+Grotesk:wght@300;400;500;600;700&display=swap');
:root{--void:#080a09;--charcoal:#101413;--line:rgba(212,189,138,0.12);--emerald:#13855c;--emerald-bright:#1fb37e;--emerald-deep:#0c4a33;--champagne:#d8c08a;--champagne-soft:#e7d6ac;--silver:#c4cfca;--text:#eef2ef;--muted:#7e8c86;--muted-2:#5c6863;--glass:rgba(22,27,25,0.55);--knsl-safe-top:env(safe-area-inset-top,0px);}
*{box-sizing:border-box;}
.knsl{font-family:'Hanken Grotesk',sans-serif;background:radial-gradient(900px 600px at 85% -10%,rgba(19,133,92,0.10),transparent 60%),radial-gradient(700px 500px at 5% 110%,rgba(216,192,138,0.05),transparent 55%),var(--void);color:var(--text);min-height:100vh;width:100%;-webkit-font-smoothing:antialiased;}
.serif{font-family:'Cormorant Garamond',serif;}
.glass{background:var(--glass);backdrop-filter:blur(18px) saturate(120%);-webkit-backdrop-filter:blur(18px) saturate(120%);border:1px solid var(--line);border-radius:18px;}
.glass-hover{transition:transform .5s cubic-bezier(.16,1,.3,1),border-color .5s,box-shadow .5s;}
.glass-hover:hover{transform:translateY(-4px);border-color:rgba(216,192,138,0.32);box-shadow:0 24px 60px -28px rgba(0,0,0,0.8);}
.gold-text{color:var(--champagne);}.emerald-text{color:var(--emerald-bright);}
.hairline{height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent);}
.nav-item{display:flex;align-items:center;gap:13px;padding:11px 14px;border-radius:12px;color:var(--muted);font-size:14px;font-weight:500;cursor:pointer;position:relative;transition:color .4s,background .4s;}
.nav-item:hover{color:var(--silver);background:rgba(255,255,255,0.02);}
.nav-item.active{color:var(--text);background:linear-gradient(90deg,rgba(19,133,92,0.16),rgba(19,133,92,0.02));}
.nav-item.active::before{content:'';position:absolute;left:0;top:50%;transform:translateY(-50%);width:3px;height:22px;border-radius:4px;background:linear-gradient(180deg,var(--champagne),var(--emerald-bright));box-shadow:0 0 12px rgba(31,179,126,0.6);}
.badge{display:inline-flex;align-items:center;gap:6px;padding:4px 11px;border-radius:999px;font-size:11.5px;font-weight:600;letter-spacing:.4px;text-transform:uppercase;border:1px solid transparent;}
.badge-high{color:#ff9a8b;background:rgba(220,68,55,0.10);border-color:rgba(220,68,55,0.28);}
.badge-med{color:var(--champagne-soft);background:rgba(216,192,138,0.08);border-color:rgba(216,192,138,0.28);}
.badge-low{color:var(--emerald-bright);background:rgba(31,179,126,0.08);border-color:rgba(31,179,126,0.30);}
.btn-primary{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 20px;border-radius:12px;font-weight:600;font-size:14px;cursor:pointer;border:1px solid rgba(31,179,126,0.4);color:#eafff4;background:linear-gradient(135deg,var(--emerald),var(--emerald-deep));box-shadow:0 8px 24px -10px rgba(19,133,92,0.8);transition:transform .4s,filter .4s;font-family:inherit;}
.btn-primary:hover{transform:translateY(-2px);filter:brightness(1.12);}
.btn-ghost{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:12px;font-weight:500;font-size:13px;cursor:pointer;color:var(--silver);background:transparent;border:1px solid var(--line);transition:all .4s;font-family:inherit;}
.btn-ghost:hover{border-color:rgba(216,192,138,0.4);color:var(--champagne);background:rgba(216,192,138,0.04);}
.chip{padding:6px 13px;border-radius:999px;font-size:12.5px;cursor:pointer;color:var(--silver);background:rgba(255,255,255,0.03);border:1px solid var(--line);transition:all .3s;font-family:inherit;}
.chip:hover{border-color:rgba(31,179,126,0.45);color:var(--emerald-bright);}
.tab{padding:10px 4px;font-size:14px;font-weight:500;color:var(--muted);cursor:pointer;position:relative;transition:color .4s;white-space:nowrap;}
.tab:hover{color:var(--silver);}.tab.active{color:var(--text);}
.tab.active::after{content:'';position:absolute;left:0;right:0;bottom:-9px;height:2px;border-radius:2px;background:linear-gradient(90deg,var(--champagne),var(--emerald-bright));}
.field{width:100%;background:rgba(8,10,9,0.6);border:1px solid var(--line);border-radius:12px;color:var(--text);font-size:14px;padding:13px 15px;font-family:inherit;outline:none;transition:border-color .4s,box-shadow .4s;resize:none;}
.field:focus{border-color:rgba(31,179,126,0.5);box-shadow:0 0 0 4px rgba(19,133,92,0.10);}
.field::placeholder{color:var(--muted-2);}
@keyframes fadeIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.view-enter{animation:fadeIn .5s ease both;}
.rise{animation:fadeIn .6s cubic-bezier(.16,1,.3,1) both;}
.scrollbar::-webkit-scrollbar{width:7px;height:7px;}.scrollbar::-webkit-scrollbar-thumb{background:rgba(216,192,138,0.16);border-radius:8px;}
.logo-mark{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:linear-gradient(150deg,var(--emerald),var(--emerald-deep));border:1px solid rgba(216,192,138,0.3);box-shadow:0 8px 22px -10px rgba(19,133,92,0.9);}
.recommend-card{transition:transform .45s cubic-bezier(.16,1,.3,1),border-color .45s,background .45s;cursor:pointer;}
.recommend-card:hover{transform:translateX(4px);border-color:rgba(216,192,138,0.3);background:rgba(216,192,138,0.03);}
.clause-flag{border-left:2px solid;padding-left:12px;transition:background .4s;}
.gauge-num{font-variant-numeric:tabular-nums;}
.pasal-text{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}

/* layout */
.shell{display:flex;}
.sidebar{width:270px;flex-shrink:0;padding:26px 18px;border-right:1px solid var(--line);display:flex;flex-direction:column;height:100vh;position:sticky;top:0;background:rgba(16,20,19,0.7);overflow:hidden;min-height:0;}
.sidebar-brand{flex-shrink:0;}
.sidebar-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;display:flex;flex-direction:column;gap:0;}
.sidebar-foot{flex-shrink:0;margin-top:12px;padding-bottom:4px;}
.profile-toast{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:12px;font-size:13px;font-weight:500;margin-bottom:16px;animation:fadeIn .35s ease both;}
.profile-toast-success{color:var(--emerald-bright);background:rgba(31,179,126,0.1);border:1px solid rgba(31,179,126,0.3);}
.profile-toast-error{color:#ff9a8b;background:rgba(220,68,55,0.1);border:1px solid rgba(220,68,55,0.28);}
.main{flex:1;min-width:0;height:100vh;display:flex;flex-direction:column;overflow:hidden;}
.page{padding:0 34px 40px;overflow-y:auto;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:24px 34px 20px;gap:16px;}
.topbar .rise{flex:1;min-width:0;}
.topbar-title{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
.hamburger{display:none;width:44px;height:44px;border-radius:12px;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;}
.topbar-search{display:flex;align-items:center;gap:10px;padding:10px 15px;border-radius:12px;width:280px;}
.backdrop{display:none;}
.metric-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
.two-col{display:grid;grid-template-columns:1.6fr 1fr;gap:18px;margin-top:18px;}
.analysis-grid{display:grid;grid-template-columns:1fr 1.25fr;gap:18px;align-items:start;}
.drafting-grid{display:grid;grid-template-columns:1fr 340px;gap:18px;align-items:start;}
.tablewrap{overflow-x:auto;}
.docket-row{display:grid;grid-template-columns:90px 1fr 150px 120px 120px 110px;gap:12px;align-items:center;min-width:760px;}

@media(max-width:860px){
  .sidebar{position:fixed;left:0;top:0;z-index:60;transform:translateX(-100%);transition:transform .45s cubic-bezier(.16,1,.3,1);box-shadow:30px 0 80px -30px rgba(0,0,0,0.9);}
  .sidebar.open{transform:translateX(0);}
  .hamburger{display:flex;}
  .backdrop{display:block;position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(2px);z-index:50;animation:fadeIn .3s ease;}
  .topbar-search{display:none;}
  .page{padding:0 16px 36px;}
  .two-col,.analysis-grid,.drafting-grid{grid-template-columns:1fr;}
  .cr-grid{grid-template-columns:1fr !important;}
  .cr-sum{grid-template-columns:1fr !important;}
  .metric-grid{grid-template-columns:repeat(2,1fr);}
}
@media(max-width:520px){ .metric-grid{grid-template-columns:1fr;} }

/* ===== KNSL premium mobile restyle ===== */
.mobile-tabbar{display:none;}
@media(max-width:860px){
  /* === Typography: switch to premium mobile fonts === */
  .knsl{font-family:'Manrope','Hanken Grotesk',system-ui,sans-serif;
    background:radial-gradient(130% 60% at 0% 0%,rgba(16,185,129,0.07),transparent 45%),
    radial-gradient(120% 60% at 100% 100%,rgba(212,175,55,0.05),transparent 50%),#0A0A0A;}
  .serif{font-family:'Playfair Display','Cormorant Garamond',Georgia,serif;}

  /* === Cards: rounder, glassmorphic, premium feel === */
  .glass{border-radius:22px;
    background:linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012));
    border:1px solid rgba(255,255,255,0.07);
    backdrop-filter:blur(14px) saturate(120%);-webkit-backdrop-filter:blur(14px) saturate(120%);
    box-shadow:0 12px 36px -24px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.04);}
  .glass-hover:hover{transform:translateY(-2px);border-color:rgba(212,175,55,0.3);
    box-shadow:0 18px 50px -22px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.05);}

  /* === Buttons: larger, rounded, glow === */
  .btn-primary{border-radius:16px;padding:14px 22px;font-size:15.5px;font-weight:700;
    background:linear-gradient(180deg,#15C98E 0%,#10B981 40%,#0E9B6E 100%) !important;
    border:1px solid rgba(16,185,129,0.4) !important;
    box-shadow:0 0 34px -6px rgba(16,185,129,0.45),0 10px 30px -12px rgba(16,185,129,0.5),inset 0 1px 0 rgba(255,255,255,0.3);}
  .btn-primary:active{transform:scale(0.985);}
  .btn-ghost{border-radius:16px;padding:12px 18px;font-size:14.5px;}
  .btn-ghost:active{transform:scale(0.97);}

  /* === Chips & badges: pill shape === */
  .chip{border-radius:999px;padding:8px 16px;font-size:13px;}
  .chip:active{transform:scale(0.95);}
  .badge{border-radius:999px;padding:5px 13px;font-size:11.5px;}

  /* === Navigation items: rounder, larger === */
  .nav-item{border-radius:16px;padding:13px 14px;font-size:15.5px;}

  /* === Form fields: rounder, larger === */
  .field{border-radius:16px;padding:14px 16px;font-size:15px;
    background:rgba(255,255,255,0.025) !important;border:1px solid rgba(255,255,255,0.1);}
  .field:focus{border-color:rgba(16,185,129,0.5);box-shadow:0 0 0 4px rgba(16,185,129,0.08);}

  /* === Tabs: larger text, gradient underline === */
  .tab{font-size:15.5px;padding:11px 4px;font-weight:500;}
  .tab.active{font-weight:700;}
  .tab.active::after{height:2.5px;background:linear-gradient(90deg,#10B981,#D4AF37);}

  /* === Metrics: premium card feel === */
  .gauge-num{font-family:'Playfair Display',serif;}

  /* === Section labels: gold gradient === */
  .gold-text{background:linear-gradient(95deg,#E7CE7A 0%,#D4AF37 45%,#9A7B22 100%);
    -webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}

  /* === Page: room for bottom bar + breathing space === */
  .page{padding:0 16px 104px !important;}

  /* === Hairline: subtler === */
  .hairline{background:linear-gradient(90deg,transparent,rgba(212,175,55,0.18),transparent);}

  /* === Sidebar: premium dark === */
  .sidebar{background:linear-gradient(160deg,#101512 0%,#0A0A0A 55%) !important;
    border-right:1px solid rgba(255,255,255,0.07) !important;width:83vw;}

  /* === Bottom tab bar === */
  .mobile-tabbar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:45;align-items:stretch;
    background:rgba(8,10,9,0.93);backdrop-filter:blur(20px) saturate(120%);-webkit-backdrop-filter:blur(20px) saturate(120%);
    border-top:1px solid rgba(255,255,255,0.07);padding-bottom:env(safe-area-inset-bottom,0px);
    box-shadow:0 -10px 30px -18px rgba(0,0,0,0.9);}
  .mtab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;
    padding:9px 2px 8px;background:none;border:none;cursor:pointer;color:var(--muted-2);
    font-family:'Manrope',system-ui,sans-serif;font-size:10px;font-weight:600;letter-spacing:.2px;
    transition:color .25s;-webkit-tap-highlight-color:transparent;}
  .mtab:active{transform:scale(.92);}
  .mtab.active{color:var(--emerald-bright);}
  .mtab.active svg{filter:drop-shadow(0 0 6px rgba(31,179,126,0.7));}
  .mtab span{line-height:1;}

  /* === scroll & touch behavior === */
  *{-webkit-tap-highlight-color:transparent;}
  .scrollbar::-webkit-scrollbar{width:0;height:0;}

  /* === LAYOUT STABILITY FIXES === */

  /* Viewport: prevent body scroll, let app containers handle it */
  html{height:100%;}
  body{height:100%;overflow:hidden;overscroll-behavior:none;}

  /* App wrapper: fill screen, no overflow */
  .knsl{height:100vh;height:100dvh;min-height:100vh;min-height:100dvh;overflow:hidden;position:relative;width:100%;}
  .shell{overflow:hidden;width:100%;height:100%;}
  .main{height:100%;min-height:0 !important;overflow:hidden;display:flex;flex-direction:column;}

  /* Page: the scroll container — properly bounded */
  .page{flex:1;min-height:0;overflow-y:auto !important;overflow-x:hidden !important;
    -webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;
    padding-bottom:104px !important;max-width:100vw;}

  /* Topbar + sidebar: safe-area selaras (status bar / Dynamic Island) */
  .topbar{
    padding-top:calc(var(--knsl-safe-top, env(safe-area-inset-top, 0px)) + 12px) !important;
    padding-right:16px !important;
    padding-bottom:12px !important;
    padding-left:16px !important;
    gap:10px !important;
    flex-shrink:0;
    align-items:center;
    position:relative;
    z-index:10;
  }
  .topbar h1,.topbar-title{font-size:22px !important;line-height:1.15 !important;white-space:nowrap !important;overflow:hidden !important;text-overflow:ellipsis !important;max-width:100%;}
  .topbar .rise{flex:1;min-width:0;}
  .topbar .rise>div:first-child{font-size:10px !important;margin-bottom:4px !important;}
  .hamburger{align-self:flex-start;margin-top:2px;}

  .sidebar{
    padding-top:calc(var(--knsl-safe-top, env(safe-area-inset-top, 0px)) + 16px) !important;
    padding-left:18px !important;
    padding-right:18px !important;
    padding-bottom:calc(env(safe-area-inset-bottom, 0px) + 12px) !important;
    height:100vh !important;
    height:100dvh !important;
    overflow:hidden !important;
  }
  .sidebar-scroll{padding-bottom:8px;}

  /* Prevent horizontal overflow */
  .view-enter,.analysis-grid,.drafting-grid,.two-col,.cr-grid{
    max-width:100%;overflow-x:hidden;}
  .metric-grid{max-width:100%;overflow:hidden;}

  /* Login screen: scroll if needed, centered */
  .login-screen{min-height:100dvh;overflow-y:auto;overflow-x:hidden;
    padding-top:calc(var(--knsl-safe-top, env(safe-area-inset-top, 0px)) + 20px) !important;}

  /* Glass cards: prevent overflow */
  .glass{max-width:100%;overflow:hidden;overflow-wrap:break-word;word-break:normal;hyphens:none;}
  .ai-provider-wrap{overflow:visible !important;position:relative;z-index:5;}

  /* Tables: scroll horizontally if needed */
  .tablewrap{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}
  .docket-row{min-width:0 !important;}
  img{max-width:100%;height:auto;}
}

/* ===== login screen ===== */
.login-screen{display:flex;flex-direction:column;align-items:center;justify-content:center;
  min-height:100vh;min-height:100dvh;padding:40px 28px;text-align:center;position:relative;overflow:hidden;}
.login-ambient{position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(600px 400px at 50% 15%,rgba(19,133,92,0.14),transparent 60%),
  radial-gradient(400px 300px at 60% 85%,rgba(216,192,138,0.07),transparent 55%);}
.login-card{position:relative;z-index:1;max-width:420px;width:100%;}
.login-features{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:30px;text-align:left;}
.login-feat{display:flex;align-items:center;gap:10px;padding:12px 14px;border-radius:14px;
  background:rgba(255,255,255,0.02);border:1px solid var(--line);transition:border-color .3s;}
.login-feat:hover{border-color:rgba(31,179,126,0.3);}
@media(max-width:520px){.login-features{grid-template-columns:1fr;}.login-screen{padding:32px 20px;}}
.login-footer{margin-top:32px;font-size:11.5px;color:var(--muted-2);display:flex;align-items:center;justify-content:center;gap:6px;}
.user-photo{width:36px;height:36px;border-radius:10px;object-fit:cover;border:1px solid var(--line);}

@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}

/* ===== dashboard welcome ===== */
.dash-welcome{position:relative;padding:22px 24px;margin-bottom:18px;overflow:hidden;border-color:rgba(31,179,126,0.22)!important;}
.dash-welcome-glow{position:absolute;top:-40%;right:-10%;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(31,179,126,0.18) 0%,transparent 70%);pointer-events:none;}
.dash-welcome-body{position:relative;z-index:1;display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:16px;}
.dash-welcome-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--champagne);margin:0 0 8px;}
.dash-welcome-title{font-size:clamp(1.35rem,3.5vw,1.75rem);font-weight:600;margin:0;line-height:1.2;}
.dash-welcome-sub{font-size:13.5px;color:var(--muted);margin:10px 0 0;max-width:520px;line-height:1.55;}
.dash-welcome-actions{display:flex;flex-wrap:wrap;gap:10px;}

/* ===== legal chat ===== */
.legal-chat-page{display:flex;flex-direction:column;flex:1;min-height:0;height:100%;padding:0 0 8px;}
.legal-chat-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:16px 18px;margin:0 0 12px;flex-shrink:0;}
.legal-chat-error{display:flex;align-items:center;gap:8px;padding:10px 14px;margin:0 12px 10px;border-radius:12px;font-size:12.5px;color:#ff9a8b;background:rgba(220,68,55,0.1);border:1px solid rgba(220,68,55,0.28);flex-shrink:0;}
.legal-chat-messages{flex:1;min-height:0;overflow-y:auto;padding:4px 12px 12px;display:flex;flex-direction:column;gap:14px;}
.legal-chat-row{display:flex;align-items:flex-start;gap:10px;max-width:100%;}
.legal-chat-row-user{flex-direction:row-reverse;}
.legal-chat-avatar{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;flex-shrink:0;background:rgba(19,133,92,0.12);border:1px solid rgba(31,179,126,0.25);color:var(--emerald-bright);}
.legal-chat-avatar-user{background:rgba(216,192,138,0.1);border-color:rgba(216,192,138,0.25);color:var(--champagne);}
.legal-chat-bubble{max-width:min(88%,720px);padding:14px 16px;border-radius:14px;line-height:1.6;font-size:13.5px;}
.legal-chat-bubble-user{background:rgba(19,133,92,0.1)!important;border-color:rgba(31,179,126,0.28)!important;}
.legal-chat-text{color:var(--silver);word-break:break-word;}
.legal-chat-text strong{color:var(--text);font-weight:600;}
.legal-chat-text em{color:var(--muted);}
.legal-chat-typing{display:inline-flex;align-items:center;gap:8px;color:var(--muted);font-size:13px;}
.legal-chat-spin{animation:spin .8s linear infinite;}
.legal-chat-suggestions{padding:0 12px 10px;flex-shrink:0;}
.legal-chat-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;}
.legal-chat-chip{padding:8px 12px;border-radius:999px;font-size:12px;color:var(--silver);background:rgba(255,255,255,0.03);border:1px solid var(--line);cursor:pointer;font-family:inherit;transition:border-color .25s,background .25s;text-align:left;line-height:1.35;}
.legal-chat-chip:hover{border-color:rgba(31,179,126,0.4);background:rgba(31,179,126,0.06);color:var(--text);}
.legal-chat-composer{display:flex;align-items:flex-end;gap:10px;padding:12px 14px;margin:0 12px;flex-shrink:0;}
.legal-chat-input{flex:1;resize:none;min-height:44px;max-height:120px;margin:0!important;}
.legal-chat-send{width:48px;height:48px;padding:0;display:grid;place-items:center;flex-shrink:0;border-radius:12px!important;margin:0!important;}
@media(max-width:768px){
  .dash-welcome-body{flex-direction:column;align-items:flex-start;}
  .legal-chat-bubble{max-width:94%;}
  .legal-chat-header{flex-direction:column;}
}
`;

export function LogoMark({ size = 46 }) {
  const ticks = [];
  for (let i = 0; i < 12; i++) { const a = (i * 30 * Math.PI) / 180; ticks.push([50 + Math.cos(a) * 44, 50 + Math.sin(a) * 44, 50 + Math.cos(a) * 46, 50 + Math.sin(a) * 46]); }
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <defs>
        <linearGradient id="knslGold" gradientUnits="userSpaceOnUse" x1="50" y1="24" x2="50" y2="76">
          <stop offset="0%" stopColor="#f4e2aa" /><stop offset="48%" stopColor="#dcc48a" /><stop offset="100%" stopColor="#ad874e" />
        </linearGradient>
        <radialGradient id="knslGlow" cx="50%" cy="54%" r="55%">
          <stop offset="0%" stopColor="#1fb37e" stopOpacity="0.32" /><stop offset="100%" stopColor="#1fb37e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="52" r="34" fill="url(#knslGlow)" />
      <circle cx="50" cy="50" r="46" stroke="#d8c08a" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="41" stroke="#6f6347" strokeWidth="0.8" />
      {ticks.map((t, i) => <line key={i} x1={t[0]} y1={t[1]} x2={t[2]} y2={t[3]} stroke="#8a7c54" strokeWidth="0.7" />)}
      <g stroke="url(#knslGold)" strokeWidth="2" strokeLinecap="round" fill="none">
        <line x1="50" y1="70.8" x2="50" y2="36.4" /><line x1="39.6" y1="70.8" x2="60.4" y2="70.8" /><line x1="29.2" y1="42" x2="70.8" y2="42" />
      </g>
      <line x1="44.8" y1="73.6" x2="55.2" y2="73.6" stroke="url(#knslGold)" strokeWidth="1.4" strokeLinecap="round" />
      <g stroke="#1fb37e" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <line x1="29.2" y1="42" x2="22.4" y2="56.4" /><line x1="29.2" y1="42" x2="36" y2="56.4" />
        <line x1="70.8" y1="42" x2="64" y2="56.4" /><line x1="70.8" y1="42" x2="77.6" y2="56.4" />
        <path d="M22.4 56.4 A 7 6 0 0 1 36 56.4" strokeWidth="1.9" /><path d="M64 56.4 A 7 6 0 0 1 77.6 56.4" strokeWidth="1.9" />
      </g>
      <circle cx="50" cy="36.4" r="2" fill="url(#knslGold)" />
      <path d="M50 25.2 L54 30 L50 34.8 L46 30 Z" fill="#efdca6" />
      <circle cx="50" cy="30" r="1.8" fill="#4dd1a4" />
    </svg>
  );
}
