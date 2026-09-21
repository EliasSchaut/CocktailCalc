# CocktailCalc

A web app to calculate cocktails (ingredients, prices, buying lists) for specific events.

**Stack:** [SvelteKit](https://svelte.dev/docs/kit) (Svelte 5, frontend **and** REST API), [Drizzle ORM](https://orm.drizzle.team) + SQLite, [Tailwind CSS 4](https://tailwindcss.com), [Tauri 2](https://v2.tauri.app) for the desktop/mobile app, [pnpm](https://pnpm.io).

## Configuration

Copy `.env.example` to `.env` and adjust the values:

| Variable       | Default        | Description                                                              |
| -------------- | -------------- | ------------------------------------------------------------------------ |
| `PORT`         | `3000`         | Port of the production server (`node build`)                             |
| `ORIGIN`       | –              | Public origin of the production server, e.g. `https://cocktail.kuhlt.de` |
| `DATABASE_URL` | `./db.sqlite3` | Path to the SQLite file. Created and migrated automatically on start     |

## Development

Requirements: Node.js ≥ 22.18 and [pnpm](https://pnpm.io/installation) (`corepack enable` or `npm i -g pnpm`).

```sh
pnpm install
pnpm dev          # http://localhost:5173
pnpm check        # type check (svelte-check)
pnpm test         # unit tests (vitest)
pnpm format       # prettier
```

Names of ingredients, recipes and events can be changed by clicking the card title. Ingredients in a recipe and recipes in an event are listed in creation order and can be reordered by dragging the grip handle. The buying list of an event can be copied as a Markdown task list via the clipboard icon next to "Zutaten". Under the database icon in the navigation all data can be exported to a JSON file and imported again (merge or replace).

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

A prebuilt image is published to Docker Hub as `kidilias/cocktailcalc:latest` on every push to `main` (see `.github/workflows/ci.yml`; requires the repository variable `DOCKERHUB_USERNAME`, the secret `DOCKERHUB_TOKEN` and optionally the variable `DOCKER_IMAGE`).

The image runs as the unprivileged `node` user, stores the SQLite file under `/data` and exposes port 3000. Set `ORIGIN` to the public URL the app is served at.

## Desktop / mobile app (Tauri)

The app works **offline and standalone**: the same SvelteKit frontend runs inside a Tauri window with its own SQLite database (sql.js/WebAssembly, persisted as `cocktailcalc.db` in the app data directory). The business logic in `src/lib/db/calc.ts` is shared with the server, only the API layer differs (`src/lib/local/api.ts` instead of HTTP). Data can be moved between the web app and the desktop app with export/import.

Requirements: [Rust](https://rustup.rs) and the [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your platform.

```sh
pnpm tauri:dev     # dev window
pnpm tauri:build   # bundles in src-tauri/target/release/bundle
```

`pnpm build:app` alone produces the static SPA (`build/`) used by Tauri. Opened in a normal browser it stores its data in IndexedDB instead.

### Releases

Pushing a tag `v*` (e.g. `v0.2.0`, matching the version in `src-tauri/tauri.conf.json`) runs `.github/workflows/release.yml`, which builds the app for macOS (universal), Linux (`.deb`, `.rpm`, `.AppImage`) and Windows (`.msi`, `.exe`) and attaches everything to a **draft** GitHub release. Review and publish the draft on GitHub. The bundles are not code-signed.

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
