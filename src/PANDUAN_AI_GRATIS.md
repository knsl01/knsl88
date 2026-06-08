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

```bash
export GROQ_API_KEY=gsk_...
npm run dev
```

**Deploy Vercel:** tambahkan `GROQ_API_KEY`.

Opsional: `GROQ_MODEL=llama-3.3-70b-versatile`

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
4. Claude (jika `ANTHROPIC_API_KEY` ada)

Tanpa key apa pun, hanya Ollama lokal yang bisa dipakai.

---

## Tanpa AI sama sekali

Matikan toggle AI — **mesin heuristik tetap jalan penuh** (offline, gratis, tanpa API).

---

## Endpoint teknis

- Baru: `POST /api/ai` — body `{ provider, system, user, maxTokens }`
- Legacy: `POST /api/claude` — masih didukung untuk kompatibilitas
