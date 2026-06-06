# KNSL Legal Intelligence

A client-side Indonesian legal-reasoning system. A typed, test-backed **4-stage pipeline contract** drives a luxury **React dashboard** that turns a free-text case chronology (*kronologi*) into a traceable analysis — facts → issues → statutes → element testing — and exports a printable legal memo. It pronounces **no verdict**, by design and by enforcement.

```
RawCaseInput ─▶ Stage 1 Fakta ─▶ Stage 2 Isu ─▶ Stage 3 Pasal ─▶ Stage 4 Uji Unsur ─▶ Memo
               FactMatrix        IssueSet        RetrievalSet      ElementTestReport
```

---

## The three invariants

Every stage is governed by three constraints. The TypeScript layer enforces *shape*; the validators enforce *value*; the dashboard now surfaces both, live.

1. **Traceability** — every derived claim (issue, retrieved statute, element test) carries non-empty `factIds` pointing back to real facts. Nothing is asserted without a source.
2. **Uncertainty propagation** — a claim may never be *more* certain than its least-certain source fact. `diduga` (alleged) stays alleged; it cannot silently harden into `asserted`. Scale: `uncertain=0 < alleged=1 < asserted=2`.
3. **Stage isolation** — raw input reaches Stage 1 only; statutes may not appear in facts or issues; Stage 4 reports *support levels*, never a guilt finding.

---

## Repository layout

```
KNSLLegalIntelligence.jsx     ← the dashboard (centerpiece, runnable artifact)
README.md                     ← this file
pipeline/
  legalPipeline.types.ts          the contract — Stage shapes + Traceable/UncertaintyAware
  legalPipeline.validators.ts     runtime invariant checks (THROW on violation)
  legalPipeline.compile-negatives.ts   @ts-expect-error fixtures: compiler-level guarantees
  legalPipeline.fixtures.test.ts  framework-agnostic suite (1 positive + 8 negative)
  package.json · tsconfig.json    strict TS toolchain
  TEST_OUTPUT.txt                 captured green run (typecheck + 9/9 tests)
```

---

## Running the pipeline tests

```bash
cd pipeline
npm install                 # typescript + ts-node + @types/node
npx tsc --noEmit            # compile-level guarantees (compile-negatives must fire)
npx ts-node src/legalPipeline.fixtures.test.ts   # runtime invariants — exits non-zero on failure
```

Verified result (see `TEST_OUTPUT.txt`): **typecheck passes**, **9/9 runtime tests pass** on Node v22 / TypeScript 5.6. The compile-negatives confirm traceability and stage-isolation are caught by the *compiler*, not just at runtime; the runtime negatives confirm `ISSUE_NO_TRACE`, `STATUTE_NO_TRACE`, `UNCERTAINTY_RAISED`, `STATUTE_IN_ISSUE`, `VERDICT_LEAK`, `RETRIEVAL_OVERFLOW`, and `EXTERNAL_LABEL_LEAK` all throw as designed.

---

## What changed in this upgrade

The four TypeScript files defined and tested the contract — but the dashboard never imported them. It ran a weaker home-grown 4-check array, one of which was hardcoded `{ name: "Stage 4 tidak menghasilkan vonis", ok: true }`. The badge said "Guards 4/4" without earning it. That gap is now closed.

1. **The real validators are wired into the live UI.** `auditPipeline()` is a faithful, *non-throwing* port of `legalPipeline.validators.ts` — same logic, same error codes (`DUP_FACT`, `ISSUE_NO_TRACE`, `UNCERTAINTY_RAISED`, `STATUTE_IN_ISSUE`, `RETRIEVAL_OVERFLOW`, `STATUTE_NO_TRACE`, `ELEMENT_BAD_STATUTE/FACT/MISSING`, `VERDICT_LEAK`, `EXTERNAL_LABEL_LEAK`). It returns a structured report instead of throwing, so the dashboard can show *which* of the 14 invariants held. The badge now reads **Invarian 14/14** and is clickable to reveal the full audit panel.
2. **The verdict-leak check is now real.** The hardcoded `ok: true` is gone. Stage 4 element text and notes are scanned against the same `VERDICT_RE` the validators use. Tampering tests confirm injecting "terbukti memenuhi seluruh unsur" flips `VERDICT_LEAK` to fail.
3. **Traceability is surfaced.** The *Uji Unsur* tab — previously hiding fact links — now shows `dukung / kontra / hilang` fact IDs under every element. The architecture's core promise is visible, not merely internal.
4. **Printable case memo.** A new **Memo Word / Memo PDF** export reuses the drafting print infrastructure to produce an A4 *Memorandum Analisa Hukum*: fact matrix, issues, retrieved statutes, element testing with full fact traceability, the invariant audit table (`14/14 lulus`), and an explicit *bukan vonis* disclaimer.
5. **Everything else preserved.** The emerald/champagne-on-void aesthetic, Cormorant + Hanken type, glassmorphism, the embedded KUHP / UU PT 40/2007 / UUD 1945 statute index, the old→2023 KUHP article mapping, Surat Kuasa generator, research, and conflict-of-interest scan are untouched.

### Verification of the upgrade
- The patched dashboard bundles cleanly (esbuild, JSX automatic runtime, all imports resolve).
- On the demo *pembunuhan* scenario the live engine yields 7 facts / 4 issues / 6 statutes / 10 element tests, **audit 14/14**, with **10/10 element tests carrying traceability**, and a verdict-free memo.
- A negative harness tampers each stage and confirms the live audit flags the matching code — `ISSUE_NO_TRACE`, `UNCERTAINTY_RAISED`, `STATUTE_IN_ISSUE`, `RETRIEVAL_OVERFLOW`, `VERDICT_LEAK`, `ELEMENT_BAD_STATUTE` — so the audit has teeth, not decoration.

---

## Using the dashboard

`KNSLLegalIntelligence.jsx` is a single self-contained React component (deps: `react`, `lucide-react`, `recharts`). Open the **Analitik** view, paste a chronology (or pick a sample scenario), and run. Click **Invarian 14/14** to inspect the audit; open **Uji Unsur** to see fact-level traceability; use **Memo Word / Memo PDF** to export.

> The system is a deterministic heuristic engine for triage and structuring, with traceable reasoning at every step. It is **not a verdict** and not a substitute for an advocate's judgment.

---

## Pembaruan Fase 2 — 7 UU baru ditambahkan ke basis data

Dataset `PASAL[]` diperluas dari ±781 pasal (KUHP, UU PT 40/2007, UUD 1945) menjadi **2.781 pasal** dengan menambahkan seluruh pasal dari 7 undang-undang yang diunggah (diekstrak otomatis dari PDF via `pdftotext`, lalu dibersihkan dari artefak halaman dan dipotong sebelum bagian Penjelasan):

| Undang-Undang | Label | Jumlah Pasal |
|---|---|---|
| UU 37/2004 — Kepailitan & PKPU | `UU Pailit` | 308 |
| UU 11/2008 — ITE | `ITE '08` | 54 |
| UU 1/2024 — Perubahan Kedua ITE | `ITE '24` | 20 |
| UU 30/1999 — Arbitrase & APS | `Arbitrase` | 82 |
| UU 20/2025 — KUHAP | `KUHAP` | 351 |
| UU 4/2023 — P2SK | `P2SK` | 418 |
| Rv — Reglemen Acara Perdata | `RV` | 767 |

### Yang ikut dikabelkan ke mesin penalaran
- **Filter pencarian & analisa** kini punya famili baru: Pailit/PKPU, Siber/ITE, Niaga (Arbitrase & P2SK), Hukum Acara (KUHAP & Rv) — di dropdown view Analisa dan tombol view Riset.
- **Pemicu isu (OFFENSES)**: kronologi yang menyebut kepailitan/PKPU, konten elektronik/judi online/ujaran, atau klausula arbitrase otomatis memunculkan isu + menarik pasal terkait di pipeline.
- **Klasifikasi domain, label, dan warna** tiap UU dibedakan (mis. ITE→pidana, Pailit/Arbitrase/P2SK→komersial).
- **ID pasal unik per-UU** (`lawSlug`) agar tidak bentrok antar-UU yang punya nomor pasal sama.

Teks tiap pasal dibatasi ±1.200 karakter agar artefak tetap ringan (~1,85 MB) dan pencarian tetap responsif. Sumber UU bersifat domain publik. Diverifikasi: bundling esbuild bersih, dan uji pencarian nyata (kepailitan, ITE, arbitrase, KUHAP) mengembalikan pasal yang benar pada tiap filter.

## Logo terpasang
Emblem seal (timbangan keadilan) kini jadi komponen `LogoMark` SVG inline di sidebar dashboard (menggantikan ikon Gavel), tajam di segala ukuran tanpa menambah berat berkas. Berkas logo terpisah (PNG/JPG) tetap tersedia untuk header/branding eksternal.

## Smart Drafting diperluas — 11 generator dokumen
Modul drafting kini berbasis *template registry* (1 form generik + 1 builder HTML murni per dokumen). Jenis dokumen:

**Litigasi:** Gugatan · Jawaban Gugatan (Eksepsi + Pokok Perkara) · Somasi · Surat Kuasa (Litigasi/Korporasi/Pengurusan)
**Kontrak:** NDA · Perjanjian Kerja (PKWT/PKWTT) · PKS · Kontrak Vendor (Barang/Jasa) · MoU · Term Sheet
**Advisory:** Legal Opinion

Tiap dokumen punya skema field sendiri (teks/area/select/angka, dengan field kondisional via `when`), data contoh siap-pakai, pratinjau langsung di kertas, dan ekspor Word (.doc) + Cetak/PDF. Builder berupa fungsi murni yang menghasilkan HTML terstruktur (komparisi para pihak, pasal-pasal bernomor, petitum, blok tanda tangan + meterai). 

**Verifikasi:** ke-11 builder diuji di Node dengan data default → 0 error, 0 string `undefined`; bundel esbuild penuh bersih tanpa error.

### +3 dokumen (total 14)
Ditambahkan: **Kontrak Sewa** (12 pasal), **Perjanjian Jual Beli** (10 pasal, termasuk jaminan penjual bebas sengketa + peralihan hak/risiko), dan **Akta Perdamaian** (dading; mengacu Pasal 1851–1864 KUHPerdata & Pasal 130 HIR untuk penguatan putusan perdamaian, dilengkapi blok saksi). Semua diuji di Node → 0 error/`undefined`; bundel esbuild bersih.

### +2 dokumen (total 16) + rujukan pasal otomatis
- **Addendum / Amandemen** — mengubah perjanjian pokok (rujuk judul/nomor/tanggalnya), pasal Perubahan + klausul "ketentuan lain tetap berlaku" + berlaku efektif.
- **Perjanjian Pinjaman (Utang-Piutang)** — jumlah & terbilang, bunga (atau tanpa bunga), jangka & cara bayar, jaminan (atau merujuk Pasal 1131 KUHPerdata bila tanpa jaminan), denda, pelunasan dipercepat, blok saksi.
- **Rujukan pasal otomatis (opt-in)** pada **Gugatan, Jawaban, dan Legal Opinion**: jika diaktifkan, dokumen menyisipkan blok "RUJUKAN PASAL TERKAIT" berisi pasal paling relevan dari basis data KNSL (via mesin `searchPasal`), dengan disclaimer "rujukan awal — periksa kembali". Aman secara default (mati), dan tetap mengembalikan dokumen valid bila mesin tak tersedia.

Verifikasi: 16/16 builder lolos uji Node (0 error/`undefined`); jalur auto-cite diuji dengan engine nyata (menarik pasal benar); bundel esbuild bersih.

### Auto-cite cerdas + pemilih pasal manual
- **Routing kata-kunci → UU** (`CITE_RULES`): query diarahkan ke keluarga UU yang tepat — siber→ITE, pailit→UU 37/2004, arbitrase/niaga→UU 30/1999 & P2SK, pidana→KUHP, acara→KUHAP/Rv, korporasi→UU PT — dengan fallback "all".
- **Mini-dataset KUHPerdata** (`KUHPER`, Pasal 1131–1851 inti) + `PERDATA_RE`: query wanprestasi/perjanjian/jual beli/perdamaian kini bisa menyitir Pasal KUHPerdata yang relevan meski tak ada di dataset UU utama.
- **Pemilih pasal manual**: kotak "Sisipkan Pasal (manual)" di tiap dokumen — cari pasal, klik untuk menambah (chip), tersisip sebagai blok "RUJUKAN PASAL" di akhir dokumen.
- Auto-cite & manual memakai satu set helper (`_citeItems`/`_citeLi`) agar konsisten. Diuji: routing mengembalikan UU yang benar untuk tiap domain; bundel esbuild bersih.
