/* screen-tools.jsx — Pindai Dokumen (OCR), Contract Review AI, Conflict Check */

function UploadZone({ label, hint, icon = 'upload' }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[22px] py-10 text-center"
      style={{ border: '1.5px dashed rgba(255,255,255,0.16)', background: 'rgba(255,255,255,0.018)' }}>
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ color: '#34D399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)' }}>
        <Icon name={icon} size={28} />
      </span>
      <div className="mt-4 font-sans text-[15.5px] font-semibold text-white/85">{label}</div>
      <div className="mt-1 font-sans text-[13px] text-white/40">{hint}</div>
    </div>
  );
}

// ── Pindai Dokumen (OCR) ────────────────────────────────────
function ScanScreen({ onMenu, onBell }) {
  const [done, setDone] = React.useState(false);
  return (
    <div className="knsl-fade">
      <ScreenHeader eyebrow="Digitalkan Dokumen → PDF / Word" title="Pindai Dokumen" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card className="p-4">
          <p className="font-sans text-[13.5px] leading-snug text-white/55" style={{ textWrap: 'pretty' }}>
            Foto atau unggah dokumen fisik — putusan, akta, kontrak lama. OCR mengubahnya menjadi teks <span className="text-emerald-soft font-semibold">PDF / Word</span> yang dapat dicari &amp; diedit.
          </p>
        </Card>

        {!done ? (
          <>
            <UploadZone label="Unggah berkas dokumen" hint="PDF, JPG, atau PNG · maks 25 MB" icon="upload" />
            <div className="grid grid-cols-2 gap-3">
              <GhostButton icon="camera" tone="muted">Ambil Foto</GhostButton>
              <GhostButton icon="image" tone="muted">Dari Galeri</GhostButton>
            </div>
            <PrimaryButton icon="scan" onClick={() => setDone(true)}>Pindai &amp; Konversi</PrimaryButton>
          </>
        ) : (
          <div className="knsl-fade flex flex-col gap-3">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: '#34D399', background: 'rgba(16,185,129,0.12)' }}><Icon name="checkCircle" size={22} /></span>
                <div>
                  <div className="font-sans text-[15px] font-bold text-white">Konversi selesai</div>
                  <div className="font-sans text-[12.5px] text-white/40">Putusan_PN_Malang_2026.pdf · 8 hal · 99,2% akurasi</div>
                </div>
              </div>
              <div className="mt-4 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="font-mono text-[12.5px] leading-relaxed text-white/55">
                  <span className="text-gold/70">PUTUSAN</span> Nomor 214/Pid.B/2026/PN.Mlg — "DEMI KEADILAN BERDASARKAN KETUHANAN YANG MAHA ESA". Pengadilan Negeri Malang yang memeriksa dan mengadili perkara pidana…
                </div>
              </div>
            </Card>
            <div className="grid grid-cols-2 gap-3">
              <GhostButton icon="download" tone="muted">Unduh Word</GhostButton>
              <GhostButton icon="download" tone="gold">Unduh PDF</GhostButton>
            </div>
            <button onClick={() => setDone(false)} className="font-sans text-[13.5px] font-semibold text-white/45 self-start inline-flex items-center gap-1.5">
              <Icon name="plus" size={15} />Pindai dokumen lain
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Contract Review AI ──────────────────────────────────────
const CLAUSES = [
  { sev: 'High', tag: 'Pembatasan Tanggung Jawab', t: 'Klausul 9.2 membatasi ganti rugi hanya pada nilai 1 bulan kontrak — sangat merugikan klien.', sug: 'Naikkan cap menjadi 12 bulan atau hapus pembatasan untuk pelanggaran berat.' },
  { sev: 'High', tag: 'Hukum yang Berlaku', t: 'Klausul 14 menunjuk yurisdiksi Singapura — biaya beracara tinggi bagi klien domestik.', sug: 'Ubah ke pengadilan / arbitrase (BANI) Indonesia.' },
  { sev: 'Medium', tag: 'Pengakhiran', t: 'Klausul 11 memungkinkan pihak lawan mengakhiri sepihak dengan notifikasi 7 hari.', sug: 'Setarakan menjadi 30 hari & syarat material breach.' },
  { sev: 'Low', tag: 'Definisi', t: 'Istilah "Kerahasiaan" tidak terdefinisi pada Klausul 1.', sug: 'Tambahkan definisi eksplisit.' },
];

function ContractScreen({ onMenu, onBell }) {
  const [analyzed, setAnalyzed] = React.useState(false);
  const sevTone = { High: { c: '#F0A88C', b: 'rgba(220,120,80,0.4)', bg: 'rgba(220,120,80,0.07)' }, Medium: { c: '#E7CE7A', b: 'rgba(212,175,55,0.4)', bg: 'rgba(212,175,55,0.07)' }, Low: { c: '#34D399', b: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.06)' } };
  return (
    <div className="knsl-fade">
      <ScreenHeader eyebrow="Tinjauan Kontrak — Klausul, Risiko" title="Contract Review AI" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!analyzed ? (
          <>
            <Card className="p-4">
              <p className="font-sans text-[13.5px] leading-snug text-white/55" style={{ textWrap: 'pretty' }}>
                Unggah kontrak. AI memetakan setiap klausul, menandai <span className="text-gold font-semibold">risiko</span>, dan mengusulkan <span className="text-emerald-soft font-semibold">redline</span> demi kepentingan klien.
              </p>
            </Card>
            <UploadZone label="Unggah kontrak untuk ditinjau" hint="PDF atau DOCX · maks 25 MB" icon="fileSearch" />
            <PrimaryButton icon="sparkles" onClick={() => setAnalyzed(true)}>Tinjau Kontrak</PrimaryButton>
          </>
        ) : (
          <div className="knsl-fade flex flex-col gap-3.5">
            {/* risk score */}
            <Card glow className="p-5" style={{ border: '1px solid rgba(212,175,55,0.22)' }}>
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ background: 'conic-gradient(#D4AF37 0% 62%, rgba(255,255,255,0.07) 62% 100%)' }}>
                  <div className="flex h-[60px] w-[60px] flex-col items-center justify-center rounded-full" style={{ background: '#0E0E0E' }}>
                    <span className="font-display font-bold text-gold" style={{ fontSize: 22, lineHeight: 1 }}>62</span>
                    <span className="font-sans text-[9px] text-white/40">/100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <Eyebrow>Skor Risiko Kontrak</Eyebrow>
                  <div className="mt-1 font-display text-white" style={{ fontSize: 19, fontWeight: 600 }}>Risiko Sedang–Tinggi</div>
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
            {CLAUSES.map((c, i) => {
              const t = sevTone[c.sev];
              return (
                <Card key={i} className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.1em] text-white/45">{c.tag}</span>
                    <span className="rounded-full px-2.5 py-1 font-sans text-[11px] font-bold" style={{ color: t.c, border: '1px solid ' + t.b, background: t.bg }}>{c.sev}</span>
                  </div>
                  <p className="mt-2 font-sans text-[14px] leading-snug text-white/80" style={{ textWrap: 'pretty' }}>{c.t}</p>
                  <div className="mt-3 flex items-start gap-2 rounded-xl p-3" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.16)' }}>
                    <span className="mt-0.5" style={{ color: '#34D399' }}><Icon name="sparkles" size={15} /></span>
                    <span className="font-sans text-[13px] leading-snug text-white/70" style={{ textWrap: 'pretty' }}><span className="font-semibold text-emerald-soft">Saran: </span>{c.sug}</span>
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

// ── Conflict Check ──────────────────────────────────────────
function ConflictScreen({ onMenu, onBell }) {
  const [name, setName] = React.useState('CV Mandala Jaya');
  const [checked, setChecked] = React.useState(false);
  return (
    <div className="knsl-fade">
      <ScreenHeader eyebrow="Benturan Kepentingan" title="Conflict Check" onMenu={onMenu} onBell={onBell} />
      <div className="px-4 pb-8" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card className="p-4">
          <p className="font-sans text-[13.5px] leading-snug text-white/55" style={{ textWrap: 'pretty' }}>
            Periksa benturan kepentingan terhadap basis data klien, lawan, &amp; pihak terkait sebelum menerima perkara baru.
          </p>
        </Card>
        <div>
          <label className="font-sans text-[12px] font-semibold uppercase tracking-[0.1em] text-white/40">Nama pihak / entitas</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-2xl px-4 py-3.5 font-sans text-[15px] text-white outline-none"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.12)' }} />
        </div>
        <PrimaryButton icon="shield" onClick={() => setChecked(true)}>Periksa Benturan</PrimaryButton>

        {checked && (
          <div className="knsl-fade flex flex-col gap-3">
            <Card className="p-4" style={{ border: '1px solid rgba(212,175,55,0.28)' }}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ color: '#D4AF37', background: 'rgba(212,175,55,0.12)' }}><Icon name="alert" size={22} /></span>
                <div>
                  <div className="font-sans text-[15px] font-bold text-gold">1 potensi benturan</div>
                  <div className="font-sans text-[12.5px] text-white/45">Tinjau sebelum melanjutkan</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-sans text-[14.5px] font-bold text-white">{name}</span>
                <Chip tone="gold">Pihak lawan aktif</Chip>
              </div>
              <p className="mt-2 font-sans text-[13px] leading-snug text-white/55" style={{ textWrap: 'pretty' }}>
                Terdaftar sebagai <span className="text-gold">tergugat</span> dalam perkara aktif <span className="font-mono text-[12px] text-white/70">PERK-2026-014</span> (PT Anugrah Sejahtera). Mewakili entitas ini berpotensi benturan langsung.
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2.5">
                <span style={{ color: '#34D399' }}><Icon name="checkCircle" size={18} /></span>
                <span className="font-sans text-[14px] text-white/70">Tidak ada benturan dengan direktur / afiliasi terdaftar.</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { ScanScreen, ContractScreen, ConflictScreen });
