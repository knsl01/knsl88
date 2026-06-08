# Setup login nomor HP (OTP SMS) — KNSL

Aplikasi KNSL sudah siap di kode. Yang perlu Anda lakukan: **aktifkan Phone di Supabase** + **hubungkan Twilio** (pengirim SMS).

---

## Ringkasan alur

```
User ketik 0812… di knsl.tech/login
    → Supabase kirim SMS OTP via Twilio
    → User ketik kode 6 digit
    → Masuk ke dashboard
```

---

## Bagian A — Supabase (5 menit)

1. Login https://supabase.com → pilih project KNSL
2. Menu kiri: **Authentication**
3. Sub-menu: **Sign In / Providers** (atau **Providers**)
4. Cari **Phone** → klik untuk buka
5. Aktifkan:
   - **Enable Phone provider** = ON
   - **Enable phone confirmations** = ON (jika ada)
6. **Jangan Save dulu** — isi Twilio di Bagian B, baru Save

---

## Bagian B — Twilio (akun pengirim SMS)

### 1. Buat akun Twilio

1. Buka https://www.twilio.com/try-twilio → daftar (gratis trial)
2. Verifikasi email & nomor HP Anda sendiri

### 2. Buat Verify Service (disarankan)

1. Twilio Console → cari **Verify** (menu atau search)
2. **Create Service** → beri nama misalnya `KNSL Login`
3. Channel: centang **SMS**
4. **Create**
5. Salin **Service SID** (awalan `VA…`)

### 3. Ambil kredensial Twilio

Di Twilio Console → **Account Dashboard**:

| Field di Supabase | Ambil dari Twilio |
|-------------------|-------------------|
| Account SID | Account SID (awalan `AC…`) |
| Auth Token | Auth Token (klik Show) |
| Verify Service SID | Dari Verify Service tadi (`VA…`) |

### 4. Isi di Supabase

Kembali ke Supabase → **Authentication** → **Providers** → **Phone**:

| Pengaturan | Nilai |
|------------|--------|
| SMS provider | **Twilio Verify** |
| Twilio Account SID | paste `AC…` |
| Twilio Auth Token | paste token |
| Twilio Verify Service SID | paste `VA…` |

Klik **Save**.

### 5. Trial Twilio — penting untuk Indonesia

Akun **trial** hanya bisa kirim SMS ke nomor yang **sudah diverifikasi** di Twilio:

1. Twilio Console → **Phone Numbers** → **Verified Caller IDs**
2. **Add** → masukkan nomor HP Anda (`+62812…`)
3. Twilio kirim kode verifikasi → selesaikan

Untuk production (semua nomor Indonesia): upgrade akun Twilio berbayar + aktifkan pengiriman ke **Indonesia** di Geo permissions.

---

## Bagian C — URL (kalau belum)

**Authentication** → **URL Configuration**

- Site URL: `https://knsl.tech`
- Redirect URLs: `https://knsl.tech/**`

---

## Bagian D — Tes di website

1. Buka https://knsl.tech/login
2. Tab **Nomor HP**
3. Ketik nomor (contoh `081234567890`) — aplikasi otomatis ubah ke `+6281234567890`
4. **Kirim kode OTP**
5. Cek SMS → masukkan 6 digit → **Verifikasi & masuk**

Cek hasil:

- Supabase → **Authentication** → **Users** (user baru muncul)
- **Table Editor** → **profiles** (ada nama & nomor)

---

## ERROR TERUS saat kirim SMS? (Twilio Try/Trial)

Ikuti **semua** poin ini — trial Twilio sangat ketat:

### ✅ Checklist wajib (trial)

1. **Nomor yang Anda tes HARUS sama persis** dengan yang diverifikasi di Twilio  
   - Twilio Console → **Phone Numbers** → **Verified Caller IDs** → **Add**  
   - Masukkan `+62812xxxxxxx` (format internasional, bukan `0812` saja)  
   - Selesaikan verifikasi Twilio ke HP Anda  

2. **Aktifkan Indonesia di Geo Permissions**  
   - Twilio Console → **Messaging** → **Settings** → **Geo permissions**  
   - Cari **Indonesia** → centang **Allow** → Save  
   - Tanpa ini, SMS ke +62 sering gagal dengan error 21608  

3. **Provider di Supabase harus cocok dengan Twilio**  

   | Di Supabase (SMS provider) | Yang diisi |
   |----------------------------|------------|
   | **Twilio Verify** ← disarankan | Account SID + Auth Token + **Verify Service SID** (`VA…`) |
   | Twilio (bukan Verify) | Account SID + Auth Token + **Messaging Service SID** (`MG…`) |

   Salah pilih provider = error terus.

4. **Tanpa spasi** saat paste SID/Token di Supabase → **Save**

5. **Tunggu 60 detik** antar percobaan kirim OTP (rate limit)

6. Cek log error asli: Supabase → **Authentication** → **Logs** (atau **Logs** → Auth)

---

### Error umum

| Pesan / gejala | Solusi |
|----------------|--------|
| SMS tidak masuk | Trial: nomor harus di **Verified Caller IDs** + Geo **Indonesia** ON |
| Error 21608 / Geo | Aktifkan Indonesia di Twilio Geo permissions |
| `sms_send_failed` | SID/Token salah atau provider Twilio/Verify tidak cocok |
| `Unsupported phone provider` | Phone provider belum Save / Twilio belum diisi |
| `Signups not allowed` | Aktifkan Phone provider & phone signups |
| Kode expired | OTP ~60 detik; minta **Kirim ulang** |
| Format nomor salah | Pakai `08…` atau `+62…` |
| Trial unverified number | Hanya nomor yang sudah diverifikasi di Twilio yang bisa terima SMS |

---

## Biaya (perkiraan)

- Supabase: auth phone termasuk plan (cek kuota SMS di dashboard)
- Twilio: bayar per SMS (trial ada kredit gratis)

---

Selesai setup Twilio + Save di Supabase → login HP di knsl.tech langsung bisa dipakai.
