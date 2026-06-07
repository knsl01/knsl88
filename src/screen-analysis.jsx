/* screen-analysis.jsx — Legal Analysis Engine: input kronologi -> 4-stage run -> tabbed results */

const KRONOLOGI = "Pada Sabtu 12 April 2026 sekitar pukul 22.30 WIB, korban bernama Budi Santoso berada di warung kopi di Lowokwaru, Malang. Korban bertemu pelaku bernama Andi Pratama yang punya riwayat masalah utang piutang. Sekitar 23.00 terjadi adu mulut dan dilerai saksi, lalu pelaku meninggalkan tempat. Sekitar 30 menit kemudian saat korban pulang, pelaku diduga menghadang korban di jalan sepi dan terjadi perkelahian yang mengakibatkan korban meninggal dunia.";

const STAGES = ['Ekstraksi Fakta', 'Issue Spotting', 'Pemetaan Pasal', 'Uji Unsur'];

function IssueCard({ d }) {
  const clsColor = d.cls === 'CIVIL' ? { c: '#9DB4FF', b: 'rgba(120,140,220,0.4)' } : { c: '#F0A88C', b: 'rgba(220,120,80,0.4)' };
  const riskTone = d.risk === 'Moderate' ? '#E7CE7A' : '#34D399';
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2.5">
        <span className="rounded-full px-3 py-1 font-sans text-[11.5px] font-bold tracking-wide"
          style={{ color: clsColor.c, border: '1px solid ' + clsColor.b, background: 'rgba(255,255,255,0.02)' }}>{d.cls}</span>
        <span className="font-sans text-[12.5px] font-semibold text-emerald-soft">{d.stat}</span>
        <span className="ml-auto font-sans text-[13px] font-bold" style={{ color: riskTone }}>{d.risk}</span>
      </div>
      <p className="mt-3 font-sans text-[15.5px] font-medium leading-snug text-white/90" style={{ textWrap: 'pretty' }}>{d.t}</p>
      <div className="mt-3 flex items-center gap-1.5 font-mono text-[11.5px] text-white/35">
        <Icon name="arrowRight" size={13} strokeWidth={1.6} style={{ transform: 'rotate(90deg)' }} />{d.facts}
      </div>
    </Card>
  );
}

function PasalCard({ d }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Chip tone="emerald">{d.code}</Chip>
          <span className="font-display text-white" style={{ fontSize: 21, fontWeight: 600 }}>Pasal {d.no}</span>
        </div>
        <span className="font-sans text-[12.5px] font-bold text-emerald-soft">{d.match}% match</span>
      </div>
      <div className="mt-2 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">{d.title}</div>
      <p className="mt-2 font-sans text-[14px] leading-relaxed text-white/65" style={{ textWrap: 'pretty' }}>{d.body}</p>
      <button className="mt-3 inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-emerald-soft">
        <Icon name="chevronRight" size={15} />Lihat isi pasal lengkap
      </button>
    </Card>
  );
}

function AnalysisScreen({ onMenu, onBell }) {
  const [phase, setPhase] = React.useState('input'); // input | running | results
  const [tab, setTab] = React.useState('Isu');
  const [stage, setStage] = React.useState(0);
  const [useAI, setUseAI] = React.useState(true);

  const run = () => {
    setPhase('running'); setStage(0);
    let s = 0;
    const iv = setInterval(() => {
      s += 1; setStage(s);
      if (s >= STAGES.length) { clearInterval(iv); setTimeout(() => setPhase('results'), 450); }
    }, 620);
  };

  const tabs = ['Fakta', 'Isu', 'Pasal', 'Uji Unsur', 'Kesimpulan'];

  return (
    <div className="knsl-fade">
      <ScreenHeader eyebrow="Analisa Kasus & Ekstraksi Pasal" title="Legal Analysis Engine" onMenu={onMenu} onBell={onBell} />

      {phase === 'input' && (
        <div className="px-4 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card className="p-5">
            <div className="flex items-center gap-2.5">
              <span style={{ color: '#D4AF37' }}><Icon name="scale" size={22} /></span>
              <h2 className="font-display text-white" style={{ fontSize: 21, fontWeight: 600 }}>Input Kronologi</h2>
            </div>
            <p className="mt-2 font-sans text-[13.5px] leading-snug text-white/45">
              Tempel kronologi perkara. Engine menjalankan 4 tahap:
              <span className="text-emerald-soft font-semibold"> Fakta → Isu → Pasal → Uji Unsur.</span>
            </p>
            <div className="relative mt-4 rounded-2xl px-3.5 py-3" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <span className="font-sans text-[13.5px] font-semibold text-white/85">Semua Sumber Hukum</span>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40"><Icon name="chevronUpDown" size={17} /></span>
            </div>
            <div className="mt-3 rounded-2xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="font-sans text-[14.5px] leading-relaxed text-white/80" style={{ textWrap: 'pretty' }}>{KRONOLOGI}</p>
            </div>
          </Card>

          <PrimaryButton icon="bolt" onClick={run}>Jalankan Analisa</PrimaryButton>

          <button onClick={() => setUseAI(!useAI)} type="button" className="flex items-center gap-3 px-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg transition"
              style={useAI ? { background: '#10B981', boxShadow: '0 0 14px -2px rgba(16,185,129,0.7)' } : { border: '1px solid rgba(255,255,255,0.2)' }}>
              {useAI && <Icon name="check" size={16} strokeWidth={2.6} style={{ color: '#04150F' }} />}
            </span>
            <span className="flex items-center gap-1.5 font-sans text-[13.5px] text-white/65 text-left">
              <span style={{ color: '#D4AF37' }}><Icon name="sparkles" size={15} /></span>
              Penalaran AI (Fakta &amp; Isu) — pasal &amp; uji unsur tetap deterministik
            </span>
          </button>

          <SectionLabel className="px-1 pt-2">Skenario Contoh</SectionLabel>
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
            <div className="absolute inset-0 rounded-full" style={{ border: '2px solid rgba(16,185,129,0.18)' }} />
            <div className="absolute inset-0 rounded-full" style={{ borderTop: '2px solid #10B981', borderRight: '2px solid transparent', borderBottom: '2px solid transparent', borderLeft: '2px solid transparent', animation: 'spin 0.9s linear infinite' }} />
            <span style={{ color: '#D4AF37' }}><Icon name="scale" size={34} /></span>
          </div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          <h2 className="mt-6 font-display text-white" style={{ fontSize: 22, fontWeight: 500 }}>Menganalisa perkara…</h2>
          <div className="mt-6 w-full max-w-[300px] flex flex-col gap-2.5">
            {STAGES.map((s, i) => {
              const done = i < stage, doing = i === stage;
              return (
                <div key={s} className="flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all duration-300"
                  style={{ background: doing ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (doing ? 'rgba(16,185,129,0.3)' : done ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)') }}>
                  <span className="flex h-6 w-6 items-center justify-center rounded-full"
                    style={{ background: done ? '#10B981' : 'transparent', border: done ? 'none' : '1.5px solid rgba(255,255,255,0.2)' }}>
                    {done ? <Icon name="check" size={14} strokeWidth={3} style={{ color: '#04150F' }} /> :
                      <span className="font-sans text-[11px] font-bold" style={{ color: doing ? '#34D399' : 'rgba(255,255,255,0.3)' }}>{i + 1}</span>}
                  </span>
                  <span className="font-sans text-[14px] font-semibold" style={{ color: done || doing ? '#fff' : 'rgba(255,255,255,0.4)' }}>{s}</span>
                  {doing && <span className="ml-auto h-1.5 w-1.5 rounded-full" style={{ background: '#10B981', animation: 'knslPulse 1s ease-in-out infinite' }} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {phase === 'results' && (
        <div className="pb-8 knsl-fade">
          <div className="px-4">
            {/* summary chips */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[15px] text-white/45">
              <span><span className="font-display font-bold text-emerald-soft" style={{ fontSize: 19 }}>7</span> fakta</span>
              <span><span className="font-display font-bold text-emerald-soft" style={{ fontSize: 19 }}>4</span> isu</span>
              <span><span className="font-display font-bold text-emerald-soft" style={{ fontSize: 19 }}>6</span> pasal</span>
              <span><span className="font-display font-bold text-emerald-soft" style={{ fontSize: 19 }}>10</span> unsur</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              <GhostButton icon="fileText" tone="muted" className="!py-2.5 !text-[13.5px]">Memo Word</GhostButton>
              <GhostButton icon="penEdit" tone="muted" className="!py-2.5 !text-[13.5px]">Memo PDF</GhostButton>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              <Chip tone="emerald"><Icon name="checkCircle" size={15} /> INVARIAN 14/14</Chip>
            </div>
            <div className="mt-2.5">
              <Chip tone="emerald" className="!text-[12.5px]">KLASIFIKASI: PIDANA &amp; PERDATA</Chip>
            </div>
          </div>

          {/* tabs */}
          <div className="mt-5 flex gap-5 overflow-x-auto px-4 knsl-scroll" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} type="button"
                className="relative whitespace-nowrap pb-3 font-sans text-[16px] transition"
                style={{ fontWeight: tab === t ? 700 : 500, color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                {t}
                {tab === t && <span className="absolute -bottom-px left-0 right-0 h-[2.5px] rounded-full" style={{ background: 'linear-gradient(90deg, #10B981, #D4AF37)' }} />}
              </button>
            ))}
          </div>

          <div className="px-4 pt-4">
            <div className="mb-3 font-sans text-[12px] font-semibold uppercase tracking-[0.16em] text-white/30">
              {tab === 'Fakta' && 'Stage 1 · Fact Extraction'}
              {tab === 'Isu' && 'Stage 2 · Issue Spotting'}
              {tab === 'Pasal' && 'Stage 3 · Statute Mapping'}
              {tab === 'Uji Unsur' && 'Stage 4 · Element Testing'}
              {tab === 'Kesimpulan' && 'Memo · Kesimpulan Hukum'}
            </div>

            <div className="flex flex-col gap-3">
              {tab === 'Fakta' && ANALYSIS_FACTS.map((f) => (
                <Card key={f.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-gold/80">{f.id}</span>
                    <Chip tone="muted" className="!py-1 !text-[11px]">{f.tag}</Chip>
                  </div>
                  <p className="mt-2 font-sans text-[14.5px] leading-snug text-white/85" style={{ textWrap: 'pretty' }}>{f.t}</p>
                </Card>
              ))}
              {tab === 'Isu' && ANALYSIS_ISSUES.map((d, i) => <IssueCard key={i} d={d} />)}
              {tab === 'Pasal' && ANALYSIS_PASAL.map((d, i) => <PasalCard key={i} d={d} />)}
              {tab === 'Uji Unsur' && ANALYSIS_UNSUR.map((p, i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center gap-2.5"><Chip tone="emerald">{p.pasal}</Chip></div>
                  <div className="mt-3 flex flex-col gap-2.5">
                    {p.items.map((it, j) => (
                      <div key={j} className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                          style={it.ok ? { background: 'rgba(16,185,129,0.16)' } : { background: 'rgba(220,120,80,0.12)' }}>
                          <Icon name={it.ok ? 'check' : 'x'} size={12} strokeWidth={3} style={{ color: it.ok ? '#34D399' : '#F0A88C' }} />
                        </span>
                        <div className="flex-1">
                          <span className="font-sans text-[14px] text-white/80">{it.u}</span>
                          {it.note && <div className="mt-0.5 font-sans text-[12px] text-gold/70">{it.note}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
              {tab === 'Kesimpulan' && (
                <Card className="p-5">
                  <Eyebrow>Rekomendasi Hukum</Eyebrow>
                  <p className="mt-3 font-sans text-[14.5px] leading-relaxed text-white/80" style={{ textWrap: 'pretty' }}>
                    Berdasarkan invarian fakta, perbuatan paling kuat memenuhi unsur <span className="font-semibold text-emerald-soft">Pasal 338 KUHP (Pembunuhan)</span> dengan klasifikasi pidana. Unsur "direncanakan terlebih dahulu" belum terpenuhi, sehingga Pasal 340 KUHP belum dapat diterapkan.
                  </p>
                  <p className="mt-3 font-sans text-[14.5px] leading-relaxed text-white/80" style={{ textWrap: 'pretty' }}>
                    Terdapat dimensi keperdataan paralel berupa <span className="font-semibold text-gold">sengketa utang piutang</span> yang dapat ditempuh melalui gugatan PMH (Ps. 1365 KUHPerdata).
                  </p>
                  <div className="mt-4"><PrimaryButton icon="download">Unduh Memo Lengkap</PrimaryButton></div>
                </Card>
              )}
            </div>

            <button onClick={() => setPhase('input')} className="mt-5 inline-flex items-center gap-1.5 font-sans text-[13.5px] font-semibold text-white/45">
              <Icon name="arrowRight" size={15} style={{ transform: 'rotate(180deg)' }} />Analisa perkara baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { AnalysisScreen });
