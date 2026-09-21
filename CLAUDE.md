# CocktailCalc

Web app to calculate cocktails, ingredient amounts and prices for events. German UI.

## Stack

SvelteKit 2 (Svelte 5 runes) for frontend **and** REST API · Drizzle ORM + better-sqlite3 (server) / sql.js (Tauri app, offline) · Tailwind 4 · Tauri 2 · pnpm · TypeScript 6 · vitest.

## Commands

```sh
pnpm dev            # dev server on :5173
pnpm check          # svelte-check (run before finishing)
pnpm test           # vitest unit tests
pnpm format         # prettier
pnpm build          # web build (adapter-node) -> build/, run with `node build`
pnpm build:app      # static SPA for Tauri (BUILD_TARGET=tauri)
pnpm db:generate    # new migration after editing schema.ts (commit drizzle/)
pnpm db:import      # import old Prisma DB (OLD_DATABASE_URL)
pnpm tauri:dev|build
```

## Layout

- `src/lib/db/schema.ts` – tables; `src/lib/db/calc.ts` – all business logic (`createCalcService(db)`), driver-agnostic (sync Drizzle SQLite), tested against better-sqlite3 **and** sql.js in `calc.test.ts`
- `src/lib/db/migrations.ts` – bundled migrator for the app; `src/lib/server/db/client.ts` – better-sqlite3 + drizzle migrator for the server
- `src/lib/api.ts` – facade; `apiRemote.ts` (fetch, web) vs `local/api.ts` (sql.js in the Tauri app, chosen at build time via `__TAURI_BUILD__`); `local/db.ts` + `local/storage.ts` persist the SQLite file (Tauri fs plugin or IndexedDB)
- `src/routes/api/**/+server.ts` – REST endpoints, bodies validated with zod in `validation.ts`, errors mapped in `http.ts`
- `src/lib/components/DataSetting.svelte` + `api/export`, `api/import` – JSON export/import of all data (service `exportAll`/`importAll`)
- `src/lib/components` – Svelte components; `src/lib/icons` – inline Heroicons paths
- `src/hooks.server.ts` – CORS for `/api` (Tauri) and security headers
- `src-tauri/` – Tauri config; `scripts/import-prisma.ts` – one-off data import

## Rules

- Prices: ingredients in €/l, recipe ingredient amounts in cl, recipe/event prices are **denormalised**. Every mutation must go through the service so `updateRecipePrice`/`updateEventPrice` keep them in sync.
- Junction tables carry a `position` column (1-based creation order, reorderable via drag and drop with `svelte-dnd-action`); new rows get `max+1`, import assigns array index.
- Keep API paths/bodies stable. Every `call_*` in `apiRemote.ts` needs a twin in `local/api.ts`.
- Do not use Drizzle relational queries (`db.query.*`) in `calc.ts`: sql.js returns nested JSON as strings. Use explicit selects.
- Server-only code lives in `src/lib/server`; shared code in `src/lib/db` must not import `$env`, node modules or `$lib/server`. Files imported by `scripts/` need explicit `.ts` import extensions.
- Svelte 5 only: `$props`, `$state`, `$derived`, callback props instead of events, `onclick` attributes.
- Tailwind 4 class names (`shadow-xs`, `inset-ring`, `grow`, colour `/opacity` syntax); theme tokens `primary`/`secondary` are defined in `src/app.css`.
