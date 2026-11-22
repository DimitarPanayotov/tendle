# Tendle

A daily Top 10 game: everyone gets the same list, guesses its entries, and the entries few other players found score the most. What the game is and why: `docs/brief.md`.

## Commands

- `pnpm install`: the packages, from the lockfile.
- `pnpm run lint`: Biome (warnings count as errors) and the folder boundaries.
- `pnpm run typecheck`: TypeScript, strict.
- `pnpm run test`: Vitest. One file: `pnpm exec vitest run src/game/normalize.test.ts`.
- Scripts in `scripts/` run with `tsx` (`pnpm exec tsx scripts/<name>.ts`), which resolves the extensionless imports `src/` uses; plain `node` cannot.
- All three must pass before a change is done. CI (`.github/workflows/ci.yml`) and the factory (`.factory/factory.json`) run the same tools directly, not through these scripts.

## Deploying (a person, from the laptop)
- One Cloudflare Worker serves the page (`dist/web`, built by Vite) and the API, and settles each day at 00:05 UTC (`wrangler.toml`).
- `pnpm run db:migrate` applies `migrations/` to the real D1 database; `pnpm run deploy` builds the page and deploys. Both need `wrangler login` on the laptop: no deploy runs from GitHub, and no Cloudflare token is in GitHub.

## Where things live

- `src/game/`: the rules of the game (matching a guess, scoring by rarity, settling the day). Plain TypeScript: no framework, no database, no network, no imports from other folders. It defines the ports (interfaces) the rest implements.
- `src/server/`: the HTTP API (Hono), which will run on Cloudflare Workers. It checks input, calls `src/game`, and returns JSON.
- `src/adapters/`: talking to the outside world, such as the database (Cloudflare D1). Each adapter implements a port from `src/game`.
- `src/web/`: the page (Preact, built with Vite). It talks to the server over HTTP only.
- The boundaries between these folders are rules in `.dependency-cruiser.json`, checked by `pnpm run lint` and by `src/boundaries.test.ts`.
- Code in `src/` ships to Cloudflare Workers or the browser, never Node: it imports no Node module and uses no Node global (the boundary rules and Biome refuse both). Tests run in Node and may, such as `node:sqlite` for an in-memory database and `node:fs` to read `migrations/`; so may `scripts/`.
- Tests sit next to the code they test: `name.ts` and `name.test.ts`.
- A page component's test renders it with `@testing-library/preact` in a browser-like environment: start the test file with the line `// @vitest-environment happy-dom` (see `src/web/App.test.tsx`). Test what a player sees and does, never the component's insides. That holds in `scripts/` too: Vitest runs `scripts/**/*.test.ts`.

## Rules the code does not show

- A day's list entries never reach the browser before that player's round has ended. Every guess is checked on the server.
- The real lists are not in this repository: it is public. They live in a private repository and are loaded into the database by a person. Tests use made-up lists.
- No accounts and no personal data. A player is a random id kept in the browser.
- Tests never touch a real database. Use an in-memory fake that implements the same port.
- Never add a comment that switches a check off (`biome-ignore`, `@ts-ignore`, `@ts-expect-error` and the like), and never a comment that excuses a shortcut ("temporary", "the real fix would be…"). Fix the code. If a check is wrong, say so and stop.
- Comments say why, not what. Functions do one thing and stay short. No magic numbers: name them.
- English everywhere.
- Human-only files (the factory refuses a change to them): `.factory/**`, `.github/**`, `biome.json`, `tsconfig*.json`, `.dependency-cruiser.json`, `vitest.config.ts`, `pnpm-workspace.yaml` (which packages may run install scripts: none do), `wrangler.toml` (the deploy), and any `migrations/` folder, so a database schema change is a person's job.
