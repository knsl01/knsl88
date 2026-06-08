/* screen-overview.jsx — Executive Overview dashboard (net-new, premium) */

function KpiCard({ value, unit, label, trend, tone = 'emerald', icon }) {
  const accent = tone === 'gold' ? '#E7CE7A' : '#34D399';
  return (
    <Card className="p-4" style={tone === 'gold' ? { border: '1px solid rgba(212,175,55,0.28)', background: 'linear-gradient(165deg, rgba(212,175,55,0.09), rgba(255,255,255,0.012))' } : {}}>
      <div className="flex items-center justify-between">
        <span style={{ color: tone === 'gold' ? '#D4AF37' : 'rgba(235,235,240,0.45)' }}><Icon name={icon} size={19} /></span>
        {trend && (
          <span className="inline-flex items-center gap-1 font-sans text-[11.5px] font-semibold" style={{ color: accent }}>
            <Icon name="trendUp" size={13} strokeWidth={2} />{trend}
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display leading-none" style={{ fontSize: 34, fontWeight: 600, color: '#fff' }}>{value}</span>
        {unit && <span className="font-sans text-[13px] font-semibold" style={{ color: accent }}>{unit}</span>}
      </div>
      <div className="mt-1.5 font-sans text-[12.5px] leading-tight text-white/45">{label}</div>
    </Card>
  );
}

const PRIORITY_MATTERS = [
  { ref: 'PERK-2026-014', name: 'PT Anugrah Sejahtera vs. CV Mandala', type: 'Wanprestasi', risk: 'High', stage: 'Pembuktian', pct: 72 },
  { ref: 'PIDM-2026-009', name: 'Pendampingan — Budi Santoso', type: 'Pidana', risk: 'High', stage: 'Penyidikan', pct: 35 },
  { ref: 'KONT-2026-031', name: 'Master Supply Agreement — Vendor A', type: 'Kontrak', risk: 'Moderate', stage: 'Redlining', pct: 88 },
];

const ACTIVITY = [
  { icon: 'scale', t: 'Analisa kasus pembunuhan selesai — 6 pasal terekstraksi', time: '12 mnt lalu', tone: 'emerald' },
  { icon: 'fileSearch', t: 'Tinjauan kontrak vendor — 3 klausul risiko tinggi', time: '1 jam lalu', tone: 'gold' },
  { icon: 'penEdit', t: 'Gugatan Wanprestasi di-draft & diunduh (Word)', time: '3 jam lalu', tone: 'emerald' },
  { icon: 'book', t: 'Riset pasal "penggelapan" — 24 hasil disimpan', time: 'Kemarin', tone: 'muted' },
];

function RiskBadge({ risk }) {
  const map = {
    High: { c: '#34D399', b: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.08)' },
    'Moderate-High': { c: '#34D399', b: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.06)' },
    Moderate: { c: '#E7CE7A', b: 'rgba(212,175,55,0.4)', bg: 'rgba(212,175,55,0.07)' },
    Low: { c: 'rgba(235,235,240,0.6)', b: 'rgba(255,255,255,0.14)', bg: 'rgba(255,255,255,0.03)' },
  };
  const t = map[risk] || map.Low;
  return (
    <span className="rounded-full px-2.5 py-1 font-sans text-[11px] font-bold"
      style={{ color: t.c, border: '1px solid ' + t.b, background: t.bg }}>{risk}</span>
  );
}

function OverviewScreen({ onMenu, onBell, go }) {
  return (
    <div className="knsl-fade">
      <ScreenHeader eyebrow="Ringkasan Praktik" title="Executive Overview" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* greeting / health */}
        <Card glow className="overflow-hidden p-5" style={{ border: '1px solid rgba(212,175,55,0.2)' }}>
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.16), transparent 70%)' }} />
          <Eyebrow>Jumat · 6 Juni 2026</Eyebrow>
          <h2 className="mt-2 font-display text-white" style={{ fontSize: 23, fontWeight: 500 }}>
            Selamat datang, <span style={{ fontStyle: 'italic' }}>Arya</span>.
          </h2>
          <p className="mt-1.5 font-sans text-[13.5px] leading-snug text-white/45">
            12 perkara aktif &middot; 3 menunggu tindakan Anda hari ini.
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl p-3"
            style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
            <span style={{ color: '#D4AF37' }}><Icon name="sparkles" size={20} /></span>
            <span className="flex-1 font-sans text-[13px] text-white/70">AI Counsel siap — <span className="text-emerald-soft font-semibold">2.781 pasal</span> terindeks.</span>
            <span className="h-2 w-2 rounded-full" style={{ background: '#10B981', boxShadow: '0 0 8px #10B981', animation: 'knslPulse 2.2s ease-in-out infinite' }} />
          </div>
        </Card>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard icon="briefcase" value="12" label="Perkara aktif" trend="+2" tone="emerald" />
          <KpiCard icon="fileText" value="64" label="Dokumen disusun" trend="+9" tone="emerald" />
          <KpiCard icon="fileSearch" value="28" label="Kontrak ditinjau" trend="+5" tone="emerald" />
          <KpiCard icon="scale" value="4,2" unit="M" label="Nilai perkara (Rp)" trend="+18%" tone="gold" />
        </div>

        {/* priority matters */}
        <div className="flex items-center justify-between px-1 pt-2">
          <SectionLabel>Perkara Prioritas</SectionLabel>
          <button onClick={() => go('analysis')} className="font-sans text-[12.5px] font-semibold text-emerald-soft">Lihat semua</button>
        </div>
        <div className="flex flex-col gap-2.5">
          {PRIORITY_MATTERS.map((m) => (
            <Card key={m.ref} className="p-4 transition active:scale-[0.99]">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] tracking-wide text-gold/80">{m.ref}</span>
                <RiskBadge risk={m.risk} />
              </div>
              <div className="mt-2 font-sans text-[15px] font-semibold leading-snug text-white/90">{m.name}</div>
              <div className="mt-1 font-sans text-[12.5px] text-white/40">{m.type} &middot; {m.stage}</div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                <div className="h-full rounded-full" style={{ width: m.pct + '%', background: 'linear-gradient(90deg, #0E9B6E, #34D399)', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
              </div>
            </Card>
          ))}
        </div>

        {/* quick actions */}
        <SectionLabel className="px-1 pt-2">Mulai Cepat</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'analysis', icon: 'scale', t: 'Analisa Kasus' },
            { id: 'drafting', icon: 'penEdit', t: 'Susun Dokumen' },
            { id: 'research', icon: 'book', t: 'Riset Pasal' },
            { id: 'contract', icon: 'fileSearch', t: 'Tinjau Kontrak' },
          ].map((q) => (
            <button key={q.id} onClick={() => go(q.id)} type="button"
              className="flex items-center gap-3 rounded-2xl p-3.5 text-left transition active:scale-[0.97]"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ color: '#34D399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <Icon name={q.icon} size={18} />
              </span>
              <span className="font-sans text-[13.5px] font-semibold text-white/85">{q.t}</span>
            </button>
          ))}
        </div>

        {/* activity */}
        <SectionLabel className="px-1 pt-2">Aktivitas Terbaru</SectionLabel>
        <Card className="p-2">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-start gap-3 p-3" style={i < ACTIVITY.length - 1 ? { borderBottom: '1px solid rgba(255,255,255,0.05)' } : {}}>
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ color: a.tone === 'gold' ? '#D4AF37' : a.tone === 'muted' ? 'rgba(235,235,240,0.5)' : '#34D399', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
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

Object.assign(window, { OverviewScreen });
