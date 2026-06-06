# Menjalankan KNSL Legal Intelligence di luar Claude

File aplikasimu (`KNSLLegalIntelligence.jsx`) adalah satu komponen React. Untuk pakai sebagai web app sendiri, bungkus dengan Vite lalu deploy. Scaffolding-nya sudah disiapkan di folder ini.

## Yang kamu butuhkan
- **Node.js** (versi 18+). Unduh di https://nodejs.org (pilih LTS). Ini wajib — semua langkah di bawah jalan di Terminal/Command Prompt.

## Langkah (sekali jalan)
1. Taruh `KNSLLegalIntelligence.jsx` ke dalam folder `src/` (di samping `main.jsx`).
2. Buka Terminal di folder ini, lalu:
   ```bash
   npm install        # unduh react, recharts, lucide-react, vite (sekali saja)
   npm run dev         # jalankan lokal → buka http://localhost:5173
   ```
3. Untuk versi siap-upload (web statis):
   ```bash
   npm run build       # hasilnya ada di folder dist/
   npm run preview     # cek hasil build secara lokal
   ```

## Deploy gratis (pilih salah satu)
- **Netlify / Vercel:** drag-and-drop folder `dist/` ke dashboard mereka, atau hubungkan repo GitHub (build command `npm run build`, publish dir `dist`).
- **GitHub Pages:** push `dist/` ke branch `gh-pages`. Kalau URL-nya pakai sub-path (mis. `user.github.io/knsl/`), ubah `vite.config.js` → `base: "/knsl/"` lalu build ulang.

## Dua catatan penting (perbedaan vs di Claude)

### 1. Penyimpanan — sudah beres
`main.jsx` sudah memasang polyfill `window.storage` berbasis **localStorage**, jadi riwayat tinjauan, klausul, dan audit log **tetap tersimpan** di browser walau di luar Claude. Tidak perlu mengedit file aplikasimu. (localStorage tersimpan per-browser/perangkat, bukan di server.)

### 2. AI Counsel (Claude) — perlu langkah tambahan
Tombol "Gunakan AI Counsel" memanggil API Anthropic **tanpa API key** — ini hanya jalan di dalam artifact Claude. Di luar Claude:
- **Tanpa setup apa pun:** matikan toggle AI. Mesin **heuristik** tetap jalan penuh — deteksi & klasifikasi klausul, skor risiko, red flag, poin negosiasi, ekspor DOCX/PDF. Semua offline.
- **Kalau mau AI aktif:** butuh **proxy backend kecil** yang menyimpan API key Anthropic milikmu (mis. fungsi serverless di Netlify/Vercel). Browser memanggil proxy-mu, proxy memanggil Anthropic. **Jangan menaruh API key langsung di kode browser** — key-nya akan bocor dan kena masalah CORS. (Kalau mau, aku bisa buatkan proxy ini.)

## Ringkas
- pdf.js, mammoth, tesseract diambil dari CDN saat jalan → tetap berfungsi di luar Claude (butuh internet sekali muat).
- Heuristik + upload + ekstraksi + laporan: jalan penuh, mandiri.
- AI: opsional, butuh proxy berisi API key sendiri.
