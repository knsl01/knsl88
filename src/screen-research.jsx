/* screen-research.jsx — Legal Research: search bar + filter chips + pasal results */

function ResearchScreen({ onMenu, onBell }) {
  const [q, setQ] = React.useState('penggelapan');
  const [filter, setFilter] = React.useState('Semua');
  const [searched, setSearched] = React.useState(true);

  return (
    <div className="knsl-fade">
      <ScreenHeader eyebrow="Riset Pasal & Basis UU" title="Legal Research" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"><Icon name="search" size={20} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setSearched(true)}
            placeholder="Cari pasal, kata kunci, atau nomor UU…"
            className="w-full rounded-2xl py-3.5 pl-12 pr-4 font-sans text-[15px] text-white outline-none placeholder:text-white/30"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)' }} />
        </div>

        {/* filters */}
        <div className="flex gap-2.5 overflow-x-auto knsl-scroll pb-1" style={{ marginInline: -16, paddingInline: 16 }}>
          {RESEARCH_FILTERS.map((f) => (
            <Chip key={f} active={filter === f} tone="muted" onClick={() => setFilter(f)} className="!flex-shrink-0">{f}</Chip>
          ))}
        </div>

        {searched && (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="font-sans text-[13px] text-white/45">
                <span className="font-display font-bold text-emerald-soft" style={{ fontSize: 17 }}>24</span> hasil untuk "<span className="text-white/70">{q}</span>"
              </span>
              <span className="inline-flex items-center gap-1.5 font-sans text-[12.5px] font-semibold text-gold/80">
                <Icon name="sparkles" size={14} /> Diurutkan AI
              </span>
            </div>

            {/* AI summary card */}
            <Card className="overflow-hidden p-4" style={{ border: '1px solid rgba(212,175,55,0.22)' }}>
              <div className="flex items-center gap-2">
                <span style={{ color: '#D4AF37' }}><Icon name="sparkles" size={17} /></span>
                <Eyebrow>Ringkasan AI</Eyebrow>
              </div>
              <p className="mt-2.5 font-sans text-[14px] leading-relaxed text-white/75" style={{ textWrap: 'pretty' }}>
                Penggelapan diatur dalam <span className="font-semibold text-emerald-soft">Pasal 372–375 KUHP</span> (kini Ps. 486–489 KUHP 2023). Inti unsurnya: penguasaan barang <span className="italic">bukan</span> karena kejahatan, lalu dimiliki secara melawan hukum. Bentuk diperberat: penggelapan dalam jabatan (Ps. 374).
              </p>
            </Card>

            <div className="flex flex-col gap-3">
              {RESEARCH_RESULTS.map((r, i) => (
                <Card key={i} className="p-4 transition active:scale-[0.99]">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Chip tone="emerald">{r.code}</Chip>
                      <span className="font-display text-white" style={{ fontSize: 20, fontWeight: 600 }}>Pasal {r.no}</span>
                    </div>
                    <span className="font-sans text-[12px] font-bold" style={{ color: r.match === 100 ? '#34D399' : '#E7CE7A' }}>{r.match}%</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/45">{r.title}</span>
                    <span className="font-mono text-[10px] text-gold/55">· {r.mirror}</span>
                  </div>
                  <p className="mt-2.5 font-sans text-[14px] leading-relaxed text-white/65" style={{ textWrap: 'pretty' }}>{r.body}</p>
                  <div className="mt-3 flex items-center gap-4">
                    <button className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-emerald-soft"><Icon name="book" size={15} />Baca penuh</button>
                    <button className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-white/45"><Icon name="plus" size={15} />Simpan</button>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ResearchScreen });
