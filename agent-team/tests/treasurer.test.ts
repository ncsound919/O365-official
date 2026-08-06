import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { runTreasurer } from "../agents/treasurer/index.js";
import { reconcile } from "../agents/treasurer/reconcile.js";
import type { EvidenceItem } from "../agents/shared/types.js";

const CASHAPP_FIXTURE = fileURLToPath(new URL("../agents/treasurer/fixtures/sample-cashapp.csv", import.meta.url));

function stripeItem(amountCents: number, platform: EvidenceItem["platform"] = "cross-platform", id = "s1"): EvidenceItem {
  return {
    id: `ev${id.padEnd(16, "0")}`,
    source: "stripe",
    platform,
    rawText: `Stripe ${amountCents}`,
    timestamp: "2026-07-28T00:00:00Z",
    channel: "api-poll",
    metadata: { amountCents },
    confidence: platform === "cross-platform" ? "low" : "high",
  };
}

describe("Treasurer", () => {
  it("aggregates inflow across rails from the CSV fixture + Stripe items", async () => {
    const stripe = [stripeItem(10000, "health", "s1"), stripeItem(5000, "cross-platform", "s2")];
    const { pulse } = await runTreasurer({
      periodStart: "2026-07-27T00:00:00Z",
      periodEnd: "2026-08-02T00:00:00Z",
      stripeItems: stripe,
      cashappCsvFile: CASHAPP_FIXTURE,
    });
    expect(pulse.byRail.stripe).toBe(15000);
    // 25 + 10 + 50 = 85 inflow (refund -4 excluded from inflow)
    expect(pulse.byRail.cashapp).toBe(8500);
    expect(pulse.totalInflow).toBe(23500);
    expect(pulse.byPlatform.health).toBe(10000);
    expect(pulse.byPlatform["cross-platform"]).toBe(13500);
    expect(pulse.byRail.venmo).toBe(0);
  });

  it("leaves MRR null (unavailable) rather than estimating", async () => {
    const { pulse } = await runTreasurer({
      periodStart: "a",
      periodEnd: "b",
    });
    expect(pulse.mrr).toBeNull();
    expect(pulse.mrrConfidence).toBe("unavailable");
    expect(pulse.topExpenseCategory).toBeNull();
  });

  it("keeps pricingRecommendation withheld without 4+ weeks of trend data", async () => {
    const { pulse } = await runTreasurer({
      periodStart: "a",
      periodEnd: "b",
      priorWeeksByRail: [{ stripe: 100, cashapp: 0, venmo: 0 }, { stripe: 110, cashapp: 0, venmo: 0 }],
    });
    expect(pulse.pricingRecommendation).toBeNull();
  });

  it("flags stripe inflow drops vs prior weeks", () => {
    const pulse = reconcile({
      periodStart: "a",
      periodEnd: "b",
      stripeItems: [stripeItem(4000, "health", "s1")],
      cashappItems: [],
      venmoItems: [],
      priorWeeksByRail: [{ stripe: 10000, cashapp: 0, venmo: 0 }, { stripe: 10000, cashapp: 0, venmo: 0 }, { stripe: 10000, cashapp: 0, venmo: 0 }],
    });
    expect(pulse.anomalies.some((a) => a.includes("Stripe inflow"))).toBe(true);
  });
});
