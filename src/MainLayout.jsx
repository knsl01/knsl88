import React from 'react';

// ==========================================
// 1. DATA FIXTURES (Dilebur dari data.jsx)
// ==========================================
const MODULES = [
  { id: 'overview', icon: 'grid', name: 'Executive Overview', eyebrow: 'RINGKASAN PRAKTIK', sub: 'Dasbor Strategis' },
  { id: 'analysis', icon: 'scale', name: 'Legal Analysis Engine', eyebrow: 'ANALISA KASUS & EKSTRAKSI PASAL', sub: 'Analisa Kasus' },
  { id: 'drafting', icon: 'penEdit', name: 'Smart Drafting', eyebrow: 'DRAFTING & CONTRACT REDLINING', sub: 'Smart Drafting Studio' },
  { id: 'research', icon: 'book', name: 'Legal Research', eyebrow: 'RISET PASAL & BASIS UU', sub: 'Riset Pasal' },
  { id: 'scan', icon: 'scan', name: 'Pindai Dokumen', eyebrow: 'DIGITALKAN DOKUMEN → PDF / WORD', sub: 'OCR Dokumen' },
  { id: 'contract', icon: 'fileSearch', name: 'Contract Review AI', eyebrow: 'TINJAUAN KONTRAK — KLAUSUL, RISIKO', sub: 'Tinjauan Kontrak' },
  { id: 'conflict', icon: 'shield', name: 'Conflict Check', eyebrow: 'BENTURAN KEPENTINGAN', sub: 'Cek Benturan' },
];

const PASAL_DB = [
  { code: 'KUHP', no: '362', mirror: 'KUHP 2023: PS. 476', title: 'PENCURIAN', body: 'Barang siapa mengambil barang sesuatu, yang seluruhnya atau sebagian kepunyaan orang lain, dengan maksud untuk dimiliki secara melawan hukum...', match: 100 },
  { code: 'KUHP', no: '372', mirror: 'KUHP 2023: PS. 486', title: 'PENGGELAPAN', body: 'Barang siapa dengan sengaja dan melawan hukum memiliki barang sesuatu yang seluruhnya atau sebagian adalah kepunyaan orang lain...', match: 100 },
  { code: 'KUHP', no: '374', mirror: 'KUHP 2023: PS. 488', title: 'PENGGELAPAN DALAM JABATAN', body: 'Penggelapan yang dilakukan oleh orang yang penguasaannya terhadap barang disebabkan karena ada hubungan kerja...', match: 94 },
];

// ==========================================
// 2. DESIGN SYSTEM PRIMITIVES (Dari ui.jsx)
// ==========================================
const ICON_PATHS = {
  menu: <path d="M4 7h16M4 12h12M4 17h16" />,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  grid: <><rect x="4" y="4" width="6.5" height="6.5" rx="1.4" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" /></>,
  scale: <path d="M12 4v16M7 20h10M5 7h14" />,
  book: <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />,
  penEdit: <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  arrowRight: <path d="M5 12h14M12 5l7 7-7 7" />,
  checkCircle: <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3" />,
  alert: <><path d="m10.29 3.86 7.82 13.42A2 2 0 0 1 16.39 20H3.61a2 2 0 0 1-1.72-3.03l7.82-13.42a2 2 0 0 1 3.48 0z" /><path d="M12 9v4M12 17h.01" /></>
};

function Icon({ name, size = 20, ...p }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" {...p}>
      {ICON_PATHS[name] || null}
    </svg>
  );
}

function Card({ children, className = '', style = {} }) {
  return (
    <div className={`rounded-2xl border border-white/[0.06] bg-neutral-900/40 backdrop-blur-md ${className}`} style={style}>
      {children}
    </div>
  );
}

function Eyebrow({ children, className = '' }) {
  return <div className={`font-sans text-[10.5px] font-bold uppercase tracking-[0.15em] text-amber-500/80 ${className}`}>{children}</div>;
}

function SectionLabel({ children, className = '' }) {
  return <div className={`font-sans text-[11.5px] font-extrabold uppercase tracking-[0.08em] text-white/30 ${className}`}>{children}</div>;
}

function PrimaryButton({ children, icon, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-sans text-[14px] font-bold text-white transition active:scale-[0.98] active:bg-emerald-700">
      {children} {icon && <Icon name={icon} size={16} />}
    </button>
  );
}

function GhostButton({ children, icon, onClick }) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] py-3 font-sans text-[14px] font-semibold text-white/80 transition active:scale-[0.98] active:bg-white/[0.06]">
      {children} {icon && <Icon name={icon} size={16} />}
    </button>
  );
}

// ==========================================
// 3. INTERNAL SCREENS (Gabungan Berkas)
// ==========================================

// --- Overview Screen ---
function OverviewScreen({ onMenu, go }) {
  return (
    <div className="p-4 space-y-5">
      <div className="flex items-center justify-between pt-2">
        <button onClick={onMenu} className="p-2 border border-white/10 rounded-xl bg-white/5"><Icon name="menu" /></button>
        <h1 className="font-display text-white text-xl font-bold">KNSL Intelligence</h1>
        <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500"><Icon name="bell" size={18} /></div>
      </div>
      
      <Eyebrow>Executive Dashboard</Eyebrow>
      
      <Card className="p-4" style={{ background: 'linear-gradient(165deg, rgba(212,175,55,0.08), transparent)' }}>
        <div className="text-white/60 font-sans text-xs">AI Legal Assistant Status</div>
        <div className="text-2xl font-display text-white font-bold mt-1">Sistem Siap</div>
        <div className="text-emerald-400 font-sans text-[11px] mt-2 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Terhubung ke Serverless Proxy
        </div>
      </Card>

      <SectionLabel>Modul Analisa & Drafting</SectionLabel>
      <div className="grid grid-cols-1 gap-3">
        {MODULES.map(m => (
          <button key={m.id} onClick={() => go(m.id)} className="text-left w-full p-4 border border-white/[0.06] bg-white/[0.02] rounded-xl flex items-center justify-between transition active:scale-95">
            <div>
              <Eyebrow>{m.eyebrow}</Eyebrow>
              <div className="text-white font-sans font-bold text-[15px] mt-1">{m.name}</div>
            </div>
            <span className="text-white/40"><Icon name="arrowRight" size={16} /></span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Analysis Screen ---
function AnalysisScreen({ go }) {
  return (
    <div className="p-4 space-y-4">
      <button onClick={() => go('overview')} className="text-white/40 text-xs flex items-center gap-1"><Icon name="arrowRight" size={12} style={{ transform: 'rotate(180deg)' }} /> Kembali</button>
      <h2 className="text-xl font-display text-white font-bold">Legal Analysis Engine</h2>
      <Card className="p-4 space-y-3">
        <textarea rows={5} placeholder="Masukkan kronologi perkara hukum di sini..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm outline-none placeholder:text-white/20" />
        <PrimaryButton icon="scale">Jalankan Analisa AI</PrimaryButton>
      </Card>
    </div>
  );
}

// --- Drafting Screen ---
function DraftingScreen({ go }) {
  return (
    <div className="p-4 space-y-4">
      <button onClick={() => go('overview')} className="text-white/40 text-xs flex items-center gap-1"><Icon name="arrowRight" size={12} style={{ transform: 'rotate(180deg)' }} /> Kembali</button>
      <h2 className="text-xl font-display text-white font-bold">Smart Drafting Studio</h2>
      <Card className="p-4 space-y-3">
        <div className="text-sm text-white/80 font-sans">Pilih Template Dokumen Hukum:</div>
        <div className="grid grid-cols-2 gap-2">
          {['Gugatan', 'Somasi', 'Kontrak NDA', 'PKS'].map(t => (
            <GhostButton key={t} onClick={() => alert(`Drafting ${t} dimulai`)}>{t}</GhostButton>
          ))}
        </div>
      </Card>
    </div>
  );
}

// --- Research Screen ---
function ResearchScreen({ go }) {
  return (
    <div className="p-4 space-y-4">
      <button onClick={() => go('overview')} className="text-white/40 text-xs flex items-center gap-1"><Icon name="arrowRight" size={12} style={{ transform: 'rotate(180deg)' }} /> Kembali</button>
      <h2 className="text-xl font-display text-white font-bold">Legal Research</h2>
      <div className="relative">
        <input placeholder="Cari pasal atau kata kunci UU..." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none" />
        <span className="absolute left-3 top-3.5 text-white/30"><Icon name="search" size={16} /></span>
      </div>
      <div className="space-y-3">
        {PASAL_DB.map((p, i) => (
          <Card key={i} className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-amber-400 font-mono text-xs font-bold">{p.code} Pasal {p.no}</span>
              <span className="text-white/30 text-[11px]">{p.mirror}</span>
            </div>
            <div className="text-white font-sans text-sm font-bold">{p.title}</div>
            <p className="text-white/60 text-xs leading-relaxed font-sans">{p.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}

// --- IOS FRAME COMPONENT ---
function IOSDevice({ children }) {
  return (
    <div className="mx-auto my-4 relative w-[393px] h-[852px] bg-black rounded-[55px] border-[11px] border-neutral-800 shadow-2xl overflow-hidden" style={{ contentVisibility: 'auto' }}>
      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-[110px] h-[30px] bg-black rounded-3xl z-50 flex items-center justify-center">
        <div className="w-3 h-3 bg-neutral-900 rounded-full ml-auto mr-4"></div>
      </div>
      {/* Content Area */}
      <div className="w-full h-full bg-[#0A0A0A] overflow-y-auto knsl-scroll pt-8 pb-4 relative">
        {children}
      </div>
      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[140px] h-[5px] bg-white/40 rounded-full z-50"></div>
    </div>
  );
}

// --- OVERLAY SIDEBAR ---
function Sidebar({ open, onClose, go }) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex">
      <div className="w-[280px] h-full bg-neutral-950 p-5 border-r border-white/10 space-y-6">
        <div className="flex justify-between items-center">
          <Eyebrow>Menu Navigasi</Eyebrow>
          <button onClick={onClose} className="text-white/40 text-xs border border-white/10 px-2 py-1 rounded-lg">Tutup</button>
        </div>
        <div className="space-y-2">
          <button onClick={() => { go('overview'); onClose(); }} className="w-full text-left p-3 text-white/80 font-sans text-sm hover:bg-white/5 rounded-xl block">Executive Overview</button>
          <button onClick={() => { go('analysis'); onClose(); }} className="w-full text-left p-3 text-white/80 font-sans text-sm hover:bg-white/5 rounded-xl block">Legal Analysis</button>
          <button onClick={() => { go('drafting'); onClose(); }} className="w-full text-left p-3 text-white/80 font-sans text-sm hover:bg-white/5 rounded-xl block">Smart Drafting</button>
          <button onClick={() => { go('research'); onClose(); }} className="w-full text-left p-3 text-white/80 font-sans text-sm hover:bg-white/5 rounded-xl block">Legal Research</button>
        </div>
      </div>
      <div className="flex-1" onClick={onClose}></div>
    </div>
  );
}

// ==========================================
// 4. MAIN EXPORT LAYOUT
// ==========================================
export default function MainLayout() {
  const [active, setActive] = React.useState('overview');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const scrollRef = React.useRef(null);

  const go = (id) => {
    setActive(id);
    setMenuOpen(false);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const screens = {
    overview: <OverviewScreen go={go} onMenu={() => setMenuOpen(true)} />,
    analysis: <AnalysisScreen go={go} />,
    drafting: <DraftingScreen go={go} />,
    research: <ResearchScreen go={go} />,
    scan: <AnalysisScreen go={go} />, // Fallback jika layar belum selesai dimuat
    contract: <DraftingScreen go={go} />,
    conflict: <ResearchScreen go={go} />,
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] flex items-center justify-center p-2">
      <IOSDevice>
        <div style={{ position: 'relative', height: '100%', width: '100%' }}>
          {/* Ambient Background */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'radial-gradient(130% 60% at 0% 0%, rgba(16,185,129,0.06), transparent 45%), radial-gradient(120% 60% at 100% 100%, rgba(212,175,55,0.04), transparent 50%)',
          }} />
          
          <div ref={scrollRef} className="h-full w-full overflow-y-auto knsl-scroll">
            {screens[active] || screens.overview}
          </div>

          <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} go={go} />
        </div>
      </IOSDevice>
    </div>
  );
}
