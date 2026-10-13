"use server";

import { adInquiries } from "@race-key/db";
import { z } from "zod";
import { AdInquiryEmail } from "@/emails/ad-inquiry";
import { getDb, hasDb } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

const schema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(100),
  email: z.email("That email doesn't look right.").max(200),
  company: z.string().trim().max(120).optional(),
  budget: z.string().trim().max(60).optional(),
  message: z.string().trim().min(10, "Add a few words about what you'd like to run.").max(4000),
  website: z.string().max(0).optional(),
});

export type InquiryState = { ok: boolean; error?: string } | null;

export async function submitInquiry(_: InquiryState, form: FormData): Promise<InquiryState> {
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message };
  const { website: _honeypot, ...inquiry } = parsed.data;
  if (hasDb()) await getDb().insert(adInquiries).values(inquiry);
  const admin = env("ADMIN_EMAIL");
  if (admin) {
    try {
      await sendEmail({
        to: admin,
        subject: `Advertiser inquiry: ${inquiry.company || inquiry.name}`,
        react: AdInquiryEmail({ inquiry }),
        replyTo: inquiry.email,
      });
    } catch (e) {
      console.error("could not email the inquiry", e);
    }
  }
  return { ok: true };
}
