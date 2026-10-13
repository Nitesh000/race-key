# Deployment

Everything runs on free plans:

| Part          | Where                                | Plan         |
| ------------- | ------------------------------------ | ------------ |
| Web (Next.js) | Vercel                               | Hobby        |
| Race server   | Cloudflare Workers + Durable Objects | Workers Free |
| Database      | Neon                                 | Free         |
| Email         | Resend                               | Free         |

Vercel can't host the race server: it needs long-lived WebSockets and Durable Objects, which only
Cloudflare offers for free.

> **Vercel Hobby is for non-commercial use only.** Ads and paid skins are off unless their keys
> are set (`NEXT_PUBLIC_ADSENSE_CLIENT`, house ads, `DODO_PAYMENTS_API_KEY`). Keep them off on
> Hobby. To turn them on for free, move the web app to Cloudflare (allowed commercially): set the
> GitHub variable `WEB_HOST=cloudflare` and the deploy workflow ships it with OpenNext.

## 1. Database (Neon)

Create a project, copy the connection string, then from the repo root:

```sh
pnpm db:migrate   # create the tables
pnpm db:seed      # load books and passages
```

Other commands, all reading `DATABASE_URL` from the environment or `apps/web/.env`:

```sh
pnpm db:push       # sync the schema straight to the database (quick, no migration file)
pnpm db:generate   # write a migration file after editing the schema
pnpm db:studio     # browse the data
```

Pick one way per schema change: `db:push`, or `db:generate` + `db:migrate`. Production deploys run
`db:migrate`, so a change made only with `db:push` never reaches a fresh database.

## 2. Race server (Cloudflare)

```sh
cd apps/realtime
pnpm exec wrangler login
pnpm exec wrangler secret put REALTIME_SHARED_SECRET   # any long random string
pnpm exec wrangler secret put DATABASE_URL
pnpm deploy
```

Note the `https://race-key-realtime.<you>.workers.dev` URL it prints.

## 3. Web (Vercel Hobby)

1. Import the GitHub repo in Vercel and set **Root Directory** to `apps/web`. Everything else
   comes from `apps/web/vercel.json` (pnpm install at the repo root, Turborepo build, skipping
   builds when nothing the web app uses changed, functions in `cle1` next to Neon's `us-east-2`).
2. Add environment variables (Production and Preview):

| Variable                                      | Value                                         |
| --------------------------------------------- | --------------------------------------------- |
| `DATABASE_URL`                                | Neon connection string                        |
| `BETTER_AUTH_SECRET`                          | `openssl rand -base64 32`                     |
| `NEXT_PUBLIC_REALTIME_URL`                    | the workers.dev URL from step 2               |
| `REALTIME_SHARED_SECRET`                      | same value as the worker secret               |
| `ENABLE_EXPERIMENTAL_COREPACK`                | `1` (makes Vercel use the repo's pnpm 11)     |
| `BETTER_AUTH_URL`                             | optional, your custom domain once you add one |
| `GOOGLE_*`, `GITHUB_*`                        | optional social login                         |
| `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_EMAIL` | optional email                                |

3. Deploy. Every push to `main` deploys production and every pull request gets a preview, through
   Vercel's Git integration. If your Neon region isn't `us-east-2`, change `regions` in
   `vercel.json` to the closest Vercel region (Hobby allows one).

## Premium skins (optional, commercial)

Only on a host that allows commercial use (Cloudflare, or Vercel Pro), never on Vercel Hobby.

1. In Dodo Payments (test mode first), create one product per premium skin (`rocket`, `ufo`,
   `dragon`) at the prices in `packages/shared/src/catalog.ts`.
2. Add a webhook pointing at `https://<your site>/api/payments/webhook` for `payment.succeeded`,
   `payment.failed`, `payment.cancelled` and `refund.succeeded`.
3. Set `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`, `DODO_PAYMENTS_ENVIRONMENT`
   (`test_mode` or `live_mode`) and `DODO_PRODUCTS` (JSON map of skin id to product id).

Each webhook event is processed once (`webhook_events`), and refunds remove the skin.

## GitHub Actions

| Workflow       | Does                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| `ci.yml`       | format, lint, typecheck, tests and build on every pull request             |
| `e2e.yml`      | Playwright on Chromium, WebKit and Firefox against a throwaway Neon branch |
| `preview.yml`  | deploys the race server preview environment for each pull request          |
| `deploy.yml`   | on `main`: migrate the database and deploy the race server                 |
| `rollback.yml` | rolls the race server (and the web app on Cloudflare) back one version     |

Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `DATABASE_URL`, `NEON_API_KEY`,
`TURBO_TOKEN` (optional). Variables: `NEON_PROJECT_ID`, `REALTIME_URL`, `PREVIEW_REALTIME_URL`,
`TURBO_TEAM` (optional), `WEB_HOST` (only set to `cloudflare` when moving off Vercel).

Roll back the web app on Vercel from its dashboard (Deployments → Promote to Production).

## Branch protection

Protect `main`: require pull requests, require the `CI / check` status, and block force pushes.
