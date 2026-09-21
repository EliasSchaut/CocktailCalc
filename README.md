# CocktailCalc

A web app to calculate cocktails (ingredients, prices, buying lists) for specific events.

**Stack:** [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, frontend **and** REST API), [Drizzle ORM](https://orm.drizzle.team) + SQLite, [Tailwind CSS 4](https://tailwindcss.com), [Tauri 2](https://v2.tauri.app) for the desktop/mobile app, [pnpm](https://pnpm.io).

## Configuration

Copy `.env.example` to `.env` and adjust the values:

| Variable          | Default        | Description                                                                            |
| ----------------- | -------------- | -------------------------------------------------------------------------------------- |
| `PORT`            | `3000`         | Port of the production server (`node build`)                                           |
| `ORIGIN`          | –              | Public origin of the production server, e.g. `https://cocktail.kuhlt.de`               |
| `DATABASE_URL`    | `./db.sqlite3` | Path to the SQLite file. Created and migrated automatically on start                   |
| `PUBLIC_API_BASE` | _(empty)_      | Base URL of the API for the frontend. Empty = same origin. Set for the Tauri app build |

## Development

Requirements: Node.js ≥ 22.18 and [pnpm](https://pnpm.io/installation) (`corepack enable` or `npm i -g pnpm`).

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # type check (svelte-check)
pnpm test         # unit tests (vitest)
pnpm format       # prettier
```

Amounts are in **cl** (recipes) and **pieces** (events), ingredient prices in **€/l**, buying lists in **l**.

### Database

The schema lives in `src/lib/server/db/schema.ts`; SQL migrations in `drizzle/` are committed and applied automatically when the server starts.

```sh
pnpm db:generate  # create a new migration after changing the schema
pnpm db:migrate   # apply migrations manually
pnpm db:studio    # browse the database
```

### Importing data from the old Prisma database

The previous version stored data via Prisma (Postgres or SQLite). Import it once with:

```sh
OLD_DATABASE_URL=postgresql://user:pass@host:5432/cocktailcalc pnpm db:import
# or
OLD_DATABASE_URL=file:./old.sqlite3 pnpm db:import
```

Both variables can also be set in `.env`. The target is `DATABASE_URL`. The import is idempotent and recalculates all prices.

## Production (web)

```sh
pnpm build
ORIGIN=https://cocktail.kuhlt.de PORT=3000 DATABASE_URL=/data/db.sqlite3 node build
```

`build/` contains a self-contained Node server (SvelteKit `adapter-node`). Keep `node_modules` (production dependencies) and `drizzle/` next to it.

### Docker

```sh
docker compose up -d --build          # http://localhost:3000, data in the `data` volume
ORIGIN=https://cocktail.kuhlt.de docker compose up -d --build
```

The image runs as the unprivileged `node` user, stores the SQLite file under `/data` and exposes port 3000. Set `ORIGIN` to the public URL the app is served at.

## Desktop / mobile app (Tauri)

The app is a thin shell: the SvelteKit frontend is bundled statically and talks to a hosted server via the REST API under `/api`.

Requirements: [Rust](https://rustup.rs) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform.

```sh
PUBLIC_API_BASE=https://cocktail.kuhlt.de pnpm tauri:dev     # dev window
PUBLIC_API_BASE=https://cocktail.kuhlt.de pnpm tauri:build   # bundles in src-tauri/target/release/bundle
```

`pnpm build:app` alone produces the static frontend (`build/`) used by Tauri.

## API

All endpoints are below `/api` and accept/return JSON:

| Method        | Path                         | Body                                                    |
| ------------- | ---------------------------- | ------------------------------------------------------- |
| GET           | `/ingredients`               |                                                         |
| POST / DELETE | `/ingredient`                | `{name, price, alcohol?}` / `{name}`                    |
| GET           | `/recipes`, `/recipes/:name` |                                                         |
| POST / DELETE | `/recipe`                    | `{name, description?}` / `{name}`                       |
| POST / DELETE | `/recipe/ingredient`         | `{recipe, ingredient, amount}` / `{recipe, ingredient}` |
| GET           | `/events`, `/events/:name`   |                                                         |
| POST / DELETE | `/event`                     | `{name}`                                                |
| POST / DELETE | `/event/recipe`              | `{event, recipe, amount}` / `{event, recipe}`           |
| GET           | `/event/list/:name`          | buying list (amounts in l)                              |
