# race-key

Free-to-play multiplayer typing races on passages from real books.

## Layout

- `apps/web` Next.js site
- `apps/realtime` Cloudflare Worker with Durable Objects for rooms and matchmaking
- `packages/shared` protocol, schemas, name generator, scoring, stat math
- `packages/db` Drizzle schema and migrations
- `packages/passages` Gutenberg import and passage data
- `packages/themes` theme tokens, themes and CSS build
- `packages/assets` SVG skins and image build
- `packages/config` shared tsconfig and eslint

## Getting started

```sh
pnpm install
cp apps/web/.env.example apps/web/.env.local

# optional local Postgres instead of Neon (downloads Postgres once, migrates and seeds)
pnpm --filter @race-key/db dev:db
# then set DATABASE_URL=postgres://postgres:postgres@localhost:5433/postgres in apps/web/.env.local

pnpm dev
```

`pnpm dev` starts the site on port 3000 and the race server on port 8787. In development both
sides fall back to the same shared secret, so races work with no extra setup. To save race
results locally, copy `apps/realtime/.dev.vars.example` to `apps/realtime/.dev.vars` and set
`DATABASE_URL` there too.

End-to-end tests run on Chromium, WebKit and Firefox and start everything they need:

```sh
pnpm turbo run build --filter=@race-key/web
pnpm --filter @race-key/e2e exec playwright install
pnpm e2e
```

Practice mode works without a database. Accounts, guests, profiles and saved results need
`DATABASE_URL`.
