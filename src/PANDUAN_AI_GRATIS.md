# AI Agent Gratis — Tanpa Claude Berbayar

Agen AI KNSL mendukung **beberapa provider**. Claude (Anthropic) berbayar, tapi ada opsi **gratis** yang cukup bagus untuk analisa kasus & tinjauan kontrak.

## Opsi gratis (disarankan)

| Provider | Biaya | Kualitas | Setup |
|----------|-------|----------|-------|
| **Google Gemini** | Gratis (kuota harian) | Sangat bagus | API key di [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| **Groq (Llama)** | Gratis (rate limit) | Cepat, bagus | API key di [console.groq.com](https://console.groq.com/keys) |
| **Ollama** | 100% gratis | Bagus (tergantung model) | Install lokal, tanpa API key |

Di UI, pilih provider di dropdown **Provider AI** (muncul saat toggle AI aktif). Default: **Otomatis (gratis dulu)**.

---

## 1. Google Gemini (paling mudah, cloud gratis)

```bash
# Dev lokal
export GEMINI_API_KEY=AIza...
npm run dev
```

**Deploy Vercel:** Settings → Environment Variables → `GEMINI_API_KEY` → Redeploy.

Opsional: `GEMINI_MODEL=gemini-2.0-flash`

---

## 2. Groq (gratis, sangat cepat)

Dua cara memberi key ke dev server:

```bash
# Cara A — export di shell yang sama sebelum menjalankan dev
export GROQ_API_KEY=gsk_...
npm run dev
```

```bash
# Cara B — file .env.local (disarankan, otomatis ke-load)
echo 'GROQ_API_KEY=gsk_...' >> .env.local
npm run dev   # restart jika sudah jalan
```

> Penting: simpan key sebagai `GROQ_API_KEY` (bukan `VITE_GROQ_API_KEY`). Key dibaca di sisi server (`/api/ai`), bukan di browser. File `.env.local` sudah masuk `.gitignore`.

Cek koneksi cepat (setelah `npm run dev`):

```bash
curl -s http://localhost:5173/api/ai            # "groq" harus configured: true
curl -s -X POST http://localhost:5173/api/ai \
  -H "Content-Type: application/json" \
  -d '{"provider":"groq","user":"Halo","maxTokens":20}'
```

**Deploy Vercel:** tambahkan `GROQ_API_KEY` di Environment Variables lalu **redeploy** (bukan hanya save).

Opsional:
- `GROQ_MODEL=llama-3.3-70b-versatile` (model default; ganti bila ingin model lain)
- `GROQ_BASE_URL=https://api.groq.com/openai/v1` (override endpoint untuk gateway/proxy Groq-compatible)

Di dropdown **Provider AI** pilih **Groq (Llama)** agar selalu pakai Groq (mode Otomatis mendahulukan Gemini bila key Gemini juga ada).

---

## 3. Ollama (100% gratis, offline, di komputer sendiri)

```bash
# Install Ollama dari https://ollama.com
ollama pull llama3.2
ollama serve   # biasanya sudah jalan otomatis

# Di terminal lain
npm run dev
```

Di UI pilih **Ollama (lokal)**. Tidak perlu API key.

Opsional env: `OLLAMA_MODEL=qwen2.5:7b` (lebih pintar untuk teks Indonesia)

---

## Mode Otomatis

Jika memilih **Otomatis**, server mencoba urutan:

1. Gemini (jika `GEMINI_API_KEY` ada)
2. Groq (jika `GROQ_API_KEY` ada)
3. Ollama (lokal)

Claude tidak dipakai otomatis karena berbayar; pilih Claude eksplisit bila memang memasang `ANTHROPIC_API_KEY`.

Tanpa key apa pun, hanya Ollama lokal yang bisa dipakai di dev. Di Vercel/knsl.tech, set minimal `GEMINI_API_KEY` atau `GROQ_API_KEY`.

---

## Hardening endpoint `/api/ai`

Endpoint AI membaca key server, jadi batasi akses produksi:

- `AI_ALLOWED_ORIGINS=https://knsl.tech,https://www.knsl.tech` — origin browser yang diizinkan. Tambahkan domain preview bila perlu.
- `AI_RATE_LIMIT_MAX=60` dan `AI_RATE_LIMIT_WINDOW_MS=60000` — rate limit per IP per window.
- `AI_MAX_BODY_BYTES=8388608` — batas payload, terutama untuk OCR Vision berbasis gambar.

Request tanpa header `Origin` tetap diizinkan untuk health check/server-to-server. Localhost selalu diizinkan untuk development.

---

## Tanpa AI sama sekali

Matikan toggle AI — **mesin heuristik tetap jalan penuh** (offline, gratis, tanpa API).

---

## Endpoint teknis

- Baru: `POST /api/ai` — body `{ provider, system, user, maxTokens, responseFormat, images }`
- Legacy: `POST /api/claude` — masih didukung untuk kompatibilitas
