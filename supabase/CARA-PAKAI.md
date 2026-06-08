# Supabase — cara pasang (5 menit)

## 1. Buat project

1. Buka https://supabase.com → login → **New project**
2. Tunggu sampai status project **Active**

## 2. Jalankan SQL (copy–paste, Run)

1. Di dashboard Supabase, klik **SQL Editor** (menu kiri)
2. Klik **New query**
3. Buka file ini di GitHub/repo Anda:  
   `supabase/JALANKAN-SEMUA.sql`
4. **Select all → Copy → Paste** ke SQL Editor
5. Klik **Run** (atau Ctrl+Enter)
6. Harus muncul **Success** (hijau)

> Sudah pernah jalankan migrasi lama? File ini aman di-run lagi (pakai `IF NOT EXISTS` / `DROP POLICY IF EXISTS`).

## 3. Ambil kunci API

1. **Settings** → **API**
2. Copy:
   - **Project URL**
   - **anon public** key (bukan `service_role`)

## 4. Pasang di Vercel

1. Project Vercel → **Settings** → **Environment Variables**
2. Tambah:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

3. **Redeploy** (Deployments → ⋯ → Redeploy)

## 5. Auth URL (sekali saja)

**Authentication** → **URL Configuration**

- **Site URL:** `https://knsl.tech` (atau domain Anda)
- **Redirect URLs:** tambahkan `https://knsl.tech/**` dan `http://localhost:5173/**`

## 6. Login Google (Gmail)

1. **Authentication** → **Providers** → **Google** → aktifkan
2. Buat OAuth Client di [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
   - Tipe: **Web application**
   - **Authorized redirect URI:** salin dari Supabase (biasanya `https://<project-ref>.supabase.co/auth/v1/callback`)
3. Paste **Client ID** dan **Client Secret** ke Supabase → Save

Di aplikasi, tombol **Masuk dengan Google** akan redirect ke Google lalu kembali ke `/login`.

## 7. Login nomor telepon (OTP SMS)

1. **Authentication** → **Providers** → **Phone** → aktifkan
2. Hubungkan penyedia SMS (wajib untuk production):
   - **Twilio** atau **MessageBird** di Supabase → Phone settings
3. Untuk uji cepat, Supabase bisa pakai **test OTP** (dashboard) — hanya development

Di aplikasi: tab **Nomor HP** → masukkan `0812…` → terima SMS → masukkan kode OTP.

> Jalankan ulang `supabase/JALANKAN-SEMUA.sql` (atau migrasi `20240609120000_oauth_phone_profiles.sql`) agar profil user Google/HP tersimpan benar.

---

Selesai. Buka situs → daftar/masuk (email, Google, atau HP) → data per akun terisolasi (RLS).

---

## Data login — apa yang bisa Anda lihat?

| Data | Bisa? | Di mana |
|------|-------|---------|
| Email, nama, waktu daftar | ✅ | Supabase → **Authentication** → **Users** |
| Terakhir login | ✅ | Kolom *Last sign in* di Users |
| Jenis HP / merek | ❌ | Tidak otomatis |
| Lokasi GPS | ❌ | Tidak otomatis |
| IP / kota | ⚠️ | Supabase **Logs** (terbatas, plan berbayar) atau analytics server |

Aplikasi **tidak** menyimpan merek HP atau lokasi user secara default — itu normal untuk privasi (UU PDP).

Kalau perlu log device (user agent) saat login, bisa ditambahkan nanti ke tabel `audit_log` — beri tahu jika mau.

**Lokal:** buat file `.env` di root project:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Lalu `npm run dev`.
