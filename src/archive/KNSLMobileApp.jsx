/**
 * KNSLMobileApp.jsx
 * Self-contained mobile app — renders fullscreen on a real phone (no bezel).
 * Safe-area aware. Proper ES module (Vite / React 18 compatible).
 *
 * HOW TO USE:
 *   Import this in AppRouter.jsx → rendered when on mobile/PWA.
 *   No extra deps needed (Tailwind CDN already in index.html).
 */

import React from 'react';

/* ═══════════════════════════════════════════════════════════
   DESIGN TOKENS
═══════════════════════════════════════════════════════════ */
const T = {
  emerald: '#10B981', emeraldSoft: '#34D399',
  gold: '#D4AF37', goldSoft: '#E7CE7A',
  ink: '#0A0A0A', panel: '#121212',
};

/* ═══════════════════════════════════════════════════════════
   ICON PRIMITIVES
═══════════════════════════════════════════════════════════ */
const PATHS = {
  menu:        <><path d="M4 7h16M4 12h12M4 17h16"/></>,
  bell:        <><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10 20a2 2 0 0 0 4 0"/></>,
  grid:        <><rect x="4" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4"/></>,
  scale:       <><path d="M12 4v16M7 20h10"/><path d="M5 7h14M9 5l-1 2M15 5l1 2"/><path d="M5 7l-2.5 5a2.5 2.5 0 0 0 5 0L5 7zM19 7l-2.5 5a2.5 2.5 0 0 0 5 0L19 7z"/></>,
  penEdit:     <><path d="M5 19h4l9.5-9.5a2.1 2.1 0 0 0-3-3L6 16v3z"/><path d="M14 6.5l3 3"/></>,
  book:        <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 5.5V20.5"/><path d="M19 18v3H6.5A2.5 2.5 0 0 1 4 18.5"/></>,
  scan:        <><path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2"/><path d="M4 12h16"/></>,
  fileSearch:  <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6"/><path d="M14 3v5h5"/><circle cx="16.5" cy="16.5" r="2.8"/><path d="M19 19l2 2"/></>,
  shield:      <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></>,
  sparkles:    <><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M18.5 14.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z"/></>,
  gear:        <><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/></>,
  chevronRight:<><path d="M9 5l7 7-7 7"/></>,
  chevronUpDown:<><path d="M8 9l4-4 4 4M8 15l4 4 4-4"/></>,
  search:      <><circle cx="11" cy="11" r="7"/><path d="M16.5 16.5L21 21"/></>,
  bolt:        <><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13l0-8z"/></>,
  upload:      <><path d="M12 16V4M12 4l-4 4M12 4l4 4"/><path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></>,
  clock:       <><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></>,
  fileText:    <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 13h7M8.5 17h5"/></>,
  check:       <><path d="M5 12.5l4.5 4.5L19 7"/></>,
  checkCircle: <><circle cx="12" cy="12" r="8.5"/><path d="M8.5 12l2.5 2.5L16 9"/></>,
  camera:      <><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L18 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8z"/><circle cx="12" cy="13" r="3.5"/></>,
  image:       <><rect x="4" y="5" width="16" height="14" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M5 17l4.5-4.5 3 3L16 11l4 4"/></>,
  download:    <><path d="M12 4v11M12 15l-4-4M12 15l4-4"/><path d="M5 19h14"/></>,
  arrowRight:  <><path d="M5 12h14M14 6l6 6-6 6"/></>,
  plus:        <><path d="M12 5v14M5 12h14"/></>,
  x:           <><path d="M6 6l12 12M18 6L6 18"/></>,
  alert:       <><path d="M12 3l9 16H3l9-16z"/><path d="M12 10v4M12 17.5v.2"/></>,
  info:        <><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8v.2"/></>,
  user:        <><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-6 8-6s8 2 8 6"/></>,
  briefcase:   <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/></>,
  trendUp:     <><path d="M3 17l6-6 4 4 8-8"/><path d="M21 7v5M21 7h-5"/></>,
  layers:      <><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 16l9 5 9-5"/></>,
};

function Icon({ name, size = 22, className = '', strokeWidth = 1.6, style = {} }) {
  const p = PATHS[name];
  if (!p) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style} aria-hidden="true">{p}</svg>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED UI ATOMS
═══════════════════════════════════════════════════════════ */
function Eyebrow({ children, className = '' }) {
  return (
    <div className={'font-sans font-semibold uppercase text-[10.5px] leading-none ' + className}
      style={{ letterSpacing:'0.22em', background:'linear-gradient(95deg,#E7CE7A 0%,#D4AF37 45%,#9A7B22 100%)', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent' }}>
      {children}
    </div>
  );
}

function Card({ children, className = '', glow = false, style = {} }) {
  return (
    <div className={'relative rounded-[22px] ' + className}
      style={{ background:'linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.012))', border:'1px solid rgba(255,255,255,0.07)', boxShadow: glow ? '0 18px 50px -22px rgba(0,0,0,0.8),inset 0 1px 0 rgba(255,255,255,0.05)' : '0 12px 36px -24px rgba(0,0,0,0.7),inset 0 1px 0 rgba(255,255,255,0.04)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', ...style }}>
      {children}
    </div>
  );
}

function Chip({ children, tone = 'muted', className = '', onClick, active = false }) {
  const tones = {
    muted:   { c:'rgba(235,235,240,0.72)', b:'rgba(255,255,255,0.12)', bg:'rgba(255,255,255,0.02)' },
    emerald: { c:'#34D399', b:'rgba(16,185,129,0.4)', bg:'rgba(16,185,129,0.07)' },
    gold:    { c:'#E7CE7A', b:'rgba(212,175,55,0.42)', bg:'rgba(212,175,55,0.07)' },
    danger:  { c:'#F0A88C', b:'rgba(220,120,80,0.4)', bg:'rgba(220,120,80,0.06)' },
  };
  const t = active ? tones.emerald : tones[tone];
  return (
    <button type="button" onClick={onClick}
      className={'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold font-sans transition-all duration-200 ' + (onClick ? 'active:scale-95 ' : '') + className}
      style={{ color:t.c, border:'1px solid '+t.b, background:t.bg }}>{children}</button>
  );
}

function PrimaryButton({ children, onClick, className = '', icon }) {
  return (
    <button type="button" onClick={onClick}
      className={'relative w-full flex items-center justify-center gap-2.5 rounded-2xl py-3.5 font-sans font-bold text-[15.5px] text-white transition-all duration-200 active:scale-[0.985] ' + className}
      style={{ background:'linear-gradient(180deg,#15C98E 0%,#10B981 40%,#0E9B6E 100%)', boxShadow:'0 0 34px -6px rgba(16,185,129,0.55),0 10px 30px -12px rgba(16,185,129,0.6),inset 0 1px 0 rgba(255,255,255,0.35)' }}>
      {icon && <Icon name={icon} size={19} strokeWidth={2.1} />}{children}
    </button>
  );
}

function GhostButton({ children, onClick, className = '', icon, tone = 'muted' }) {
  const border = tone === 'gold' ? 'rgba(212,175,55,0.35)' : 'rgba(255,255,255,0.13)';
  const color  = tone === 'gold' ? '#E7CE7A' : 'rgba(235,235,240,0.9)';
  const ic     = tone === 'gold' ? '#D4AF37' : 'rgba(235,235,240,0.7)';
  return (
    <button type="button" onClick={onClick}
      className={'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-sans font-semibold text-[14.5px] transition-all duration-200 active:scale-[0.97] ' + className}
      style={{ color, border:'1px solid '+border, background:'rgba(255,255,255,0.018)' }}>
      {icon && <span style={{ color:ic }}><Icon name={icon} size={18} /></span>}{children}
    </button>
  );
}

function SectionLabel({ children, className = '' }) {
  return (
    <div className={'font-sans font-semibold uppercase text-[11px] text-white/30 ' + className}
      style={{ letterSpacing:'0.18em' }}>{children}</div>
  );
}

// Full-screen header (no bezel — uses safe-area-inset-top via CSS var)
function ScreenHeader({ eyebrow, title, onMenu, onBell }) {
  return (
    <div className="relative px-4" style={{ paddingTop:'calc(env(safe-area-inset-top, 20px) + 16px)' }}>
      <div className="absolute inset-x-0 top-0 h-[120px] pointer-events-none"
        style={{ background:'radial-gradient(120% 80% at 50% -20%,rgba(16,185,129,0.10),transparent 60%)' }} />
      <div className="relative flex items-start justify-between gap-3 pb-3">
        <button onClick={onMenu} type="button"
          className="mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white/85 transition active:scale-95"
          style={{ border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.025)' }}>
          <Icon name="menu" size={22} />
        </button>
        <div className="flex-1 pt-0.5 text-center">
          <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow>
          <h1 className="font-display text-white leading-[1.05]"
            style={{ fontSize:27, fontWeight:600, letterSpacing:'0.01em' }}>{title}</h1>
        </div>
        <button onClick={onBell} type="button"
          className="relative mt-1 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-white/85 transition active:scale-95"
          style={{ border:'1px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.025)' }}>
          <Icon name="bell" size={20} />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full"
            style={{ background:'#10B981', boxShadow:'0 0 8px #10B981' }} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════════ */
const MODULES = [
  { id:'overview',  icon:'grid',       name:'Executive Overview',  eyebrow:'RINGKASAN PRAKTIK' },
  { id:'analysis',  icon:'scale',      name:'Legal Analysis Engine', eyebrow:'ANALISA KASUS' },
  { id:'drafting',  icon:'penEdit',    name:'Smart Drafting',       eyebrow:'DRAFTING STUDIO' },
  { id:'research',  icon:'book',       name:'Legal Research',       eyebrow:'RISET PASAL' },
  { id:'scan',      icon:'scan',       name:'Pindai Dokumen',       eyebrow:'OCR DOKUMEN' },
  { id:'contract',  icon:'fileSearch', name:'Contract Review AI',   eyebrow:'TINJAUAN KONTRAK' },
  { id:'conflict',  icon:'shield',     name:'Conflict Check',       eyebrow:'BENTURAN KEPENTINGAN' },
];

const ACTIVITY = [
  { icon:'scale',      t:'Analisa kasus pembunuhan selesai — 6 pasal terekstraksi', time:'12 mnt lalu', tone:'emerald' },
  { icon:'fileSearch', t:'Tinjauan kontrak vendor — 3 klausul risiko tinggi',        time:'1 jam lalu',  tone:'gold' },
  { icon:'penEdit',    t:'Gugatan Wanprestasi di-draft & diunduh (Word)',            time:'3 jam lalu',  tone:'emerald' },
  { icon:'book',       t:'Riset pasal "penggelapan" — 24 hasil disimpan',           time:'Kemarin',     tone:'muted' },
];

const PRIORITY_MATTERS = [
  { ref:'PERK-2026-014', name:'PT Anugrah Sejahtera vs. CV Mandala', type:'Wanprestasi', risk:'High',     stage:'Pembuktian', pct:72 },
  { ref:'PIDM-2026-009', name:'Pendampingan — Budi Santoso',          type:'Pidana',     risk:'High',     stage:'Penyidikan',  pct:35 },
  { ref:'KONT-2026-031', name:'Master Supply Agreement — Vendor A',   type:'Kontrak',    risk:'Moderate', stage:'Redlining',   pct:88 },
];

const ANALYSIS_FACTS = [
  { id:'fact_01', t:'Korban Budi Santoso berada di warung kopi di Lowokwaru, Malang pada 12 April 2026 pukul 22.30 WIB.', tag:'waktu & tempat' },
  { id:'fact_02', t:'Pelaku Andi Pratama memiliki riwayat sengketa utang piutang dengan korban.', tag:'latar' },
  { id:'fact_03', t:'Sekitar pukul 23.00 terjadi adu mulut antara korban dan pelaku, dilerai oleh saksi.', tag:'peristiwa' },
  { id:'fact_05', t:'Pelaku diduga menghadang korban di jalan sepi sekitar 30 menit kemudian.', tag:'peristiwa' },
  { id:'fact_06', t:'Terjadi perkelahian yang mengakibatkan korban mengalami luka berat.', tag:'akibat' },
  { id:'fact_07', t:'Korban dinyatakan meninggal dunia dalam perjalanan ke rumah sakit.', tag:'akibat' },
];

const ANALYSIS_ISSUES = [
  { cls:'CRIMINAL', stat:'asserted', risk:'High',          t:'Dugaan perbuatan yang mengakibatkan hilangnya nyawa orang lain', facts:'fact_03, fact_06, fact_07' },
  { cls:'CRIMINAL', stat:'asserted', risk:'Moderate-High', t:'Dugaan penganiayaan / kekerasan terhadap orang',                facts:'fact_05' },
  { cls:'CIVIL',    stat:'asserted', risk:'Moderate',      t:'Sengketa keperdataan (utang / wanprestasi)',                   facts:'fact_02' },
  { cls:'CRIMINAL', stat:'inferred', risk:'Low',           t:'Dugaan perbuatan tidak menyenangkan / pengancaman',            facts:'fact_03' },
];

const ANALYSIS_PASAL = [
  { code:'KUHP',      no:'338', title:'Pembunuhan',                        body:'Barang siapa dengan sengaja merampas nyawa orang lain, diancam karena pembunuhan dengan pidana penjara paling lama lima belas tahun.', match:96 },
  { code:'KUHP',      no:'351', title:'Penganiayaan',                      body:'Penganiayaan diancam dengan pidana penjara paling lama dua tahun delapan bulan atau pidana denda paling banyak…', match:88 },
  { code:'KUHP',      no:'170', title:'Kekerasan terhadap orang di muka umum', body:'Barang siapa di muka umum bersama-sama melakukan kekerasan terhadap orang atau barang…', match:71 },
  { code:'KUHPerdata',no:'1365',title:'Perbuatan Melawan Hukum',           body:'Tiap perbuatan melanggar hukum yang membawa kerugian kepada orang lain, mewajibkan orang… mengganti kerugian.', match:64 },
];

const ANALYSIS_UNSUR = [
  { pasal:'KUHP 338', items:[
    { u:'Barang siapa (subjek hukum)', ok:true },
    { u:'Dengan sengaja (kesengajaan)', ok:true },
    { u:'Merampas nyawa orang lain', ok:true },
    { u:'Direncanakan terlebih dahulu', ok:false, note:'belum cukup bukti → lihat Ps. 340' },
  ]},
  { pasal:'KUHP 351', items:[
    { u:'Barang siapa', ok:true },
    { u:'Perbuatan kekerasan / penganiayaan', ok:true },
    { u:'Mengakibatkan luka / akibat', ok:true },
  ]},
];

const RESEARCH_FILTERS = ['Semua','KUHP','UU PT','UUD 1945','Pailit/PKPU','ITE','Arbitrase'];
const RESEARCH_RESULTS = [
  { code:'KUHP',   no:'372', mirror:'KUHP 2023: PS. 486', title:'PENGGELAPAN',              body:'Barang siapa dengan sengaja dan melawan hukum memiliki barang sesuatu yang seluruhnya atau sebagian adalah kepunyaan orang lain…', match:100 },
  { code:'KUHP',   no:'373', mirror:'KUHP 2023: PS. 487', title:'PENGGELAPAN RINGAN',       body:'Perbuatan yang dirumuskan dalam Pasal 372, apabila yang digelapkan bukan ternak dan harganya tidak lebih dari…', match:100 },
  { code:'KUHP',   no:'374', mirror:'KUHP 2023: PS. 488', title:'PENGGELAPAN DALAM JABATAN',body:'Penggelapan yang dilakukan oleh orang yang penguasaannya terhadap barang disebabkan karena ada hubungan kerja…', match:94 },
  { code:'UU PT',  no:'97',  mirror:'UU 40/2007',         title:'TANGGUNG JAWAB DIREKSI',   body:'Direksi bertanggung jawab penuh atas pengurusan Perseroan untuk kepentingan Perseroan…', match:71 },
];

const DOC_GROUPS = [
  { group:'Litigasi', items:['Gugatan','Jawaban Gugatan','Somasi','Surat Kuasa'] },
  { group:'Kontrak',  items:['NDA (Kerahasiaan)','Perjanjian Kerja','PKS (Kerja Sama)','MoU'] },
  { group:'Korporat', items:['Akta Pendirian PT','RUPS / Risalah','Legal Opinion'] },
];

const CLAUSES = [
  { sev:'High',   tag:'Pembatasan Tanggung Jawab', t:'Klausul 9.2 membatasi ganti rugi hanya pada nilai 1 bulan kontrak.', sug:'Naikkan cap menjadi 12 bulan atau hapus pembatasan untuk pelanggaran berat.' },
  { sev:'High',   tag:'Hukum yang Berlaku',        t:'Klausul 14 menunjuk yurisdiksi Singapura — biaya beracara tinggi.', sug:'Ubah ke arbitrase (BANI) Indonesia.' },
  { sev:'Medium', tag:'Pengakhiran',               t:'Klausul 11 memungkinkan pengakhiran sepihak dengan notifikasi 7 hari.', sug:'Setarakan menjadi 30 hari & syarat material breach.' },
];

/* ═══════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════ */
function Sidebar({ open, active, onSelect, onClose }) {
  return (
    <div className="absolute inset-0 z-[80]" style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <div onClick={onClose} className="absolute inset-0 transition-opacity duration-300"
        style={{ background:'rgba(0,0,0,0.62)', backdropFilter:'blur(2px)', opacity: open ? 1 : 0 }} />
      <div className="absolute inset-y-0 left-0 flex flex-col"
        style={{ width:'83%', transform: open ? 'translateX(0)' : 'translateX(-104%)', transition:'transform 0.42s cubic-bezier(0.22,1,0.36,1)', background:'linear-gradient(160deg,#101512 0%,#0A0A0A 55%)', borderRight:'1px solid rgba(255,255,255,0.07)', boxShadow:'40px 0 80px -30px rgba(0,0,0,0.9)' }}>
        <div className="knsl-scroll flex-1 overflow-y-auto px-5" style={{ paddingTop:'calc(env(safe-area-inset-top,20px) + 20px)' }}>
          {/* brand */}
          <div className="flex items-center gap-3.5 pb-5">
            <div className="relative flex items-center justify-center rounded-full"
              style={{ width:52,height:52, border:'1.5px solid rgba(212,175,55,0.55)', background:'radial-gradient(circle at 50% 35%,rgba(16,185,129,0.16),rgba(10,10,10,0.6))', boxShadow:'0 0 22px -6px rgba(212,175,55,0.4),inset 0 0 18px -8px rgba(16,185,129,0.5)' }}>
              <Icon name="scale" size={26} style={{ color:'#34D399' }} />
            </div>
            <div>
              <div className="font-display text-white" style={{ fontSize:25, fontWeight:700, lineHeight:1 }}>KNSL</div>
              <Eyebrow className="mt-1.5">Legal Intelligence</Eyebrow>
            </div>
          </div>
          <div className="h-px w-full" style={{ background:'linear-gradient(90deg,rgba(212,175,55,0.35),transparent)' }} />
          <SectionLabel className="mb-2 mt-6">Modul Utama</SectionLabel>
          <div className="flex flex-col gap-1">
            {MODULES.map((m) => {
              const isActive = m.id === active;
              return (
                <button key={m.id} type="button" onClick={() => onSelect(m.id)}
                  className="relative flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left transition-all duration-200 active:scale-[0.98]"
                  style={isActive ? { background:'linear-gradient(100deg,rgba(16,185,129,0.16),rgba(16,185,129,0.02))', border:'1px solid rgba(16,185,129,0.28)' } : { border:'1px solid transparent' }}>
                  {isActive && <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full" style={{ background:'#10B981', boxShadow:'0 0 10px #10B981' }} />}
                  <span style={{ color: isActive ? '#34D399' : 'rgba(235,235,240,0.55)' }}><Icon name={m.icon} size={22} /></span>
                  <span className="flex-1 font-sans font-semibold text-[16px]" style={{ color: isActive ? '#fff' : 'rgba(235,235,240,0.78)' }}>{m.name}</span>
                  {isActive && <span style={{ color:'#D4AF37' }}><Icon name="chevronRight" size={17} /></span>}
                </button>
              );
            })}
          </div>
          {/* AI Counsel card */}
          <div className="mt-6 rounded-[20px] p-4" style={{ background:'linear-gradient(150deg,rgba(212,175,55,0.08),rgba(16,185,129,0.05))', border:'1px solid rgba(212,175,55,0.22)' }}>
            <div className="flex items-center gap-2">
              <span style={{ color:'#D4AF37' }}><Icon name="sparkles" size={19} /></span>
              <span className="font-sans font-bold text-[15px]" style={{ color:'#E7CE7A' }}>AI Counsel · Aktif</span>
              <span className="ml-auto h-2 w-2 rounded-full" style={{ background:'#10B981', boxShadow:'0 0 8px #10B981', animation:'knslPulse 2.2s ease-in-out infinite' }} />
            </div>
            <p className="mt-2 font-sans text-[13.5px] leading-snug text-white/45">2.781 pasal terindeks dari KUHP, UU PT & UUD 1945.</p>
          </div>
          <div className="h-4" />
        </div>
        <div className="flex items-center gap-3 border-t px-5 py-4" style={{ borderColor:'rgba(255,255,255,0.07)', paddingBottom:'calc(env(safe-area-inset-bottom,16px) + 16px)' }}>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl font-display text-[16px] font-bold" style={{ color:'#D4AF37', background:'rgba(212,175,55,0.1)', border:'1px solid rgba(212,175,55,0.3)' }}>AK</div>
          <div className="flex-1">
            <div className="font-sans font-bold text-[15px] text-white">Adv. Arya Kusuma</div>
            <div className="font-sans text-[12.5px] text-white/40">Managing Partner</div>
          </div>
          <button type="button" className="text-white/40 transition active:scale-90"><Icon name="gear" size={20} /></button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN: OVERVIEW
═══════════════════════════════════════════════════════════ */
const STAGES_RUN = ['Ekstraksi Fakta','Issue Spotting','Pemetaan Pasal','Uji Unsur'];

function RiskBadge({ risk }) {
  const map = {
    High:     { c:'#34D399', b:'rgba(16,185,129,0.4)',  bg:'rgba(16,185,129,0.08)' },
    Moderate: { c:'#E7CE7A', b:'rgba(212,175,55,0.4)',  bg:'rgba(212,175,55,0.07)' },
    Low:      { c:'rgba(235,235,240,0.6)', b:'rgba(255,255,255,0.14)', bg:'rgba(255,255,255,0.03)' },
  };
  const t = map[risk] || map.Low;
  return <span className="rounded-full px-2.5 py-1 font-sans text-[11px] font-bold" style={{ color:t.c, border:'1px solid '+t.b, background:t.bg }}>{risk}</span>;
}

function OverviewScreen({ onMenu, onBell, go }) {
  return (
    <div>
      <ScreenHeader eyebrow="Ringkasan Praktik" title="Executive Overview" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Card glow className="overflow-hidden p-5" style={{ border:'1px solid rgba(212,175,55,0.2)' }}>
          <Eyebrow>Sabtu · 7 Juni 2026</Eyebrow>
          <h2 className="mt-2 font-display text-white" style={{ fontSize:23, fontWeight:500 }}>Selamat datang, <span style={{ fontStyle:'italic' }}>Arya</span>.</h2>
          <p className="mt-1.5 font-sans text-[13.5px] leading-snug text-white/45">12 perkara aktif · 3 menunggu tindakan Anda hari ini.</p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl p-3" style={{ background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.18)' }}>
            <span style={{ color:'#D4AF37' }}><Icon name="sparkles" size={20} /></span>
            <span className="flex-1 font-sans text-[13px] text-white/70">AI Counsel siap — <span style={{ color:'#34D399', fontWeight:600 }}>2.781 pasal</span> terindeks.</span>
            <span className="h-2 w-2 rounded-full" style={{ background:'#10B981', boxShadow:'0 0 8px #10B981', animation:'knslPulse 2.2s ease-in-out infinite' }} />
          </div>
        </Card>
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon:'briefcase', v:'12',  u:null,  l:'Perkara aktif',    trend:'+2',   tone:'e' },
            { icon:'fileText',  v:'64',  u:null,  l:'Dokumen disusun',  trend:'+9',   tone:'e' },
            { icon:'fileSearch',v:'28',  u:null,  l:'Kontrak ditinjau', trend:'+5',   tone:'e' },
            { icon:'scale',     v:'4,2', u:'M',   l:'Nilai perkara (Rp)',trend:'+18%', tone:'g' },
          ].map((k,i) => (
            <Card key={i} className="p-4" style={k.tone==='g' ? { border:'1px solid rgba(212,175,55,0.28)', background:'linear-gradient(165deg,rgba(212,175,55,0.09),rgba(255,255,255,0.012))' } : {}}>
              <div className="flex items-center justify-between">
                <span style={{ color: k.tone==='g' ? '#D4AF37' : 'rgba(235,235,240,0.45)' }}><Icon name={k.icon} size={19} /></span>
                <span className="font-sans text-[11.5px] font-semibold" style={{ color: k.tone==='g' ? '#E7CE7A' : '#34D399' }}>{k.trend}</span>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display leading-none" style={{ fontSize:34, fontWeight:600, color:'#fff' }}>{k.v}</span>
                {k.u && <span className="font-sans text-[13px] font-semibold" style={{ color: k.tone==='g' ? '#E7CE7A' : '#34D399' }}>{k.u}</span>}
              </div>
              <div className="mt-1.5 font-sans text-[12.5px] leading-tight text-white/45">{k.l}</div>
            </Card>
          ))}
        </div>
        {/* priority matters */}
        <div className="flex items-center justify-between px-1 pt-2">
          <SectionLabel>Perkara Prioritas</SectionLabel>
          <button onClick={() => go('analysis')} className="font-sans text-[12.5px] font-semibold" style={{ color:'#34D399' }}>Lihat semua</button>
        </div>
        {PRIORITY_MATTERS.map((m) => (
          <Card key={m.ref} className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] tracking-wide" style={{ color:'rgba(212,175,55,0.8)' }}>{m.ref}</span>
              <RiskBadge risk={m.risk} />
            </div>
            <div className="mt-2 font-sans text-[15px] font-semibold leading-snug text-white/90">{m.name}</div>
            <div className="mt-1 font-sans text-[12.5px] text-white/40">{m.type} · {m.stage}</div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background:'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full" style={{ width:m.pct+'%', background:'linear-gradient(90deg,#0E9B6E,#34D399)', boxShadow:'0 0 10px rgba(16,185,129,0.5)' }} />
            </div>
          </Card>
        ))}
        {/* quick actions */}
        <SectionLabel className="px-1 pt-2">Mulai Cepat</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {[{id:'analysis',icon:'scale',t:'Analisa Kasus'},{id:'drafting',icon:'penEdit',t:'Susun Dokumen'},{id:'research',icon:'book',t:'Riset Pasal'},{id:'contract',icon:'fileSearch',t:'Tinjau Kontrak'}].map(q => (
            <button key={q.id} onClick={() => go(q.id)} type="button"
              className="flex items-center gap-3 rounded-2xl p-3.5 text-left transition active:scale-[0.97]"
              style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)' }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ color:'#34D399', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)' }}><Icon name={q.icon} size={18} /></span>
              <span className="font-sans text-[13.5px] font-semibold text-white/85">{q.t}</span>
            </button>
          ))}
        </div>
        {/* activity */}
        <SectionLabel className="px-1 pt-2">Aktivitas Terbaru</SectionLabel>
        <Card className="p-2">
          {ACTIVITY.map((a,i) => (
            <div key={i} className="flex items-start gap-3 p-3" style={i < ACTIVITY.length-1 ? { borderBottom:'1px solid rgba(255,255,255,0.05)' } : {}}>
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ color: a.tone==='gold' ? '#D4AF37' : a.tone==='muted' ? 'rgba(235,235,240,0.5)' : '#34D399', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)' }}>
                <Icon name={a.icon} size={16} />
              </span>
              <div className="flex-1">
                <div className="font-sans text-[13px] leading-snug text-white/75">{a.t}</div>
                <div className="mt-0.5 font-sans text-[11.5px] text-white/35">{a.time}</div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN: ANALYSIS ENGINE
═══════════════════════════════════════════════════════════ */
const KRONOLOGI = 'Pada Sabtu 12 April 2026 sekitar pukul 22.30 WIB, korban bernama Budi Santoso berada di warung kopi di Lowokwaru, Malang. Korban bertemu pelaku bernama Andi Pratama yang punya riwayat masalah utang piutang. Sekitar 23.00 terjadi adu mulut dan dilerai saksi, lalu pelaku meninggalkan tempat. Sekitar 30 menit kemudian saat korban pulang, pelaku diduga menghadang korban di jalan sepi dan terjadi perkelahian yang mengakibatkan korban meninggal dunia.';

function AnalysisScreen({ onMenu, onBell }) {
  const [phase, setPhase] = React.useState('input');
  const [tab, setTab]   = React.useState('Isu');
  const [stage, setStage] = React.useState(0);

  const run = () => {
    setPhase('running'); setStage(0);
    let s = 0;
    const iv = setInterval(() => { s += 1; setStage(s); if (s >= STAGES_RUN.length) { clearInterval(iv); setTimeout(() => setPhase('results'), 450); } }, 620);
  };

  const tabs = ['Fakta','Isu','Pasal','Uji Unsur','Kesimpulan'];

  return (
    <div>
      <ScreenHeader eyebrow="Analisa Kasus & Ekstraksi Pasal" title="Legal Analysis Engine" onMenu={onMenu} onBell={onBell} />
      {phase === 'input' && (
        <div className="px-4 pb-8" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Card className="p-5">
            <div className="flex items-center gap-2.5">
              <span style={{ color:'#D4AF37' }}><Icon name="scale" size={22} /></span>
              <h2 className="font-display text-white" style={{ fontSize:21, fontWeight:600 }}>Input Kronologi</h2>
            </div>
            <p className="mt-2 font-sans text-[13.5px] leading-snug text-white/45">Tempel kronologi perkara. Engine menjalankan 4 tahap: <span style={{ color:'#34D399', fontWeight:600 }}>Fakta → Isu → Pasal → Uji Unsur.</span></p>
            <div className="mt-4 rounded-2xl p-3.5" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.1)' }}>
              <p className="font-sans text-[14.5px] leading-relaxed text-white/80">{KRONOLOGI}</p>
            </div>
          </Card>
          <PrimaryButton icon="bolt" onClick={run}>Jalankan Analisa</PrimaryButton>
          <SectionLabel className="px-1">Skenario Contoh</SectionLabel>
          <div className="flex flex-wrap gap-2.5">
            <Chip tone="muted" onClick={run}>Pembunuhan (12 Apr)</Chip>
            <Chip tone="muted" onClick={run}>Penipuan / utang</Chip>
            <Chip tone="muted" onClick={run}>Pencurian</Chip>
          </div>
        </div>
      )}
      {phase === 'running' && (
        <div className="flex flex-col items-center px-6 pt-10 pb-8">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-full" style={{ border:'2px solid rgba(16,185,129,0.18)' }} />
            <div className="absolute inset-0 rounded-full" style={{ borderTop:'2px solid #10B981', borderRight:'2px solid transparent', borderBottom:'2px solid transparent', borderLeft:'2px solid transparent', animation:'spin 0.9s linear infinite' }} />
            <span style={{ color:'#D4AF37' }}><Icon name="scale" size={34} /></span>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <h2 className="mt-6 font-display text-white" style={{ fontSize:22, fontWeight:500 }}>Menganalisa perkara…</h2>
          <div className="mt-6 w-full max-w-[300px] flex flex-col gap-2.5">
            {STAGES_RUN.map((s,i) => {
              const done = i < stage, doing = i === stage;
              return (
                <div key={s} className="flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-300"
                  style={{ background: doing ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)', border:'1px solid '+(doing ? 'rgba(16,185,129,0.3)' : done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)') }}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: done ? '#10B981' : 'transparent', border: done ? 'none' : '1.5px solid rgba(255,255,255,0.2)' }}>
                    {done ? <Icon name="check" size={14} strokeWidth={3} style={{ color:'#04150F' }} /> :
                      <span className="font-sans text-[11px] font-bold" style={{ color: doing ? '#34D399' : 'rgba(255,255,255,0.3)' }}>{i+1}</span>}
                  </span>
                  <span className="font-sans text-[14px] font-semibold" style={{ color: done||doing ? '#fff' : 'rgba(255,255,255,0.4)' }}>{s}</span>
                  {doing && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background:'#10B981', animation:'knslPulse 1s ease-in-out infinite' }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {phase === 'results' && (
        <div className="pb-8">
          <div className="px-4">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[15px] text-white/45">
              {[['7','fakta'],['4','isu'],['6','pasal'],['10','unsur']].map(([n,l]) => (
                <span key={l}><span className="font-display font-bold" style={{ fontSize:19, color:'#34D399' }}>{n}</span> {l}</span>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <GhostButton icon="fileText" tone="muted" className="!py-2.5 !text-[13.5px]">Memo Word</GhostButton>
              <GhostButton icon="penEdit"  tone="muted" className="!py-2.5 !text-[13.5px]">Memo PDF</GhostButton>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              <Chip tone="emerald"><Icon name="checkCircle" size={15} /> INVARIAN 14/14</Chip>
              <Chip tone="emerald">PIDANA &amp; PERDATA</Chip>
            </div>
          </div>
          {/* tabs */}
          <div className="mt-5 flex gap-5 overflow-x-auto px-4 knsl-scroll" style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {tabs.map(t => (
              <button key={t} onClick={() => setTab(t)} type="button"
                className="relative whitespace-nowrap pb-3 font-sans text-[16px] transition"
                style={{ fontWeight: tab===t ? 700 : 500, color: tab===t ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {t}
                {tab===t && <span className="absolute -bottom-px left-0 right-0 h-[2.5px] rounded-full" style={{ background:'linear-gradient(90deg,#10B981,#D4AF37)' }} />}
              </button>
            ))}
          </div>
          <div className="px-4 pt-4 flex flex-col gap-3">
            {tab==='Fakta' && ANALYSIS_FACTS.map(f => (
              <Card key={f.id} className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px]" style={{ color:'rgba(212,175,55,0.8)' }}>{f.id}</span>
                  <Chip tone="muted" className="!py-1 !text-[11px]">{f.tag}</Chip>
                </div>
                <p className="mt-2 font-sans text-[14.5px] leading-snug text-white/85">{f.t}</p>
              </Card>
            ))}
            {tab==='Isu' && ANALYSIS_ISSUES.map((d,i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-full px-3 py-1 font-sans text-[11.5px] font-bold tracking-wide"
                    style={{ color: d.cls==='CIVIL' ? '#9DB4FF' : '#F0A88C', border:'1px solid '+(d.cls==='CIVIL' ? 'rgba(120,140,220,0.4)' : 'rgba(220,120,80,0.4)'), background:'rgba(255,255,255,0.02)' }}>{d.cls}</span>
                  <span className="font-sans text-[12.5px] font-semibold" style={{ color:'#34D399' }}>{d.stat}</span>
                  <span className="ml-auto font-sans text-[13px] font-bold" style={{ color: d.risk==='Moderate' ? '#E7CE7A' : '#34D399' }}>{d.risk}</span>
                </div>
                <p className="mt-3 font-sans text-[15.5px] font-medium leading-snug text-white/90">{d.t}</p>
              </Card>
            ))}
            {tab==='Pasal' && ANALYSIS_PASAL.map((d,i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Chip tone="emerald">{d.code}</Chip>
                    <span className="font-display text-white" style={{ fontSize:21, fontWeight:600 }}>Pasal {d.no}</span>
                  </div>
                  <span className="font-sans text-[12.5px] font-bold" style={{ color:'#34D399' }}>{d.match}% match</span>
                </div>
                <p className="mt-2 font-sans text-[14px] leading-relaxed text-white/65">{d.body}</p>
              </Card>
            ))}
            {tab==='Uji Unsur' && ANALYSIS_UNSUR.map((p,i) => (
              <Card key={i} className="p-4">
                <Chip tone="emerald">{p.pasal}</Chip>
                <div className="mt-3 flex flex-col gap-2.5">
                  {p.items.map((it,j) => (
                    <div key={j} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                        style={it.ok ? { background:'rgba(16,185,129,0.16)' } : { background:'rgba(220,120,80,0.12)' }}>
                        <Icon name={it.ok ? 'check' : 'x'} size={12} strokeWidth={3} style={{ color: it.ok ? '#34D399' : '#F0A88C' }} />
                      </span>
                      <div><span className="font-sans text-[14px] text-white/80">{it.u}</span>
                        {it.note && <div className="mt-0.5 font-sans text-[12px]" style={{ color:'rgba(212,175,55,0.7)' }}>{it.note}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
            {tab==='Kesimpulan' && (
              <Card className="p-5">
                <Eyebrow>Rekomendasi Hukum</Eyebrow>
                <p className="mt-3 font-sans text-[14.5px] leading-relaxed text-white/80">
                  Berdasarkan invarian fakta, perbuatan paling kuat memenuhi unsur <span className="font-semibold" style={{ color:'#34D399' }}>Pasal 338 KUHP (Pembunuhan)</span>. Terdapat dimensi keperdataan paralel berupa <span className="font-semibold" style={{ color:'#E7CE7A' }}>sengketa utang piutang</span> melalui gugatan PMH (Ps. 1365 KUHPerdata).
                </p>
                <div className="mt-4"><PrimaryButton icon="download">Unduh Memo Lengkap</PrimaryButton></div>
              </Card>
            )}
            <button onClick={() => setPhase('input')} className="inline-flex items-center gap-1.5 font-sans text-[13.5px] font-semibold text-white/45">
              <Icon name="arrowRight" size={15} style={{ transform:'rotate(180deg)' }} />Analisa perkara baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN: SMART DRAFTING
═══════════════════════════════════════════════════════════ */
function DraftingScreen({ onMenu, onBell }) {
  const [phase, setPhase] = React.useState('select');
  const [docType, setDocType] = React.useState('Gugatan');
  const [generating, setGenerating] = React.useState(false);
  const [fields, setFields] = React.useState({ penggugat:'PT Anugrah Sejahtera', tergugat:'CV Mandala Jaya', pokok:'Wanprestasi atas Perjanjian Jual Beli No. 014/AS/2026', nilai:'1.250.000.000', pengadilan:'Pengadilan Negeri Malang' });

  const pick = (t) => { setDocType(t); setPhase('form'); };
  const generate = () => { setGenerating(true); setTimeout(() => { setGenerating(false); setPhase('preview'); }, 1500); };

  const Field = ({ label, k, area }) => (
    <div>
      <label className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-white/40">{label}</label>
      {area ? (
        <textarea value={fields[k]} onChange={(e) => setFields({...fields,[k]:e.target.value})} rows={2}
          className="mt-1.5 w-full resize-none rounded-xl px-3.5 py-2.5 font-sans text-[14.5px] text-white/90 outline-none"
          style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.1)' }} />
      ) : (
        <input value={fields[k]} onChange={(e) => setFields({...fields,[k]:e.target.value})}
          className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 font-sans text-[14.5px] text-white/90 outline-none"
          style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.1)' }} />
      )}
    </div>
  );

  return (
    <div>
      <ScreenHeader eyebrow="Drafting & Contract Redlining" title="Smart Drafting Studio" onMenu={onMenu} onBell={onBell} />
      {phase==='select' && (
        <div className="px-4 pb-8" style={{ display:'flex', flexDirection:'column', gap:18 }}>
          {DOC_GROUPS.map(g => (
            <div key={g.group}>
              <SectionLabel className="mb-2.5 px-1">{g.group}</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {g.items.map(it => (
                  <button key={it} onClick={() => pick(it)} type="button"
                    className="flex items-center gap-2.5 rounded-2xl p-3.5 text-left transition active:scale-[0.97]"
                    style={{ background:'rgba(255,255,255,0.022)', border:'1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color:'#34D399' }}><Icon name="fileText" size={17} /></span>
                    <span className="font-sans text-[13px] font-semibold leading-tight text-white/80">{it}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {phase==='form' && (
        <div className="px-4 pb-8" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <button onClick={() => setPhase('select')} className="inline-flex items-center gap-1.5 font-sans text-[13.5px] font-semibold text-white/45">
            <Icon name="arrowRight" size={15} style={{ transform:'rotate(180deg)' }} />Semua dokumen
          </button>
          <Card className="p-5">
            <Eyebrow>Dokumen Dipilih</Eyebrow>
            <h2 className="mt-2 font-display text-white" style={{ fontSize:24, fontWeight:600 }}>{docType}</h2>
            <div className="mt-5 flex flex-col gap-4">
              <Field label="Penggugat / Pihak Pertama" k="penggugat" />
              <Field label="Tergugat / Pihak Kedua" k="tergugat" />
              <Field label="Pokok Perkara" k="pokok" area />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nilai (Rp)" k="nilai" />
                <Field label="Pengadilan" k="pengadilan" />
              </div>
            </div>
          </Card>
          <PrimaryButton icon={generating ? null : 'penEdit'} onClick={generate}>{generating ? 'Menyusun draf…' : 'Susun Dokumen'}</PrimaryButton>
        </div>
      )}
      {phase==='preview' && (
        <div className="px-4 pb-8" style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div className="flex items-center justify-between">
            <button onClick={() => setPhase('form')} className="inline-flex items-center gap-1.5 font-sans text-[13.5px] font-semibold text-white/45">
              <Icon name="arrowRight" size={15} style={{ transform:'rotate(180deg)' }} />Edit data
            </button>
            <Chip tone="emerald"><Icon name="checkCircle" size={14} /> Draf siap</Chip>
          </div>
          <div className="rounded-[18px] p-6" style={{ background:'linear-gradient(180deg,#faf8f2,#f1ede2)', boxShadow:'0 24px 60px -28px rgba(0,0,0,0.85)' }}>
            <div className="text-center" style={{ color:'#1a1a1a', fontFamily:'Georgia,serif' }}>
              <div className="font-bold uppercase tracking-wide" style={{ fontSize:15 }}>Surat Gugatan</div>
              <div className="mt-1 text-[11px] text-black/50">{fields.pengadilan}</div>
            </div>
            <div className="my-4 h-px" style={{ background:'rgba(0,0,0,0.12)' }} />
            <div className="space-y-2.5 text-[11.5px] leading-relaxed" style={{ color:'#2a2a2a', fontFamily:'Georgia,serif' }}>
              <p>Yang bertanda tangan di bawah ini, kuasa hukum dari <b>{fields.penggugat}</b>, selanjutnya disebut sebagai <b>PENGGUGAT</b>;</p>
              <p>Dengan ini mengajukan gugatan terhadap <b>{fields.tergugat}</b>, selanjutnya disebut sebagai <b>TERGUGAT</b>;</p>
              <p className="font-bold pt-1">DUDUK PERKARA</p>
              <p>Bahwa pokok perkara a quo adalah {fields.pokok}, dengan nilai kerugian materiil sebesar Rp {fields.nilai};</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <GhostButton icon="download" tone="muted">Unduh Word</GhostButton>
            <GhostButton icon="download" tone="gold">Unduh PDF</GhostButton>
          </div>
          <PrimaryButton icon="sparkles">Perbaiki dengan AI</PrimaryButton>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREEN: LEGAL RESEARCH
═══════════════════════════════════════════════════════════ */
function ResearchScreen({ onMenu, onBell }) {
  const [q, setQ] = React.useState('penggelapan');
  const [filter, setFilter] = React.useState('Semua');
  const [searched, setSearched] = React.useState(true);

  return (
    <div>
      <ScreenHeader eyebrow="Riset Pasal & Basis UU" title="Legal Research" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"><Icon name="search" size={20} /></span>
          <input value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => e.key==='Enter' && setSearched(true)}
            placeholder="Cari pasal, kata kunci, atau nomor UU…"
            className="w-full rounded-2xl py-3.5 pl-12 pr-4 font-sans text-[15px] text-white outline-none placeholder:text-white/30"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.12)' }} />
        </div>
        <div className="flex gap-2.5 overflow-x-auto knsl-scroll pb-1" style={{ marginInline:-16, paddingInline:16 }}>
          {RESEARCH_FILTERS.map(f => <Chip key={f} active={filter===f} tone="muted" onClick={() => setFilter(f)} className="!flex-shrink-0">{f}</Chip>)}
        </div>
        {searched && (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="font-sans text-[13px] text-white/45"><span className="font-display font-bold" style={{ fontSize:17, color:'#34D399' }}>24</span> hasil untuk "{q}"</span>
              <span className="inline-flex items-center gap-1.5 font-sans text-[12.5px] font-semibold" style={{ color:'rgba(212,175,55,0.8)' }}><Icon name="sparkles" size={14} /> Diurutkan AI</span>
            </div>
            <Card className="p-4" style={{ border:'1px solid rgba(212,175,55,0.22)' }}>
              <div className="flex items-center gap-2"><span style={{ color:'#D4AF37' }}><Icon name="sparkles" size={17} /></span><Eyebrow>Ringkasan AI</Eyebrow></div>
              <p className="mt-2.5 font-sans text-[14px] leading-relaxed text-white/75">Penggelapan diatur dalam <span className="font-semibold" style={{ color:'#34D399' }}>Pasal 372–375 KUHP</span> (kini Ps. 486–489 KUHP 2023). Inti unsurnya: penguasaan barang <span className="italic">bukan</span> karena kejahatan, lalu dimiliki secara melawan hukum.</p>
            </Card>
            {RESEARCH_RESULTS.map((r,i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <Chip tone="emerald">{r.code}</Chip>
                    <span className="font-display text-white" style={{ fontSize:20, fontWeight:600 }}>Pasal {r.no}</span>
                  </div>
                  <span className="font-sans text-[12px] font-bold" style={{ color: r.match===100 ? '#34D399' : '#E7CE7A' }}>{r.match}%</span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">{r.title}</span>
                  <span className="font-mono text-[10px]" style={{ color:'rgba(212,175,55,0.55)' }}>· {r.mirror}</span>
                </div>
                <p className="mt-2.5 font-sans text-[14px] leading-relaxed text-white/65">{r.body}</p>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SCREENS: TOOLS (Scan, Contract, Conflict)
═══════════════════════════════════════════════════════════ */
function UploadZone({ label, hint, icon='upload' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[22px] py-10 text-center"
      style={{ border:'1.5px dashed rgba(255,255,255,0.16)', background:'rgba(255,255,255,0.018)' }}>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl" style={{ color:'#34D399', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.22)' }}><Icon name={icon} size={28} /></span>
      <div className="mt-4 font-sans text-[15.5px] font-semibold text-white/85">{label}</div>
      <div className="mt-1 font-sans text-[13px] text-white/40">{hint}</div>
    </div>
  );
}

function ScanScreen({ onMenu, onBell }) {
  const [done, setDone] = React.useState(false);
  return (
    <div>
      <ScreenHeader eyebrow="Digitalkan Dokumen → PDF / Word" title="Pindai Dokumen" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {!done ? (
          <>
            <Card className="p-4"><p className="font-sans text-[13.5px] leading-snug text-white/55">Foto atau unggah dokumen fisik — putusan, akta, kontrak lama. OCR mengubahnya menjadi teks <span style={{ color:'#34D399', fontWeight:600 }}>PDF / Word</span> yang dapat dicari & diedit.</p></Card>
            <UploadZone label="Unggah berkas dokumen" hint="PDF, JPG, atau PNG · maks 25 MB" />
            <div className="grid grid-cols-2 gap-3">
              <GhostButton icon="camera" tone="muted">Ambil Foto</GhostButton>
              <GhostButton icon="image"  tone="muted">Dari Galeri</GhostButton>
            </div>
            <PrimaryButton icon="scan" onClick={() => setDone(true)}>Pindai & Konversi</PrimaryButton>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color:'#34D399', background:'rgba(16,185,129,0.12)' }}><Icon name="checkCircle" size={22} /></span>
                <div>
                  <div className="font-sans text-[15px] font-bold text-white">Konversi selesai</div>
                  <div className="font-sans text-[12.5px] text-white/40">Putusan_PN_Malang_2026.pdf · 8 hal · 99,2% akurasi</div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl p-4" style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)' }}>
                <div className="font-mono text-[12.5px] leading-relaxed text-white/55"><span style={{ color:'rgba(212,175,55,0.7)' }}>PUTUSAN</span> Nomor 214/Pid.B/2026/PN.Mlg — "DEMI KEADILAN BERDASARKAN KETUHANAN YANG MAHA ESA"…</div>
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <GhostButton icon="download" tone="muted">Unduh Word</GhostButton>
              <GhostButton icon="download" tone="gold">Unduh PDF</GhostButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContractScreen({ onMenu, onBell }) {
  const [analyzed, setAnalyzed] = React.useState(false);
  const sevTone = {
    High:   { c:'#F0A88C', b:'rgba(220,120,80,0.4)',  bg:'rgba(220,120,80,0.07)' },
    Medium: { c:'#E7CE7A', b:'rgba(212,175,55,0.4)',   bg:'rgba(212,175,55,0.07)' },
    Low:    { c:'#34D399', b:'rgba(16,185,129,0.35)',  bg:'rgba(16,185,129,0.06)' },
  };
  return (
    <div>
      <ScreenHeader eyebrow="Tinjauan Kontrak — Klausul, Risiko" title="Contract Review AI" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display:'flex', flexDirection:'column', gap:14 }}>
        {!analyzed ? (
          <>
            <Card className="p-4"><p className="font-sans text-[13.5px] leading-snug text-white/55">Unggah kontrak. AI memetakan setiap klausul, menandai <span style={{ color:'#E7CE7A', fontWeight:600 }}>risiko</span>, dan mengusulkan <span style={{ color:'#34D399', fontWeight:600 }}>redline</span> demi kepentingan klien.</p></Card>
            <UploadZone label="Unggah kontrak untuk ditinjau" hint="PDF atau DOCX · maks 25 MB" icon="fileSearch" />
            <PrimaryButton icon="sparkles" onClick={() => setAnalyzed(true)}>Tinjau Kontrak</PrimaryButton>
          </>
        ) : (
          <div className="flex flex-col gap-3.5">
            <Card glow className="p-5" style={{ border:'1px solid rgba(212,175,55,0.22)' }}>
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background:'conic-gradient(#D4AF37 0% 62%,rgba(255,255,255,0.07) 62% 100%)' }}>
                  <div className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full" style={{ background:'#0E0E0E' }}>
                    <span className="font-display font-bold" style={{ fontSize:22, lineHeight:1, color:'#D4AF37' }}>62</span>
                    <span className="font-sans text-[9px] text-white/40">/100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Eyebrow>Skor Risiko Kontrak</Eyebrow>
                  <div className="mt-1 font-display text-white" style={{ fontSize:19, fontWeight:600 }}>Risiko Sedang–Tinggi</div>
                  <div className="mt-1 font-sans text-[12.5px] text-white/45">Master Supply Agreement · 14 klausul</div>
                </div>
              </div>
              <div className="mt-4 flex gap-2.5">
                <Chip tone="danger">2 Tinggi</Chip>
                <Chip tone="gold">1 Sedang</Chip>
                <Chip tone="emerald">1 Rendah</Chip>
              </div>
            </Card>
            <SectionLabel className="px-1 pt-1">Temuan Klausul</SectionLabel>
            {CLAUSES.map((c,i) => {
              const t = sevTone[c.sev];
              return (
                <Card key={i} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-white/45">{c.tag}</span>
                    <span className="rounded-full px-2.5 py-1 font-sans text-[11px] font-bold" style={{ color:t.c, border:'1px solid '+t.b, background:t.bg }}>{c.sev}</span>
                  </div>
                  <p className="mt-2 font-sans text-[14px] leading-snug text-white/80">{c.t}</p>
                  <div className="mt-3 flex items-start gap-2 rounded-xl p-3" style={{ background:'rgba(16,185,129,0.05)', border:'1px solid rgba(16,185,129,0.16)' }}>
                    <span className="mt-0.5" style={{ color:'#34D399' }}><Icon name="sparkles" size={15} /></span>
                    <span className="font-sans text-[13px] leading-snug text-white/70"><span className="font-semibold" style={{ color:'#34D399' }}>Saran: </span>{c.sug}</span>
                  </div>
                </Card>
              );
            })}
            <PrimaryButton icon="download">Unduh Versi Redline</PrimaryButton>
          </div>
        )}
      </div>
    </div>
  );
}

function ConflictScreen({ onMenu, onBell }) {
  const [name, setName] = React.useState('CV Mandala Jaya');
  const [checked, setChecked] = React.useState(false);
  return (
    <div>
      <ScreenHeader eyebrow="Benturan Kepentingan" title="Conflict Check" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <Card className="p-4"><p className="font-sans text-[13.5px] leading-snug text-white/55">Periksa benturan kepentingan terhadap basis data klien, lawan, & pihak terkait sebelum menerima perkara baru.</p></Card>
        <div>
          <label className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-white/40">Nama pihak / entitas</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="mt-1.5 w-full rounded-2xl px-4 py-3.5 font-sans text-[15px] text-white outline-none"
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.12)' }} />
        </div>
        <PrimaryButton icon="shield" onClick={() => setChecked(true)}>Periksa Benturan</PrimaryButton>
        {checked && (
          <div className="flex flex-col gap-3">
            <Card className="p-4" style={{ border:'1px solid rgba(212,175,55,0.28)' }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color:'#D4AF37', background:'rgba(212,175,55,0.12)' }}><Icon name="alert" size={22} /></span>
                <div>
                  <div className="font-sans text-[15px] font-bold" style={{ color:'#D4AF37' }}>1 potensi benturan</div>
                  <div className="font-sans text-[12.5px] text-white/45">Tinjau sebelum melanjutkan</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[14.5px] font-bold text-white">{name}</span>
                <Chip tone="gold">Pihak lawan aktif</Chip>
              </div>
              <p className="mt-2 font-sans text-[13px] leading-snug text-white/55">Terdaftar sebagai <span style={{ color:'#E7CE7A' }}>tergugat</span> dalam perkara aktif <span className="font-mono text-[12px] text-white/70">PERK-2026-014</span>. Mewakili entitas ini berpotensi benturan langsung.</p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   BOTTOM TAB BAR (mobile-native nav)
═══════════════════════════════════════════════════════════ */
const TABS = [
  { id:'overview',  icon:'grid',      label:'Overview' },
  { id:'analysis',  icon:'scale',     label:'Analisa' },
  { id:'drafting',  icon:'penEdit',   label:'Drafting' },
  { id:'research',  icon:'book',      label:'Riset' },
  { id:'contract',  icon:'fileSearch',label:'Kontrak' },
];

function BottomTabBar({ active, onSelect }) {
  return (
    <div className="flex items-center" style={{ borderTop:'1px solid rgba(255,255,255,0.07)', background:'rgba(10,10,10,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', paddingBottom:'env(safe-area-inset-bottom,0px)' }}>
      {TABS.map(t => {
        const isActive = t.id === active;
        return (
          <button key={t.id} onClick={() => onSelect(t.id)} type="button"
            className="flex flex-1 flex-col items-center gap-1 py-2.5 transition-all duration-150 active:scale-90">
            <span style={{ color: isActive ? '#10B981' : 'rgba(235,235,240,0.35)', filter: isActive ? 'drop-shadow(0 0 6px rgba(16,185,129,0.7))' : 'none' }}>
              <Icon name={t.icon} size={22} strokeWidth={isActive ? 2 : 1.6} />
            </span>
            <span className="font-sans text-[10px] font-semibold" style={{ color: isActive ? '#10B981' : 'rgba(235,235,240,0.35)', letterSpacing:'0.03em' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════ */
export default function KNSLMobileApp() {
  const [active, setActive] = React.useState('overview');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const scrollRef = React.useRef(null);

  const go = (id) => { setActive(id); setMenuOpen(false); if (scrollRef.current) scrollRef.current.scrollTop = 0; };
  const onMenu = () => setMenuOpen(true);
  const onBell = () => {};
  const sp = { onMenu, onBell, go };

  const screens = {
    overview: <OverviewScreen {...sp} />,
    analysis: <AnalysisScreen {...sp} />,
    drafting: <DraftingScreen {...sp} />,
    research: <ResearchScreen {...sp} />,
    scan:     <ScanScreen     {...sp} />,
    contract: <ContractScreen {...sp} />,
    conflict: <ConflictScreen {...sp} />,
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', background:'#0A0A0A', fontFamily:'Manrope,system-ui,sans-serif', WebkitFontSmoothing:'antialiased', position:'relative' }}>
      {/* ambient glow */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(130% 60% at 0% 0%,rgba(16,185,129,0.07),transparent 45%),radial-gradient(120% 60% at 100% 100%,rgba(212,175,55,0.05),transparent 50%)' }} />
      {/* scroll area */}
      <div ref={scrollRef} key={active} style={{ flex:1, overflowY:'auto', overflowX:'hidden', scrollbarWidth:'none' }}>
        {screens[active]}
      </div>
      {/* bottom nav */}
      <BottomTabBar active={active} onSelect={go} />
      {/* sidebar overlay */}
      <Sidebar open={menuOpen} active={active} onSelect={go} onClose={() => setMenuOpen(false)} />
    </div>
  );
}
