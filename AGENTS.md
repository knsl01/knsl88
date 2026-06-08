# AGENTS.md — KNSL Legal Intelligence

## Stack

- **Frontend**: React 18 + Vite (`src/KNSLLegalIntelligence.jsx`, entry `src/main.jsx`)
- **Routing**: React Router v6 — `src/routes/AppRoutes.jsx`, `ProtectedRoute`, `GuestRoute`
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

## Routes

| Path | Access | Purpose |
|------|--------|---------|
| `/login`, `/signup`, `/forgot-password` | Guest only | Auth pages |
| `/reset-password` | Recovery flow | New password after email link |
| `/dashboard`, `/workspace`, `/settings`, `/app` | Protected | Workspace shell (URL-synced) |
| `/app/:section` | Protected | Drafting, contract, scan, `chat`, etc. |

Unauthenticated users hitting protected paths → `/login` (with `state.from` for return URL). Logged-in users hitting guest paths → `/app`.

## Cursor Cloud specific instructions

- Run `npm install` on startup (update script).
- Dev server: `npm run dev` — no Docker required for frontend-only work.
- Supabase auth is optional; without env vars the app falls back to local auth.
- For full auth + cloud sync testing, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` secrets and run both SQL migrations in `supabase/migrations/` (see `supabase/SECURITY.md`).
- AI features need `GEMINI_API_KEY` or `GROQ_API_KEY` on the deployment host for `/api/ai`.
