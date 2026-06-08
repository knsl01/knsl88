# AGENTS.md — KNSL Legal Intelligence

## Stack

- **Frontend**: React 18 + Vite (entry `src/main.jsx` → `src/app/App.jsx`)
- **Architecture**: See `ARCHITECTURE.md` for folder layout and layers
- **Auth**: Supabase when `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set; else local login
- **AI**: `/api/ai` proxy (Gemini/Groq/Ollama) — see `src/PANDUAN_AI_GRATIS.md`
- **Optional backend**: Vercel serverless + PostgreSQL — see `src/PANDUAN_BACKEND.md`
- **Supabase**: see `src/PANDUAN_SUPABASE.md`

## Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev` (port 5173) |
| Build | `npm run build` |
| Preview | `npm run preview` |

## Cursor Cloud specific instructions

- Run `npm install` on startup (update script).
- Dev server: `npm run dev` — no Docker required for frontend-only work.
- Supabase auth is optional; without env vars the app falls back to local auth.
- For full auth + cloud sync testing, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets and run SQL migration from `supabase/migrations/`.
- AI features need `GEMINI_API_KEY` or `GROQ_API_KEY` on the deployment host for `/api/ai`.
