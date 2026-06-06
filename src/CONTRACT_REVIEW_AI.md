# Contract Review AI — Modul Baru KNSL Legal Intelligence

Modul ini **ditambahkan ke dalam dashboard yang sudah ada** (`KNSLLegalIntelligence.jsx`) — bukan aplikasi baru. Ia memakai sistem desain, navigasi, routing, komponen (`Badge`, `glass`, `btn-primary`, gauge `recharts`), dan infrastruktur ekspor (Word blob + iframe print) yang sama persis.

## Satu hal penting soal arsitektur (jujur)

Dashboard KNSL adalah **artifact React sisi-klien tunggal** — tidak ada backend, database server, autentikasi server, atau penyimpanan terenkripsi. README aslinya menegaskan ini: *"a single self-contained React component."* Karena itu permintaan "ikuti authentication / permissions / database architecture yang ada" tidak bisa dipenuhi secara harfiah: **arsitektur itu belum ada.**

Yang saya lakukan: implementasi penuh & berfungsi untuk segala yang bisa dijalankan sungguh-sungguh di sisi klien, dan spesifikasi backend (schema, endpoint, RBAC, enkripsi, audit) sebagai **jalur produksi server** yang terpisah dan jujur — bukan backend palsu yang ditempel seolah tersambung.

| Kebutuhan | Status di artifact klien | Catatan |
|---|---|---|
| Upload (drag-drop, progress, validasi) | ✅ Nyata | PDF/DOCX/TXT, maks 25 MB |
| Ekstraksi teks | ✅ Nyata | TXT (FileReader), DOCX (mammoth), PDF (pdf.js dari CDN) |
| OCR fallback (PDF pindaian) | ✅ Best-effort | tesseract.js dari CDN, dibatasi 20 hal; butuh jaringan |
| Deteksi & klasifikasi klausul | ✅ Nyata | 15 tipe; penomoran Pasal/Article/numeric + heading KAPITAL; fallback paragraf |
| Review klausul AI | ✅ Nyata | Claude via in-artifact API (batch 4 klausul) + **fallback heuristik deterministik** |
| Risk engine (skor/kategori/red flag/negosiasi) | ✅ Nyata | Skor 0–100 berbobot per tipe klausul |
| Dashboard review (ringkasan, klausul, bendera) | ✅ Nyata | Tab Ringkasan / Klausul / Bendera + gauge risiko |
| Laporan DOCX & PDF | ✅ Nyata | Memo A4 ber-styling, reuse infra ekspor yang ada |
| Penyimpanan (kontrak, klausul, riwayat, laporan) | ✅ Nyata (klien) | `window.storage` (persist antar-sesi) + fallback in-memory |
| Audit log | ✅ Nyata (klien) | append-only di `cr:audit` (upload/ocr/analyze/delete) |
| Autentikasi, RBAC, enkripsi at-rest | ⚠️ Hanya server | Tidak bisa dijamin di artifact klien — lihat "Jalur Server" |

## Cara pakai
Sidebar → **Contract Review AI**. Tarik/lepas atau klik untuk unggah (atau tempel teks). Pilih perspektif tinjauan (default: *Pihak pemasok (supplier)* — sesuai konteks review kontrak suplai beton Anda), aktifkan/matikan **AI Counsel**, lalu **Tinjau Kontrak**. Heuristik selalu jalan dulu (hasil instan); bila AI aktif & API tersedia, hasil diperkaya per-klausul dan otomatis fallback ke heuristik bila gagal. Ekspor **DOCX/PDF**, riwayat tersimpan otomatis.

## Verifikasi
- Bundle esbuild penuh atas dashboard yang sudah dipatch: **bersih** (~1,99 MB ESM).
- Uji runtime mesin pada kontrak suplai contoh: 7 klausul terdeteksi & terklasifikasi benar; skor 67 = *Risiko Tinggi*; tanggung-jawab-tanpa-batas & pengakhiran-sepihak tertangkap sebagai red flag; laporan HTML 0 string `undefined`.
- Fallback: teks tanpa penomoran → split paragraf; input kosong → 0 klausul (UI menampilkan pesan, tidak crash).

---

## Jalur Server (referensi — bila pindah ke backend nyata)

Untuk autentikasi nyata, RBAC, enkripsi at-rest, retensi multi-pengguna, dan audit yang tak bisa dirusak klien, berikut spesifikasi yang disarankan. Ini **bukan** bagian dari artifact klien.

### Database (PostgreSQL)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,            -- argon2id
  role TEXT NOT NULL DEFAULT 'reviewer',  -- admin|partner|reviewer|viewer
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES users(id),
  filename TEXT NOT NULL,
  mime TEXT NOT NULL,
  bytes BIGINT NOT NULL,
  storage_key TEXT NOT NULL,              -- S3 object key (SSE-KMS)
  text_sha256 TEXT NOT NULL,
  perspective TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  ordinal INT NOT NULL,
  number TEXT, heading TEXT, type TEXT NOT NULL,
  body TEXT NOT NULL
);
CREATE TABLE clause_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_id UUID REFERENCES clauses(id) ON DELETE CASCADE,
  risk TEXT NOT NULL,                     -- high|med|low
  summary TEXT, legal_concern TEXT, commercial_concern TEXT,
  missing JSONB, improvements JSONB,
  source TEXT NOT NULL,                   -- ai|heuristic
  model TEXT
);
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
  score INT, category TEXT,
  red_flags JSONB, negotiation JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  format TEXT NOT NULL,                   -- pdf|docx
  storage_key TEXT NOT NULL
);
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  action TEXT NOT NULL, target TEXT,
  ip INET, meta JSONB,
  at TIMESTAMPTZ DEFAULT now()
);
```

### Endpoint API (REST)
```
POST   /api/auth/login                 → JWT (akses + refresh)
POST   /api/contracts                  → multipart upload, kembalikan {id}
GET    /api/contracts                  → daftar (difilter per role/owner)
GET    /api/contracts/:id              → metadata + status ekstraksi
POST   /api/contracts/:id/extract      → ekstraksi teks (+OCR async via worker queue)
POST   /api/contracts/:id/analyze      → jalankan clause-detect + review + risk
GET    /api/contracts/:id/analysis     → hasil analisa terbaru
POST   /api/contracts/:id/report?fmt=pdf|docx → generate & simpan laporan
GET    /api/reports/:id                → unduh (signed URL, kedaluwarsa)
DELETE /api/contracts/:id              → soft-delete + catat audit
GET    /api/audit                      → admin/partner saja
```

### Keamanan
- **AuthN:** JWT akses berumur pendek + refresh token httpOnly; password argon2id.
- **AuthZ (RBAC):** `admin` (semua), `partner` (semua kontrak firma + audit), `reviewer` (CRUD kontrak miliknya), `viewer` (baca-saja). Tegakkan di middleware per-endpoint + row-level checks.
- **Enkripsi:** TLS in-transit; S3 SSE-KMS / kolom sensitif via pgcrypto at-rest; kunci di KMS.
- **Audit:** setiap mutasi menulis `audit_log` (append-only, tabel ke WORM/log sink terpisah).
- **AI:** panggilan model dari server (kunci API tak pernah ke klien); redaksi PII opsional sebelum dikirim ke model; simpan `model` + hash prompt untuk ketertelusuran.

### Tes (server)
- Unit: clause splitter & classifier (fixtures kontrak EN/ID), risk scoring (snapshot skor), report builder (0 `undefined`).
- Integrasi: alur upload→extract→analyze→report; RBAC (viewer ditolak menulis, reviewer tak lihat kontrak orang lain); audit tercatat untuk tiap aksi.
- E2E: PDF teks, PDF pindaian (jalur OCR), DOCX, file rusak/oversize ditolak.

> Disclaimer melekat di UI & laporan: alat triase otomatis — **bukan nasihat hukum, bukan vonis**, tidak menggantikan pertimbangan advokat.
