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

# optional local database instead of Neon
pnpm --filter @race-key/db dev:db
DATABASE_URL=postgres://postgres@localhost:5433/postgres pnpm --filter @race-key/db migrate
DATABASE_URL=postgres://postgres@localhost:5433/postgres pnpm --filter @race-key/db seed

pnpm dev
```

`pnpm dev` starts the site on port 3000 and the race server on port 8787. In development both
sides fall back to the same shared secret, so races work with no extra setup. To save race
results locally, copy `apps/realtime/.dev.vars.example` to `apps/realtime/.dev.vars` and set
`DATABASE_URL` there too.

Practice mode works without a database. Accounts, guests, profiles and saved results need
`DATABASE_URL`.
