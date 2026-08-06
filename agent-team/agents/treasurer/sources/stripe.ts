/**
 * Treasurer source — Stripe adapter.
 * Mirrors progrmoiz/stripe-pulse's fetcher approach (charges + subscriptions →
 * MRR/ARR). Uses Stripe's REST API with created[gte]/[lte] filters.
 *
 * TODO: confirm Stripe products/prices are tagged with platform metadata
 * (health/wealth/justice) before revenue can be attributed per platform. Until
 * then, untagged transactions map to platform "cross-platform" with low
 * confidence — never guessed.
 */
import { createHash } from "node:crypto";
import type { EvidenceItem, Platform } from "../../shared/types.js";

const STRIPE_API = "https://api.stripe.com/v1";

export interface StripeCharge {
  id: string;
  created: number;
  amount: number; // cents
  currency: string;
  description: string | null;
  status: string;
  metadata?: Record<string, string>;
  payment_intent?: string | null;
}

export interface StripeConfig {
  secretKey: string;
  platformMetadataKey?: string; // metadata key that tags platform, if any
}

function platformFromMetadata(metadata: Record<string, string> | undefined, key?: string): Platform {
  if (!key || !metadata?.[key]) return "cross-platform";
  const value = metadata[key].toLowerCase();
  if (value.includes("health")) return "health";
  if (value.includes("wealth")) return "wealth";
  if (value.includes("justice")) return "justice";
  return "cross-platform";
}

export async function fetchStripeTransactions(
  config: StripeConfig,
  periodStart: string,
  periodEnd: string
): Promise<EvidenceItem[]> {
  const since = Math.floor(new Date(periodStart).getTime() / 1000);
  const until = Math.floor(new Date(periodEnd).getTime() / 1000);
  const items: EvidenceItem[] = [];
  let url: URL | null = new URL(`${STRIPE_API}/charges`);
  url.searchParams.set("limit", "100");

  while (url) {
    const res = await fetch(url, {
      headers: {
        authorization: `Bearer ${config.secretKey}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`stripe: HTTP ${res.status}`);
    const data = (await res.json()) as { data: StripeCharge[]; has_more: boolean; url?: string };

    for (const charge of data.data) {
      if (charge.created < since || charge.created > until) continue;
      const platform = platformFromMetadata(charge.metadata, config.platformMetadataKey);
      const untagged = platform === "cross-platform";
      items.push({
        id: `ev${createHash("sha256").update(`stripe:${charge.id}`).digest("hex").slice(0, 16)}`,
        source: "stripe",
        platform,
        rawText: `Stripe ${charge.status} ${charge.amount}${charge.currency} ${charge.description ?? "(no description)"}`,
        timestamp: new Date(charge.created * 1000).toISOString(),
        channel: "api-poll",
        metadata: {
          chargeId: charge.id,
          amountCents: charge.amount,
          currency: charge.currency,
          paymentIntent: charge.payment_intent,
        },
        confidence: untagged ? "low" : "high",
      });
    }

    if (data.has_more) {
      url = new URL(data.url ?? `${STRIPE_API}/charges?limit=100&starting_after=${data.data.at(-1)?.id ?? ""}`);
    } else {
      url = null;
    }
  }

  return items;
}
