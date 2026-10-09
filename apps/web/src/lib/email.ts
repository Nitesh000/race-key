import "server-only";
import { Resend } from "resend";
import { env } from "./env";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
}) {
  const key = env("RESEND_API_KEY");
  if (!key) {
    console.warn(`email to ${opts.to} skipped: RESEND_API_KEY is not set`);
    return;
  }
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: env("EMAIL_FROM") ?? "race-key <onboarding@resend.dev>",
    to: opts.to,
    subject: opts.subject,
    react: opts.react,
    replyTo: opts.replyTo,
  });
  if (error) throw new Error(`email failed: ${error.message}`);
}
