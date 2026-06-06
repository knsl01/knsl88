# Mengaktifkan AI Counsel di luar Claude (proxy + deploy)

Tombol **AI Counsel** memanggil API Anthropic. Agar aman, API key disimpan di **server** (Netlify Function `netlify/functions/claude.js`), bukan di browser. Karena fungsi server butuh proses build, deploy-nya pakai **Netlify CLI** (satu perintah: build + fungsi + upload sekaligus) — bukan drag-drop biasa.

## Yang perlu disiapkan
1. **Node.js** sudah terpasang (lihat panduan sebelumnya).
2. **API key Anthropic.** Buka https://console.anthropic.com → API Keys → Create Key → salin (formatnya `sk-ant-...`). Catatan: pemakaian API berbayar per token sesuai tagihan akunmu.

## Langkah (di Terminal, dalam folder `deploy`)

```bash
# 1. Pasang dependensi aplikasi (sekali)
npm install

# 2. Pasang Netlify CLI (sekali; di Mac/Linux bila ditolak, tambah: sudo di depan)
npm install -g netlify-cli

# 3. Login Netlify (membuka browser untuk otorisasi)
netlify login

# 4. Build + deploy (fungsi ikut terbundel)
netlify deploy --build --prod
```

Saat perintah ke-4 jalan pertama kali, CLI bertanya:
- "What would you like to do?" → pilih **Create & configure a new project**
- Pilih tim/akunmu, lalu beri nama situs (atau Enter untuk nama acak).

Setelah selesai, kamu dapat **Website URL** (`*.netlify.app`).

```bash
# 5. Simpan API key sebagai environment variable (server-side, aman)
netlify env:set ANTHROPIC_API_KEY "sk-ant-xxxxxxxx"

# (opsional) ganti model tanpa edit kode:
# netlify env:set CLAUDE_MODEL "claude-sonnet-4-20250514"

# 6. Deploy ulang agar fungsi membaca key tadi
netlify deploy --build --prod
```

## Selesai — buka di HP & PC
Buka URL `*.netlify.app` di browser PC dan di Safari iPhone. Di app, **nyalakan toggle "Gunakan AI Counsel"** lalu jalankan tinjauan. Panggilan AI sekarang lewat `/api/claude` → server → Anthropic.

## Cara kerja singkat
- Browser memanggil `/api/claude` (alamat situsmu sendiri) — tidak ada API key di sisi klien.
- `netlify.toml` mengarahkan `/api/claude` ke fungsi `claude.js`.
- Fungsi menambahkan header `x-api-key` dari env var, meneruskan ke Anthropic, mengembalikan jawabannya.
- Bila key belum di-set, fungsi mengembalikan pesan error yang jelas; app otomatis tetap memakai mesin heuristik.

## Catatan keamanan (penting, jujur)
- API key tersimpan di environment variable Netlify (server), **tidak pernah** dikirim ke browser. Bagus.
- Tapi proxy ini **terbuka**: siapa pun yang tahu URL situsmu bisa memicu pemakaian API key-mu (biaya jadi tanggunganmu). Untuk pemakaian pribadi biasanya aman. Bila ingin lebih ketat, dua opsi sederhana:
  1. Jangan sebar URL-nya, dan/atau aktifkan proteksi akses situs di Netlify (mis. password, fitur berbayar).
  2. Minta aku tambahkan cek "kata sandi rahasia" sederhana di fungsi (header yang harus cocok) — aku bisa buatkan.
- Update di masa depan: ubah kode → `netlify deploy --build --prod` lagi.

## Kalau macet
- `netlify: command not found` setelah langkah 2 → tutup lalu buka ulang Terminal, atau jalankan `npx netlify-cli` menggantikan `netlify`.
- AI tidak jalan tapi heuristik iya → cek env var sudah ter-set (`netlify env:list`) dan sudah deploy ulang (langkah 6). Cek juga saldo/limit API di console Anthropic.
- Error model → set `CLAUDE_MODEL` ke model yang tersedia untuk akunmu, lalu deploy ulang.
