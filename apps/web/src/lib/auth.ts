import "server-only";
import { profiles } from "@race-key/db";
import * as schema from "@race-key/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins";
import { randomName } from "@race-key/shared";
import { mergeGuestInto } from "@/features/auth/merge-guest";
import { claimUsername } from "@/features/profile/usernames";
import { ResetPasswordEmail } from "@/emails/reset-password";
import { getDb, hasDb } from "./db";
import { sendEmail } from "./email";
import { env } from "./env";

function createAuth() {
  const db = getDb();
  const google = env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET");
  const github = env("GITHUB_CLIENT_ID") && env("GITHUB_CLIENT_SECRET");

  return betterAuth({
    secret: env("BETTER_AUTH_SECRET"),
    baseURL: env("BETTER_AUTH_URL"),
    database: drizzleAdapter(db, { provider: "pg", usePlural: true, schema }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: "Reset your race-key password",
          react: ResetPasswordEmail({ name: user.name, url }),
        });
      },
    },
    socialProviders: {
      ...(google && {
        google: { clientId: env("GOOGLE_CLIENT_ID")!, clientSecret: env("GOOGLE_CLIENT_SECRET")! },
      }),
      ...(github && {
        github: { clientId: env("GITHUB_CLIENT_ID")!, clientSecret: env("GITHUB_CLIENT_SECRET")! },
      }),
    },
    session: {
      cookieCache: { enabled: true, maxAge: 300 },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            const anon = (user as { isAnonymous?: boolean }).isAnonymous;
            const username = await claimUsername(db, anon ? user.name : user.name || randomName());
            await db.insert(profiles).values({ userId: user.id, username }).onConflictDoNothing();
          },
        },
      },
    },
    plugins: [
      anonymous({
        generateName: () => randomName(),
        onLinkAccount: async ({ anonymousUser, newUser }) => {
          await mergeGuestInto(db, anonymousUser.user.id, newUser.user.id);
        },
      }),
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | null = null;

export function authEnabled() {
  return hasDb();
}

export function getAuth(): Auth {
  instance ??= createAuth();
  return instance;
}

export function socialProviders() {
  return {
    google: !!(env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET")),
    github: !!(env("GITHUB_CLIENT_ID") && env("GITHUB_CLIENT_SECRET")),
  };
}
