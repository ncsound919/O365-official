import { describe, expect, it } from "vitest";
import { weeklySync } from "../agents/orchestrator/weeklySync.js";
import type { AuditorReport } from "../agents/auditor/index.js";
import type { CashPulse } from "../agents/treasurer/reconcile.js";
import type { GuardianReport } from "../agents/guardian/index.js";

function auditor(status: "healthy" | "degraded" | "critical"): AuditorReport {
  return {
    runTimestamp: "2026-08-02T00:00:00Z",
    uptime: [{ url: "https://a.com", statusCode: status === "healthy" ? 200 : 503, ok: status === "healthy", responseTimeMs: 100 }],
    brokenLinks: [],
    paymentFlow: { checks: [], overall: "ok" },
    dataConsistency: "not-yet-defined",
    repoHealth: [],
    siteQa: { suite: "all", status: "pass", passed: 1, failed: 0, errored: 0, sites: [], detail: "all sites passed" },
    overallStatus: status,
  };
}

const pulse: CashPulse = {
  periodStart: "a",
  periodEnd: "b",
  totalInflow: 100,
  byRail: { stripe: 100, cashapp: 0, venmo: 0 },
  byPlatform: { health: 0, wealth: 0, justice: 0, "cross-platform": 100 },
  mrr: null,
  mrrConfidence: "unavailable",
  topExpenseCategory: null,
  pricingRecommendation: null,
  anomalies: ["Stripe inflow 40% below 4-week average"],
};

const guardian: GuardianReport = {
  periodStart: "a",
  periodEnd: "b",
  flaggedContent: [{ itemId: "ev1", platform: "justice", matchedRules: [], excerpt: "x", recommendedAction: "human-review" }],
  disputesResolved: 0,
  corpusStatus: "missing",
};

describe("weeklySync", () => {
  it("marks unwired agents as not-run (never fabricates)", () => {
    const memo = weeklySync({ weekOf: "2026-08-02" });
    expect(memo.financialHealth).toBe("not-run");
    expect(memo.productInsight).toBe("not-run");
    expect(memo.actionItems).toHaveLength(0);
  });

  it("propagates agent findings into cited action items (max 5)", () => {
    const memo = weeklySync({
      weekOf: "2026-08-02",
      systemHealth: auditor("degraded"),
      financialHealth: pulse,
      legalFlags: guardian,
    });
    expect(memo.actionItems.length).toBeGreaterThan(0);
    expect(memo.actionItems.length).toBeLessThanOrEqual(5);
    expect(memo.actionItems.some((a) => a.startsWith("[Auditor]"))).toBe(true);
    expect(memo.actionItems.some((a) => a.startsWith("[Treasurer]"))).toBe(true);
    expect(memo.actionItems.some((a) => a.startsWith("[Guardian]"))).toBe(true);
  });
});
