/* screen-drafting.jsx — Smart Drafting Studio: pick doc type -> form -> generate -> live preview */

function DraftingScreen({ onMenu, onBell }) {
  const [phase, setPhase] = React.useState('select'); // select | form | preview
  const [docType, setDocType] = React.useState('Gugatan');
  const [generating, setGenerating] = React.useState(false);
  const [fields, setFields] = React.useState({
    penggugat: 'PT Anugrah Sejahtera',
    tergugat: 'CV Mandala Jaya',
    pokok: 'Wanprestasi atas Perjanjian Jual Beli No. 014/AS/2026',
    nilai: '1.250.000.000',
    pengadilan: 'Pengadilan Negeri Malang',
  });

  const pick = (t) => { setDocType(t); setPhase('form'); };
  const generate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setPhase('preview'); }, 1500);
  };

  const Field = ({ label, k, area }) => (
    <div>
      <label className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-white/40">{label}</label>
      {area ? (
        <textarea value={fields[k]} onChange={(e) => setFields({ ...fields, [k]: e.target.value })} rows={2}
          className="mt-1.5 w-full resize-none rounded-xl px-3.5 py-2.5 font-sans text-[14.5px] text-white/90 outline-none"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)' }} />
      ) : (
        <input value={fields[k]} onChange={(e) => setFields({ ...fields, [k]: e.target.value })}
          className="mt-1.5 w-full rounded-xl px-3.5 py-2.5 font-sans text-[14.5px] text-white/90 outline-none"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.1)' }} />
      )}
    </div>
  );

  return (
    <div className="knsl-fade">
      <ScreenHeader eyebrow="Drafting & Contract Redlining" title="Smart Drafting Studio" onMenu={onMenu} onBell={onBell} />

      {phase === 'select' && (
        <div className="px-4 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card className="p-4">
            <div className="flex items-center gap-2.5">
              <span style={{ color: '#D4AF37' }}><Icon name="sparkles" size={20} /></span>
              <p className="font-sans text-[13.5px] leading-snug text-white/55" style={{ textWrap: 'pretty' }}>
                Pilih jenis dokumen. AI menyusun draf berstruktur sesuai kaidah hukum Indonesia, siap diunduh ke <span className="text-emerald-soft font-semibold">Word</span> atau <span className="text-gold font-semibold">PDF</span>.
              </p>
            </div>
          </Card>
          {DOC_GROUPS.map((g) => (
            <div key={g.group}>
              <SectionLabel className="mb-2.5 px-1">{g.group}</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {g.items.map((it) => (
                  <button key={it} onClick={() => pick(it)} type="button"
                    className="flex items-center gap-2.5 rounded-2xl p-3.5 text-left transition active:scale-[0.97]"
                    style={{ background: 'rgba(255,255,255,0.022)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ color: '#34D399' }}><Icon name="fileText" size={17} /></span>
                    <span className="font-sans text-[13px] font-semibold leading-tight text-white/80">{it}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {phase === 'form' && (
        <div className="px-4 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <button onClick={() => setPhase('select')} className="inline-flex items-center gap-1.5 font-sans text-[13.5px] font-semibold text-white/45">
            <Icon name="arrowRight" size={15} style={{ transform: 'rotate(180deg)' }} />Semua dokumen
          </button>
          <Card className="p-5">
            <Eyebrow>Dokumen Dipilih</Eyebrow>
            <h2 className="mt-2 font-display text-white" style={{ fontSize: 24, fontWeight: 600 }}>{docType}</h2>
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
          <PrimaryButton icon={generating ? null : 'penEdit'} onClick={generate}>
            {generating ? 'Menyusun draf…' : 'Susun Dokumen'}
          </PrimaryButton>
          {generating && (
            <div className="flex items-center justify-center gap-2 font-sans text-[13px] text-white/45">
              <span className="h-2 w-2 rounded-full" style={{ background: '#10B981', animation: 'knslPulse 1s ease-in-out infinite' }} />
              AI menyusun struktur, posita &amp; petitum…
            </div>
          )}
        </div>
      )}

      {phase === 'preview' && (
        <div className="px-4 pb-8 knsl-fade" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="flex items-center justify-between">
            <button onClick={() => setPhase('form')} className="inline-flex items-center gap-1.5 font-sans text-[13.5px] font-semibold text-white/45">
              <Icon name="arrowRight" size={15} style={{ transform: 'rotate(180deg)' }} />Edit data
            </button>
            <Chip tone="emerald"><Icon name="checkCircle" size={14} /> Draf siap</Chip>
          </div>

          {/* paper preview */}
          <div className="rounded-[18px] p-6" style={{ background: 'linear-gradient(180deg, #faf8f2, #f1ede2)', boxShadow: '0 24px 60px -28px rgba(0,0,0,0.85)' }}>
            <div className="text-center font-serif" style={{ color: '#1a1a1a' }}>
              <div className="font-bold uppercase tracking-wide" style={{ fontSize: 15, fontFamily: 'Georgia, serif' }}>Surat Gugatan</div>
              <div className="mt-1 text-[11px] text-black/50" style={{ fontFamily: 'Georgia, serif' }}>{fields.pengadilan}</div>
            </div>
            <div className="my-4 h-px" style={{ background: 'rgba(0,0,0,0.12)' }} />
            <div className="space-y-2.5 text-[11.5px] leading-relaxed" style={{ color: '#2a2a2a', fontFamily: 'Georgia, serif' }}>
              <p>Yang bertanda tangan di bawah ini, kuasa hukum dari <b>{fields.penggugat}</b>, selanjutnya disebut sebagai <b>PENGGUGAT</b>;</p>
              <p>Dengan ini mengajukan gugatan terhadap <b>{fields.tergugat}</b>, selanjutnya disebut sebagai <b>TERGUGAT</b>;</p>
              <p className="font-bold pt-1">DUDUK PERKARA</p>
              <p>Bahwa pokok perkara a quo adalah {fields.pokok}, dengan nilai kerugian materiil sebesar Rp {fields.nilai};</p>
              <p className="font-bold pt-1">PETITUM</p>
              <p>1. Mengabulkan gugatan Penggugat untuk seluruhnya;</p>
              <p>2. Menyatakan Tergugat telah melakukan wanprestasi;</p>
              <p className="text-black/30">…</p>
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

Object.assign(window, { DraftingScreen });
