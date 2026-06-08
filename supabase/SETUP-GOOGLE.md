# Setup login Google (Gmail) — KNSL

Aplikasi KNSL sudah punya tombol **Masuk dengan Google**. Yang perlu Anda lakukan: aktifkan provider di **Supabase** + buat **OAuth Client** di Google Cloud.

Lebih mudah daripada SMS/Twilio — tidak perlu nomor HP trial.

---

## Ringkasan alur

```
User klik "Masuk dengan Google" di knsl.tech/login
    → redirect ke Google (pilih akun Gmail)
    → kembali ke knsl.tech/login
    → otomatis masuk dashboard
```

---

## Prasyarat

- [ ] SQL KNSL sudah dijalankan (`JALANKAN-SEMUA.sql` atau migrasi OAuth/phone)
- [ ] Vercel sudah punya `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`
- [ ] Supabase → **URL Configuration** sudah diisi:
  - **Site URL:** `https://knsl.tech`
  - **Redirect URLs:** `https://knsl.tech/**` dan `http://localhost:5173/**`

---

## Bagian A — Google Cloud Console (~10 menit)

### 1. Buat / pilih project

1. Buka https://console.cloud.google.com
2. Pilih project lama atau **New Project** (misalnya `KNSL Legal`)

### 2. OAuth consent screen (wajib)

Google sekarang pakai menu **Google Auth Platform** (UI baru). Jika tidak ketemu "Scopes" di wizard — **boleh dilewati**; Supabase otomatis minta `email`, `profile`, `openid` saat login.

#### 2a. Setup dasar (wizard)

1. Buka https://console.cloud.google.com → pilih project KNSL
2. Menu ☰ → **Google Auth Platform** (atau **APIs & Services** → **OAuth consent screen** di UI lama)
3. Jika muncul **Get started** → klik, lalu isi:
   - **App name:** `KNSL Legal Intelligence`
   - **User support email:** email Gmail Anda
   - **Developer contact:** email Anda
4. **Audience** → pilih **External** → Continue
5. Halaman **Scopes** / **Data Access** di wizard:
   - **Tidak ketemu scope?** Klik **Save and Continue** saja (lewati) — ini normal di UI baru
6. **Test users** (wajib saat status *Testing*):
   - Menu **Google Auth Platform** → **Audience**
   - **Test users** → **Add users** → masukkan Gmail Anda → **Save**
   - Tanpa ini: *"Access blocked: app has not completed verification"*

#### 2b. (Opsional) Tambah scope manual — hanya jika mau

Jika ingin menambah scope sendiri (biasanya **tidak wajib** untuk login Supabase):

1. **Google Auth Platform** → **Data Access**
2. **Add or Remove Scopes**
3. Di kotak **Filter**, ketik `userinfo` → centang:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
4. Atau di bagian bawah **Manually add scopes**, paste satu per baris:
   ```
   https://www.googleapis.com/auth/userinfo.email
   https://www.googleapis.com/auth/userinfo.profile
   openid
   ```
5. Klik **Update** → **Save**

> Status **Testing** cukup untuk development (maks ~100 test user). Untuk publik luas, nanti ajukan **Publish app**.

### 3. Buat OAuth Client ID

1. **APIs & Services** → **Credentials**
2. **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `KNSL Supabase Auth`
5. **Authorized JavaScript origins** — tambahkan:

   | Origin |
   |--------|
   | `https://knsl.tech` |
   | `http://localhost:5173` |

6. **Authorized redirect URIs** — **jangan tebak**, salin dari Supabase (Bagian B langkah 2):

   ```
   https://<project-ref>.supabase.co/auth/v1/callback
   ```

   Ganti `<project-ref>` dengan ID project Supabase Anda (terlihat di Project URL).

7. **Create** → salin **Client ID** dan **Client Secret**

---

## Bagian B — Supabase (~3 menit)

### 1. Aktifkan Google provider

1. https://supabase.com → project KNSL
2. **Authentication** → **Providers** → **Google**
3. **Enable Google** = ON

### 2. Salin Callback URL

Di halaman provider Google, Supabase menampilkan **Callback URL (for OAuth)**.

Contoh:
```
https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

Paste URL ini ke **Authorized redirect URIs** di Google (Bagian A langkah 3).

### 3. Isi kredensial Google

| Field Supabase | Isi |
|----------------|-----|
| Client ID | dari Google Cloud |
| Client Secret | dari Google Cloud |

Klik **Save**.

### 4. (Opsional) Skip nonce check

Biarkan **OFF** kecuali ada error khusus di mobile native app.

---

## Bagian C — Tes

1. Buka https://knsl.tech/login
2. Klik **Masuk dengan Google**
3. Pilih akun Gmail (harus ada di **Test users** jika app masih Testing)
4. Setuju izin → kembali ke situs → masuk dashboard

Cek hasil:

- Supabase → **Authentication** → **Users** (user baru dengan provider `google`)
- **Table Editor** → **profiles** (nama & foto dari Google)

---

## ERROR umum

| Gejala / pesan | Solusi |
|----------------|--------|
| `redirect_uri_mismatch` | Redirect URI di Google **harus persis** sama dengan Callback URL Supabase (`…/auth/v1/callback`) |
| Access blocked / app not verified | Tambahkan Gmail Anda di OAuth consent screen → **Test users** |
| Kembali ke login tapi tidak masuk | Cek Redirect URLs Supabase: `https://knsl.tech/**` |
| Tombol Google tidak muncul | Vercel belum punya `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` → redeploy |
| `OAuth` / provider error | Google provider belum Enable atau Client ID/Secret salah |
| Error 403 Google | Consent screen belum selesai atau scope kurang |

---

## Dev lokal

File `.env` di root:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

```bash
npm run dev
```

Buka http://localhost:5173/login → tombol Google sama seperti production.

---

## Setelah Google jalan

Login **nomor HP (SMS)** bisa disetup nanti — lihat `SETUP-NOMOR-HP.md`.

Selesai Google + Save di Supabase → login Gmail di knsl.tech langsung bisa dipakai.
