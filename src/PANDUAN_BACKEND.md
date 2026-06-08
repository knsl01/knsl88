# Panduan Backend KNSL

Backend nyata untuk auth, penyimpanan analisa kasus & tinjauan kontrak, dan audit log.

## Arsitektur

```
Browser (React) ──JWT──▶ Vercel Serverless (/api/*) ──▶ PostgreSQL (Neon/Supabase)
                              │
                              └──▶ Gemini/Groq (proxy AI, terpisah)
```

## Setup Vercel (production)

### 1. Database PostgreSQL gratis

Buat database di salah satu:

- [Neon](https://neon.tech) (disarankan)
- [Supabase](https://supabase.com) → Settings → Database → connection string

### 2. Environment Variables di Vercel

| Variable | Wajib | Contoh |
|----------|-------|--------|
| `DATABASE_URL` | ✅ | `postgresql://user:pass@host/db?sslmode=require` |
| `JWT_SECRET` | ✅ | string acak min 16 karakter |
| `GEMINI_API_KEY` | opsional | untuk AI |
| `GROQ_API_KEY` | opsional | fallback AI gratis |
| `MIGRATE_SECRET` | opsional | sama dengan JWT_SECRET untuk migrasi |

### 3. Migrasi schema (sekali)

Setelah deploy pertama:

```bash
curl -X POST https://URL-ANDA.vercel.app/api/db/migrate \
  -H "Authorization: Bearer JWT_SECRET_ANDA"
```

### 4. Cek health

```bash
curl https://URL-ANDA.vercel.app/api/health
```

Harus: `"database": "connected"`

---

## Endpoint API

| Method | Path | Auth | Fungsi |
|--------|------|------|--------|
| GET | `/api/health` | — | Status backend & DB |
| POST | `/api/auth/register` | — | Daftar akun |
| POST | `/api/auth/login` | — | Login → JWT |
| GET | `/api/auth/me` | JWT | Profil user |
| GET/POST | `/api/case-analyses` | JWT | List / simpan analisa kasus |
| GET/DELETE | `/api/case-analyses/:id` | JWT | Detail / hapus |
| GET/POST | `/api/contract-reviews` | JWT | List / simpan tinjauan kontrak |
| GET/DELETE | `/api/contract-reviews/:id` | JWT | Detail / hapus |
| GET | `/api/audit` | JWT admin/partner | Audit log |
| POST | `/api/db/migrate` | Bearer secret | Jalankan schema SQL |

Header auth: `Authorization: Bearer <token>`

---

## Perilaku di aplikasi

- Jika `DATABASE_URL` terhubung → layar login menampilkan **「Backend aktif」**
- Register/login lewat server (bcrypt + JWT)
- Setiap analisa kasus & tinjauan kontrak otomatis **disinkronkan ke server** setelah login
- Tanpa backend → fallback mode lama (localStorage saja)

---

## Dev lokal

```bash
# .env.local
DATABASE_URL=postgresql://...
JWT_SECRET=dev-secret-min-16-chars
GEMINI_API_KEY=...

npm install
npm run dev
```

Migrasi lokal:

```bash
curl -X POST http://localhost:5173/api/db/migrate \
  -H "Authorization: Bearer dev-secret-min-16-chars"
```
