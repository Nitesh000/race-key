# Deployment

Production runs on Cloudflare (web through OpenNext, realtime as a Worker with Durable Objects).
Vercel Hobby is only used for pull request previews.

## Accounts

Vercel, Cloudflare, Neon, Resend, Dodo Payments and Sentry, all on free plans.

## GitHub secrets

| Secret                                               | Used by                     |
| ---------------------------------------------------- | --------------------------- |
| `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`      | preview, deploy, rollback   |
| `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` | preview                     |
| `NEON_API_KEY`                                       | e2e (throwaway branches)    |
| `DATABASE_URL`                                       | deploy (production migrate) |
| `TURBO_TOKEN`                                        | remote cache                |

## GitHub variables

`TURBO_TEAM`, `NEON_PROJECT_ID`, `REALTIME_URL`, `PREVIEW_REALTIME_URL`.

## Worker secrets

Set with `wrangler secret put` in `apps/realtime` and `apps/web`:
`DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`, `RESEND_API_KEY`, `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_WEBHOOK_KEY`,
`REALTIME_SHARED_SECRET`.

## Branch protection

Protect `main`: require pull requests, require the `CI / check` status, and block force pushes.

## Rollback

Run the `Rollback` workflow from the Actions tab and pick `web`, `realtime` or `both`.

## Database

```sh
pnpm --filter @race-key/db generate   # after editing the schema
DATABASE_URL=... pnpm --filter @race-key/db migrate
DATABASE_URL=... pnpm --filter @race-key/db seed
```

Use a Neon branch per developer for local work. The schema tests run against PGlite, so they
need no database.
