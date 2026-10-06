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
pnpm dev
```
