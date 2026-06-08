# AGENTS.md

## Cursor Cloud specific instructions

### Product overview

KNSL Legal Intelligence is a client-side React SPA (Vite) for Indonesian legal practice. There is no database or Docker stack — persistence is `localStorage`, and auth is client-side (`knsl:auth`).

### Required services

| Service | Command | URL |
|---------|---------|-----|
| Vite dev server | `npm run dev` | http://localhost:5173 |

Run the dev server in a tmux session so it stays alive across commands.

### Standard commands

See `package.json` and `src/CARA_DEPLOY.md`:

- **Install deps:** `npm install`
- **Dev server:** `npm run dev`
- **Production build:** `npm run build` → output in `dist/`
- **Preview build:** `npm run preview` → http://localhost:4173

### Linting

No ESLint or other lint script is configured in this repo. Use `npm run build` as the primary static check for the React app.

### Pipeline unit tests (optional, not in npm scripts)

TypeScript invariant tests live in `src/legalPipeline.*.ts`. Run with:

```bash
npx --yes tsx src/legalPipeline.fixtures.test.ts
```

Expected: **9 passed, 0 failed**. Do not add `typescript`/`ts-node` to `package.json` unless the project adopts them officially — `tsx` via `npx` works with the repo's `"type": "module"` setting.

### Optional: AI Counsel proxy

The `/api/claude` Vercel serverless function (`api/claude.js`) requires `ANTHROPIC_API_KEY` and `vercel dev` (or a Vercel deploy). The heuristic engine works fully without it — disable the AI toggle in Contract Review / analysis flows.

### CDN dependencies

Tailwind, pdf.js, mammoth, tesseract.js, and other libs load from CDNs at runtime. Internet access is required for full document-scanning and export features; the app shell and heuristic analysis work offline after first load.

### Hello-world verification

1. `npm run dev` → open http://localhost:5173
2. Register/login (any username/password; stored in `localStorage`)
3. Open **Legal Analysis Engine** → click **Jalankan Analisa** on the sample case
4. Confirm tabs **Fakta**, **Isu**, **Pasal**, **Uji Unsur**, **Kesimpulan** populate
