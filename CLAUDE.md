# CocktailCalc

Web app to calculate cocktails, ingredient amounts and prices for events. German UI.

## Stack

SvelteKit 2 (Svelte 5 runes) for frontend **and** REST API · Drizzle ORM + better-sqlite3 · Tailwind 4 · Tauri 2 (thin shell around the static build) · pnpm · TypeScript 6 · vitest.

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

- `src/lib/server/db/schema.ts` – tables; `db/client.ts` opens SQLite and runs migrations (no `$lib`/`$env` imports, used by scripts and tests)
- `src/lib/server/calc.ts` – all business logic (`createCalcService(db)`), tests in `calc.test.ts` with `:memory:` DB
- `src/routes/api/**/+server.ts` – REST endpoints, bodies validated with zod in `validation.ts`, errors mapped in `http.ts`
- `src/lib/components/DataSetting.svelte` + `api/export`, `api/import` – JSON export/import of all data (service `exportAll`/`importAll`)
- `src/lib/api.ts` – typed fetch client used by pages (`+page.ts` load) and cards
- `src/lib/components` – Svelte components; `src/lib/icons` – inline Heroicons paths
- `src/hooks.server.ts` – CORS for `/api` (Tauri) and security headers
- `src-tauri/` – Tauri config; `scripts/import-prisma.ts` – one-off data import

## Rules

- Prices: ingredients in €/l, recipe ingredient amounts in cl, recipe/event prices are **denormalised**. Every mutation must go through the service so `updateRecipePrice`/`updateEventPrice` keep them in sync.
- Keep API paths/bodies stable; the Tauri app talks to a deployed server via `PUBLIC_API_BASE`.
- Server-only code lives in `src/lib/server`; files imported by `scripts/` need explicit `.ts` import extensions.
- Svelte 5 only: `$props`, `$state`, `$derived`, callback props instead of events, `onclick` attributes.
- Tailwind 4 class names (`shadow-xs`, `inset-ring`, `grow`, colour `/opacity` syntax); theme tokens `primary`/`secondary` are defined in `src/app.css`.
