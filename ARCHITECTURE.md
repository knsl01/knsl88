# KNSL Legal Intelligence — Architecture

## Why this structure?

The app started as a **single 3,400+ line React file** with ~2 MB of statute data inlined. That pattern breaks down when you add auth, cloud sync, AI providers, and multiple features: merge conflicts explode, bundle parse time grows, and persistence logic gets duplicated.

This redesign separates **concerns by layer** so each part can scale independently.

```
┌─────────────────────────────────────────────────────────────┐
│  Presentation (React)                                         │
│  app/ · components/ · features/                             │
├─────────────────────────────────────────────────────────────┤
│  Application services                                       │
│  services/ (persistence, auth helpers, AI)                  │
├─────────────────────────────────────────────────────────────┤
│  Database / repositories                                    │
│  database/ (Supabase · Vercel API · strategy selection)     │
├─────────────────────────────────────────────────────────────┤
│  Domain engine (no UI)                                      │
│  legal-pipeline/ · data/statutes/                           │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure                                             │
│  config/ · lib/ · api/ (Vercel serverless)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Folder structure

```
src/
├── main.jsx                 # Bootstrap: ErrorBoundary, AuthProvider, AuthGate
├── app/
│   ├── App.jsx              # Shell: layout, routing by tab, user session
│   ├── navigation.js        # Nav items + page titles (single source of truth)
│   └── utils.js             # Shared app helpers (dates, etc.)
├── components/
│   ├── layout/              # Sidebar, Topbar, MobileTabBar
│   └── AiProviderPicker.jsx
├── features/
│   ├── auth/                # Supabase AuthGate, AuthScreen, ProfilePanel
│   │   └── local/           # localStorage auth fallback
│   └── legacy/              # Feature UIs (next: split per feature/)
│       └── KNSLFeatures.jsx # Dashboard, Analysis, Contract, Scan, …
├── contexts/
│   └── AuthContext.jsx      # Supabase session + profile state
├── config/
│   └── env.js               # VITE_* flags, feature toggles
├── database/
│   ├── index.js             # db.caseAnalyses · db.contractReviews
│   ├── providers/           # supabase.js, api.js adapters
│   └── repositories/        # Unified save/list (picks provider)
├── services/
│   ├── ai/                  # agent.js, providers.js
│   ├── api/                 # client.js (JWT backend)
│   ├── auth/                # Auth strategy documentation + helpers
│   └── persistence.js       # persistCaseAnalysis, persistContractReview
├── legal-pipeline/
│   └── engine.js            # 4-stage case analysis (deterministic + AI)
├── data/statutes/
│   └── pasal.json           # 2,781 indexed articles (lazy-loadable)
├── lib/
│   └── supabase.js          # Supabase client singleton
└── theme.jsx                # Global CSS + LogoMark
```

---

## Authentication flow

Three strategies coexist; **only one is active** for login UI:

| Strategy | When | Where |
|----------|------|--------|
| **Supabase** | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set | `AuthGate` → `AuthScreen` → `AuthContext` |
| **Local** | Supabase env missing | `LoginScreen` in `KNSLFeatures` + `localStorage` |
| **Vercel JWT** | Optional; used with local login when `/api/health` OK | `services/api/client.js` |

```
main.jsx
  └── AuthProvider          # Supabase session listener
        └── AuthGate        # If Supabase configured: block until logged in
              └── App.jsx   # If not Supabase: local LoginScreen inside App
```

**Why:** Supabase is the primary cloud auth. Local auth keeps the app usable offline / without backend setup. JWT backend remains for teams that already deployed PostgreSQL on Vercel.

---

## Database layer

UI code must **not** call Supabase or `/api/*` directly for analyses/contracts.

```js
import { db } from "./database/index.js";

await db.caseAnalyses.save({ title, lawFilter, source, aiStatus, payload });
await db.contractReviews.save(record);
```

**Repository** picks provider:

1. Supabase (if configured)
2. Vercel PostgreSQL API (if JWT present)
3. No-op (local-only)

**Why:** Adding a fourth backend (e.g. Firebase) means one new provider file, not edits across every feature screen.

---

## Services layer

| Module | Responsibility |
|--------|----------------|
| `services/persistence.js` | Fire-and-forget save after analysis/contract |
| `services/ai/agent.js` | LLM agents for case + contract |
| `services/ai/providers.js` | Gemini / Groq / Ollama selection |
| `services/api/client.js` | REST + JWT for optional backend |

**Why:** Features depend on **capabilities**, not transport details.

---

## Legal pipeline (domain)

`legal-pipeline/engine.js` is **pure logic** (no React):

- Stage 1–4: facts → issues → statutes → element tests
- `auditPipeline`: 14 invariants
- `aiRunPipeline`: AI stages 1–2, deterministic 3–4

Statute index lives in `data/statutes/pasal.json`.

**Why:** Same engine can power CLI, tests, or server jobs without importing React.

---

## Serverless API (`api/`)

Vercel functions for:

- `/api/ai` — multi-provider LLM proxy
- `/api/auth/*`, `/api/case-analyses`, `/api/contract-reviews` — optional PostgreSQL backend

Unchanged by this refactor; frontend accesses via `services/api` or `database/providers`.

---

## Migration roadmap (next steps)

1. **Split `features/legacy/KNSLFeatures.jsx`** into `features/analysis/`, `features/contract-review/`, etc.
2. **Lazy-load** `pasal.json` and contract-review CDN libs via `import()`.
3. **Unify login UI** — merge `LoginScreen` + `AuthScreen` behind one component.
4. **Wire `legalPipeline.*.ts`** validators into `engine.js` (single invariant source).
5. **Remove `archive/`** duplicates after team confirms no references.

---

## Commands

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
```

See also: `AGENTS.md`, `src/PANDUAN_SUPABASE.md`, `src/PANDUAN_BACKEND.md`.
