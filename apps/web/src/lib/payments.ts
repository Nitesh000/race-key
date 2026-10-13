import "server-only";
import DodoPayments from "dodopayments";
import { env } from "./env";

let client: DodoPayments | null = null;

export function productIds(): Record<string, string> {
  try {
    return JSON.parse(env("DODO_PRODUCTS") ?? "{}") as Record<string, string>;
  } catch {
    return {};
  }
}

export function paymentsEnabled() {
  return !!(env("DODO_PAYMENTS_API_KEY") && env("DODO_PAYMENTS_WEBHOOK_KEY"));
}

export function dodo() {
  client ??= new DodoPayments({
    bearerToken: env("DODO_PAYMENTS_API_KEY"),
    webhookKey: env("DODO_PAYMENTS_WEBHOOK_KEY") ?? null,
    environment: env("DODO_PAYMENTS_ENVIRONMENT") === "live_mode" ? "live_mode" : "test_mode",
  });
  return client;
}
