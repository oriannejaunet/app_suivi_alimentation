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
npm run test -w backend              # vitest run (unit + integration)
npm run test -w backend -- tests/calorie.service.test.js   # single test file
npm run test -w backend -- tests/integration               # integration tests only
cd backend && npx prisma migrate dev --name <name>         # create + apply a migration after editing schema.prisma
cd backend && npx prisma studio                             # inspect the SQLite db

# frontend only
npm run dev -w frontend              # vite dev server
npm run build -w frontend            # production build to frontend/dist

# docker (single production-like container on :3000)
cp .env.docker.example .env          # JWT_SECRET only; the rest is set in docker-compose.yml
docker compose up -d --build
docker compose down -v               # -v also drops the SQLite volume
```

The Docker image is the production path, not a second architecture: it builds `frontend/dist` and runs the backend with `NODE_ENV=production` so Express serves it — same single-origin setup as a real deploy. The SQLite file lives on the named volume `db` at `/data/app.db`, so `docker-entrypoint.sh` runs `prisma migrate deploy` on every start rather than at build time. `node_modules` is copied wholesale from the build stage because the `prisma` CLI needed by that migration step is a devDependency and must stay version-locked to `@prisma/client`.

`backend/.env` (gitignored, `.env.example` has the shape) needs `DATABASE_URL`, `JWT_SECRET`, `PORT`, `FRONTEND_ORIGIN`, `NODE_ENV`. `NODE_ENV` is not optional in practice even though `config/env.js` defaults it to `development`: it gates both serving `frontend/dist` in production (`app.js`) and the `secure` flag on the auth cookie (`utils/jwt.js`) — leaving it unset in a production deploy serves no frontend and ships the session cookie without `secure`.

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
- `routes/*.routes.js` mount under `/api/<name>` in `app.js` and own request validation (zod schemas defined inline per route file, applied via `validateBody` for the request body and `validateQuery` for query params — the latter lands in `req.validatedQuery`, not a reassigned `req.query`) plus `requireAuth` middleware. `POST /api/auth/logout` is the one route deliberately left off `requireAuth`: it must stay reachable with an expired/invalid session, and the handler doesn't touch `req.userId`.
- `controllers/*.controller.js` talk to Prisma directly and to the services layer; they contain no business math.
- `services/calorie.service.js` and `services/foodMapper.js` are the two places with actual logic, kept as **pure functions** (no I/O) specifically so they're unit-testable — see `backend/tests/`. Any change to BMR/TDEE/macro-target formulas, the per-100g→absolute nutrition scaling (`scaleNutrition`), the `"YYYY-MM-DD"` fallback (`todayLogDate`), or the Open Food Facts JSON mapping belongs here, not in a controller.
- `services/openFoodFacts.service.js` is the only place that calls the outside world. It caches lookups in the `FoodCache` table (30-day staleness window) and retries transient failures (5xx/429, with a short backoff) once before throwing `HttpError(503, ...)`. A 404 is treated as "unknown product" and returned as `null`/propagated as a 404, never retried or turned into a 503.
- Auth is a JWT in an **httpOnly cookie** (`utils/jwt.js`), not a bearer token — `requireAuth` reads it via `cookie-parser` and sets `req.userId`. `GET /api/auth/me` is how the frontend restores a session on load, since JS can't read the cookie itself. `app.js` answers unmatched `/api/*` routes with a JSON 404 (mounted after the API routers, before the SPA catch-all), so a typo'd endpoint never falls through to `index.html`.

**Data model** (`backend/prisma/schema.prisma`): `User` holds both auth fields and the onboarding questionnaire (`heightCm`, `weightKg`, `activityLevel`, `goal`, `goalRateKcal`, `onboarded`). `FoodLog` rows store **computed absolute** calories/macros at the time they were logged (not a live reference to `FoodCache`/`CustomFood`), so a food's nutrition data changing later doesn't rewrite history. `logDate` is a `"YYYY-MM-DD"` string (not `DateTime`) computed client-side via `frontend/src/utils/date.js`'s `localLogDate()` and sent explicitly on every write (`ScanPage.jsx`, `WeightLogForm.jsx`) and every read (`DashboardPage.jsx`, and `HistoryPage.jsx` as the `endDate` anchor for `/api/stats/history` and `/api/weight`), so "today" is immune to server/client timezone drift. The server (`calorie.service.js`'s `todayLogDate()`, UTC-based) is only a fallback for callers that omit it entirely. Any server-side day arithmetic must go through `shiftLogDate(logDate, deltaDays)` (UTC-anchored string math) rather than `new Date()` + `setDate`, which would re-introduce the drift on a non-UTC server. `WeightLog` is `@@unique([userId, logDate])` (upsert-by-day); logging a weigh-in also re-syncs `User.weightKg` to whichever `WeightLog` row is chronologically latest (not simply the one just written — see `weight.controller.js`), so a retroactive past-dated entry can't clobber a more recent weight.

**Calorie/macro math** (`calorie.service.js`): Mifflin-St Jeor BMR → TDEE (activity multiplier) → target (`TDEE + goalRateKcal`, where `goalRateKcal` is a signed daily delta the frontend sets from the onboarding "goal" choice). Macro targets are derived from `weightKg` (g/kg protein, by goal) and a fat-percent-of-calories split, with carbs as the remainder — see `PROTEIN_G_PER_KG_BY_GOAL` / `FAT_PERCENT_BY_GOAL`. `stats.controller.js`'s `getHistory` returns both the user's own `targetCalories` (from their `goalRateKcal`) and a neutral `maintenanceCalories` reference, applying the **current** profile uniformly across the requested day range (no historized profile snapshots), which is a known simplification. `CaloriesChart` colours bars by signed distance to `targetCalories`, never against a hardcoded goal, so the chart stays correct for a gain goal or a manually overridden `goalRateKcal`.

**Backend tests** (`backend/tests`) — two layers, one `npm run test -w backend`:
- `calorie.service.test.js` / `foodMapper.test.js` are pure-function unit tests, no I/O.
- `integration/*.test.js` drive the real Express app through supertest against a real SQLite database. `helpers/api.js` exposes `app` (from `createApp()`, never listening on a port), `resetDb()`, and `registerAgent()` / `onboardedAgent()` — the latter two return a `request.agent` that keeps the httpOnly cookie across calls, which is the only way to exercise protected routes end to end.
- The test database is a throwaway file at `backend/.tmp/test.db`: `tests/setup/globalSetup.js` deletes it and runs `prisma migrate deploy` once per run, and `tests/setup/env.js` points `DATABASE_URL` at it *before* `lib/prisma.js` is imported (the Prisma client reads the URL at instantiation). Both read the path from `tests/setup/dbPath.js` rather than passing an env var between processes. `dotenv/config` never overrides an already-set variable, so a local `backend/.env` cannot hijack a test run. `fileParallelism: false` in `vitest.config.js` is required: every file shares that one database and truncates tables in `beforeEach`.
- Tests that exist specifically to pin a past bug carry a `// Régression :` comment naming the audit point. Each of those was verified by re-introducing the bug and confirming the test fails — a regression test that still passes against the broken code is worse than no test.

**Frontend** (`frontend/src`) — React Router (declarative mode) + Tailwind, mobile-first:
- `context/AuthContext.jsx` calls `GET /api/auth/me` on mount; `components/common/ProtectedRoute.jsx` redirects to `/login` or `/onboarding` based on `user` / `user.onboarded`.
- `api/client.js` is a single axios instance (`withCredentials: true`, `baseURL: /api`); `vite.config.js` proxies `/api` to `localhost:3000` in dev, so frontend and backend are effectively same-origin locally. In production `backend/src/app.js` serves `frontend/dist` statically for the same reason (avoids CORS/cross-site-cookie handling entirely).
- Route structure lives in `App.jsx`; tabs in `components/layout/BottomNav.jsx` must stay in sync with it.
- The scan flow (`pages/ScanPage.jsx`) has two tabs backed by different data sources that funnel into the same `QuantityEntryModal`: camera barcode via `components/scan/BarcodeScanner.jsx` (`@zxing/browser`, requires a secure context — HTTPS or `localhost` — for `getUserMedia`; the effect cleanup stops both the zxing `controls` and any raw `MediaStream` tracks still on the `<video>`, including the case where the component unmounts before `decodeFromVideoDevice`'s promise resolves) and free-text search via `components/scan/FoodSearch.jsx` (`GET /api/food/search`, which merges the user's own `CustomFood` rows with Open Food Facts results — custom foods first, tagged `isCustom`). `components/scan/CustomFoodForm.jsx` lets a user persist a food Open Food Facts doesn't have.
- `constants/goals.js` is the single source of truth for the onboarding `goal` choices and their default `goalRateKcal`; both `OnboardingPage.jsx` and `ProfilePage.jsx` import it so picking a goal always pre-fills a consistent calorie adjustment (still manually overridable afterward in `ProfilePage`).
- Charts in `components/history/` (`WeightChart.jsx`, `CaloriesChart.jsx`) are hand-rolled inline SVG, not a charting library — deliberate, to keep the bundle small for two simple visualizations. Colors are pulled from a validated dataviz palette (categorical blue for the single-series weight line; status green/amber/red for the calorie bars' distance to target, plus a neutral grey for days with no entry — an unlogged day must never render as a met goal), hardcoded as hex rather than Tailwind classes since SVG fill/stroke need literal values.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every pull request, in three parallel jobs: `backend` (Prisma generate + `npm run test -w backend`), `frontend` (`npm run build -w frontend`), and `docker`, which builds the image, starts it with `docker compose up --wait`, and curls the production paths — SPA served, JSON 404 on `/api`, register sets the session cookie, `/api/auth/me` restores it. That last job exists because those paths only run with `NODE_ENV=production` and are therefore invisible to both the unit and the integration suites.

The explicit `prisma generate` step is not redundant: the tests' `globalSetup` only runs `migrate deploy`, which does not generate the client, so a clean checkout fails without it.

`.github/dependabot.yml` covers npm, GitHub Actions and Docker, monthly. The npm entry points at `/` **only**: Dependabot reaches the workspace manifests through the root `package-lock.json`, so adding `/backend` and `/frontend` as extra directories opens every update twice — and the workspace-scoped copy edits `backend/package.json` without touching the lockfile, which breaks `npm ci`. (This is the opposite of `ncu`, which does need to be pointed at each workspace.) Minor and patch bumps are grouped into one PR; majors stay individual since each needs a decision.

## Known gaps worth knowing before touching related code

- No dark mode anywhere in the frontend (fixed light Tailwind classes throughout).
- There are still no frontend tests and no browser/e2e tests. The backend has unit tests for its pure services plus route-level integration tests (see the **Backend tests** section above), but nothing exercises React components, and the camera path in `BarcodeScanner.jsx` can only be checked by hand on a real device.
- `frontend` build emits a single ~650-700KB JS chunk (Vite warns about this) — no code-splitting has been set up.
