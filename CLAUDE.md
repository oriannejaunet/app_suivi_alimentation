# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Run everything from the repo root (npm workspaces: `backend`, `frontend`).

```bash
npm install                          # install all workspaces
npm run dev                          # backend (:3000) + frontend (:5173) together, via concurrently
npm run test                         # backend tests (vitest)

# backend only
npm run dev -w backend               # nodemon src/index.js
npm run test -w backend              # vitest run
npx vitest run tests/calorie.service.test.js -w backend   # single test file
cd backend && npx prisma migrate dev --name <name>         # create + apply a migration after editing schema.prisma
cd backend && npx prisma studio                             # inspect the SQLite db

# frontend only
npm run dev -w frontend              # vite dev server
npm run build -w frontend            # production build to frontend/dist
```

`backend/.env` (gitignored, `.env.example` has the shape) needs `DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_ORIGIN`.

### Network note for this environment

Outbound HTTPS from this sandbox only works through the corporate proxy, and only
`HTTP_PROXY`/`http_proxy` tend to be set (not `HTTPS_PROXY`). Plain `curl`/`git` to
external hosts will hang/timeout unless the proxy is passed explicitly. The backend's
own outbound calls to Open Food Facts already handle this — see `dispatcher` in
`backend/src/services/openFoodFacts.service.js`, which builds an `undici.ProxyAgent`
from `HTTPS_PROXY || https_proxy || HTTP_PROXY || http_proxy`. For ad hoc shell
commands (`curl`, `git push`), pass `-x http://<proxy-host>:<port>` / configure
`git config http.proxy` explicitly, and give DNS resolution ~15-20s — it's slow here,
not broken.

## Architecture

Two independent apps in one npm-workspaces repo, no shared code between them.

**Backend** (`backend/src`) — Express + Prisma/SQLite, layered `routes -> controllers -> services`:
- `routes/*.routes.js` mount under `/api/<name>` in `app.js` and own request validation (zod schemas defined inline per route file) plus `requireAuth` middleware.
- `controllers/*.controller.js` talk to Prisma directly and to the services layer; they contain no business math.
- `services/calorie.service.js` and `services/foodMapper.js` are the two places with actual logic, kept as **pure functions** (no I/O) specifically so they're unit-testable — see `backend/tests/`. Any change to BMR/TDEE/macro-target formulas or the Open Food Facts JSON mapping belongs here, not in a controller.
- `services/openFoodFacts.service.js` is the only place that calls the outside world. It caches lookups in the `FoodCache` table (30-day staleness window) and retries transient failures once before throwing `HttpError(503, ...)`.
- Auth is a JWT in an **httpOnly cookie** (`utils/jwt.js`), not a bearer token — `requireAuth` reads it via `cookie-parser` and sets `req.userId`. `GET /api/auth/me` is how the frontend restores a session on load, since JS can't read the cookie itself.

**Data model** (`backend/prisma/schema.prisma`): `User` holds both auth fields and the onboarding questionnaire (`heightCm`, `weightKg`, `activityLevel`, `goal`, `goalRateKcal`, `onboarded`). `FoodLog` rows store **computed absolute** calories/macros at the time they were logged (not a live reference to `FoodCache`/`CustomFood`), so a food's nutrition data changing later doesn't rewrite history. `logDate` is a `"YYYY-MM-DD"` string (not `DateTime`) computed client-side, so "today's log" is a plain string-equality filter immune to server/client timezone drift. `WeightLog` is `@@unique([userId, logDate])` (upsert-by-day); logging a weigh-in also re-syncs `User.weightKg` to whichever `WeightLog` row is chronologically latest (not simply the one just written — see `weight.controller.js`), so a retroactive past-dated entry can't clobber a more recent weight.

**Calorie/macro math** (`calorie.service.js`): Mifflin-St Jeor BMR → TDEE (activity multiplier) → target (`TDEE + goalRateKcal`, where `goalRateKcal` is a signed daily delta the frontend sets from the onboarding "goal" choice). Macro targets are derived from `weightKg` (g/kg protein, by goal) and a fat-percent-of-calories split, with carbs as the remainder — see `PROTEIN_G_PER_KG_BY_GOAL` / `FAT_PERCENT_BY_GOAL`. `stats.controller.js`'s `getHistory` applies the user's **current** target uniformly across the requested day range (no historized profile snapshots), which is a known simplification.

**Frontend** (`frontend/src`) — React Router (declarative mode) + Tailwind, mobile-first:
- `context/AuthContext.jsx` calls `GET /api/auth/me` on mount; `components/common/ProtectedRoute.jsx` redirects to `/login` or `/onboarding` based on `user` / `user.onboarded`.
- `api/client.js` is a single axios instance (`withCredentials: true`, `baseURL: /api`); `vite.config.js` proxies `/api` to `localhost:3000` in dev, so frontend and backend are effectively same-origin locally. In production `backend/src/app.js` serves `frontend/dist` statically for the same reason (avoids CORS/cross-site-cookie handling entirely).
- Route structure lives in `App.jsx`; tabs in `components/layout/BottomNav.jsx` must stay in sync with it.
- The scan flow (`pages/ScanPage.jsx`) has two tabs backed by different data sources that funnel into the same `QuantityEntryModal`: camera barcode via `components/scan/BarcodeScanner.jsx` (`@zxing/browser`, requires a secure context — HTTPS or `localhost` — for `getUserMedia`) and free-text search via `components/scan/FoodSearch.jsx` (`GET /api/food/search`, which merges the user's own `CustomFood` rows with Open Food Facts results — custom foods first, tagged `isCustom`). `components/scan/CustomFoodForm.jsx` lets a user persist a food Open Food Facts doesn't have.
- Charts in `components/history/` (`WeightChart.jsx`, `CaloriesChart.jsx`) are hand-rolled inline SVG, not a charting library — deliberate, to keep the bundle small for two simple visualizations. Colors are pulled from a validated dataviz palette (categorical blue for the single-series weight line; status green/amber for on-target/over-target calorie bars), hardcoded as hex rather than Tailwind classes since SVG fill/stroke need literal values.

## Known gaps worth knowing before touching related code

- No dark mode anywhere in the frontend (fixed light Tailwind classes throughout).
- `npm run test` only covers the backend's pure-logic services (`calorie.service`, `foodMapper`); there are no frontend tests and no integration/e2e tests.
- `frontend` build emits a single ~650-700KB JS chunk (Vite warns about this) — no code-splitting has been set up.
