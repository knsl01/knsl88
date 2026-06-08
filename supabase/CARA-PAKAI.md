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

---

Selesai. Buka situs → daftar/masuk → data per akun terisolasi (RLS).

**Lokal:** buat file `.env` di root project:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Lalu `npm run dev`.
