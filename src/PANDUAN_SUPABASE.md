# Panduan Supabase Auth — KNSL Legal Intelligence

Aplikasi memakai **Supabase Auth** untuk signup, login, lupa password, sesi persisten, dan profil pengguna. Data analisa kasus & review kontrak tersimpan per akun di PostgreSQL (RLS).

## 1. Buat project Supabase

1. Buka [https://supabase.com/dashboard](https://supabase.com/dashboard) → **New project**.
2. Catat **Project URL** dan **anon public** key (Settings → API).

## 2. Jalankan migrasi SQL

Di **SQL Editor**, jalankan **berurutan**:

1. `supabase/migrations/20240608000000_auth_profiles_data.sql`
2. `supabase/migrations/20240608120000_rls_production.sql`

Migrasi pertama: `profiles`, `case_analyses`, `contract_reviews`, `audit_log`, trigger profil.

Migrasi kedua (production RLS): `projects`, `documents`, `conversations`, `messages`, `usage_tracking`, kebijakan RLS granular, dan hardening anti akses lintas user.

Penjelasan keamanan lengkap: `supabase/SECURITY.md`

## 3. Konfigurasi Auth

**Authentication → Providers → Email**

- Aktifkan Email.
- (Opsional) Matikan "Confirm email" untuk development cepat.

**Authentication → URL Configuration**

- **Site URL**: URL produksi Anda (mis. `https://knsl88.vercel.app`).
- **Redirect URLs**: tambahkan URL yang sama + `http://localhost:5173` untuk dev.

Reset password mengarah ke halaman yang sama; hash `#type=recovery` dibaca otomatis oleh `AuthScreen`.

## 4. Environment variables

### Lokal (`.env`)

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Salin dari `.env.example`, lalu `npm run dev`.

### Vercel

Project → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `VITE_SUPABASE_URL` | Project URL |
| `VITE_SUPABASE_ANON_KEY` | anon public key |

Redeploy setelah menambah variabel.

## 5. Perilaku aplikasi

| Supabase dikonfigurasi? | Auth |
|-------------------------|------|
| Ya (`VITE_SUPABASE_*`) | Login Supabase via `AuthGate` |
| Tidak | Login lokal (localStorage) seperti sebelumnya |

Fitur:

- **Daftar** — email + password; profil dibuat via trigger DB.
- **Masuk** — sesi disimpan di `localStorage`, auto-refresh token.
- **Lupa password** — email reset dari Supabase.
- **Profil** — menu sidebar **Profil Akun** (nama, firma, telepon, ubah password).
- **Cloud sync** — setelah analisa kasus / review kontrak, data disimpan ke Supabase jika sudah login.

## 6. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Layar login terus | Cek env `VITE_SUPABASE_*`, redeploy, hard refresh |
| Email konfirmasi tidak datang | Cek spam; atau nonaktifkan confirm di dashboard |
| Reset password gagal | Pastikan redirect URL ada di Supabase |
| Simpan analisa gagal | Pastikan migrasi SQL sudah dijalankan; cek RLS & login |

Service role key **jangan** dipakai di frontend — hanya anon key.
