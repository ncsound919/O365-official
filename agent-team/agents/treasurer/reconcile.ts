/**
 * Treasurer — reconciliation. Aggregates money, not feedback.
 * Reuses stripe-pulse's MRR/ARR calculation concepts.
 */
import type { EvidenceItem, Platform } from "../shared/types.js";

export type Rail = "stripe" | "cashapp" | "venmo";

export interface CashPulse {
  periodStart: string;
  periodEnd: string;
  totalInflow: number; // cents
  byRail: Record<Rail, number>;
  byPlatform: Record<Platform, number>;
  /** null if subscription data insufficient — DO NOT estimate. */
  mrr: number | null;
  mrrConfidence: "high" | "low" | "unavailable";
  /** null until an expense-tracking source exists. */
  topExpenseCategory: string | null;
  /** only emit if backed by >=4 weeks of trend data; withhold otherwise. */
  pricingRecommendation: string | null;
  anomalies: string[];
}

export interface ReconcileInput {
  periodStart: string;
  periodEnd: string;
  stripeItems: EvidenceItem[];
  cashappItems: EvidenceItem[];
  venmoItems: EvidenceItem[];
  /** Optional MRR computed from a live subscription query. */
  mrr?: number | null;
  mrrConfidence?: "high" | "low" | "unavailable";
  /** Previous weekly totals by rail, for anomaly detection. */
  priorWeeksByRail?: Record<Rail, number>[];
}

const MIN_WEEKS_FOR_PRICING_REC = 4;

function inflowByRail(items: EvidenceItem[]): number {
  return items.reduce((sum, item) => {
    const amount = (item.metadata.amountCents as number | undefined) ?? 0;
    return sum + (amount > 0 ? amount : 0);
  }, 0);
}

export function reconcile(input: ReconcileInput): CashPulse {
  const byRail: Record<Rail, number> = {
    stripe: inflowByRail(input.stripeItems),
    cashapp: inflowByRail(input.cashappItems),
    venmo: inflowByRail(input.venmoItems),
  };
  const totalInflow = byRail.stripe + byRail.cashapp + byRail.venmo;

  const byPlatform: Record<Platform, number> = {
    health: 0,
    wealth: 0,
    justice: 0,
    "cross-platform": 0,
  };
  for (const items of [input.stripeItems, input.cashappItems, input.venmoItems]) {
    for (const item of items) {
      const amount = (item.metadata.amountCents as number | undefined) ?? 0;
      if (amount > 0) byPlatform[item.platform] += amount;
    }
  }

  const anomalies: string[] = [];
  const weeks = input.priorWeeksByRail ?? [];
  if (weeks.length > 0) {
    const avgStripe =
      weeks.reduce((s, w) => s + (w.stripe ?? 0), 0) / Math.max(1, weeks.length);
    if (avgStripe > 0 && byRail.stripe < avgStripe * 0.6) {
      anomalies.push(`Stripe inflow ${Math.round((byRail.stripe / avgStripe) * 100)}% of ${weeks.length}-week average`);
    }
  }

  const mrr = input.mrr ?? null;
  const mrrConfidence: CashPulse["mrrConfidence"] = mrr === null ? "unavailable" : (input.mrrConfidence ?? "low");

  const pricingRecommendation =
    weeks.length >= MIN_WEEKS_FOR_PRICING_REC
      ? null // withheld by default; would require trend analysis
      : null;

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    totalInflow,
    byRail,
    byPlatform,
    mrr,
    mrrConfidence,
    // No expense-tracking source is defined anywhere (no bank CSV, no card feed).
    // Ship null rather than stubbing fake data — see build spec §3.3.
    topExpenseCategory: null,
    pricingRecommendation,
    anomalies,
  };
}

export function renderCashPulse(pulse: CashPulse): string {
  const lines: string[] = [];
  lines.push(`# Cash Pulse — ${pulse.periodStart} → ${pulse.periodEnd}`);
  lines.push(``);
  lines.push(`**Total inflow: ${(pulse.totalInflow / 100).toFixed(2)} (cents: ${pulse.totalInflow})**`);
  lines.push(``);
  lines.push(`| Rail | Inflow (cents) |`);
  lines.push(`|---|---|`);
  for (const [rail, amount] of Object.entries(pulse.byRail)) {
    lines.push(`| ${rail} | ${amount} |`);
  }
  lines.push(``);
  lines.push(`## By Platform`);
  lines.push(``);
  for (const [platform, amount] of Object.entries(pulse.byPlatform)) {
    lines.push(`- ${platform}: ${amount}`);
  }
  lines.push(``);
  lines.push(`## MRR`);
  lines.push(``);
  lines.push(
    pulse.mrr === null
      ? `_Unavailable — subscription data insufficient or not wired. Not estimated._`
      : `${pulse.mrr} (confidence: ${pulse.mrrConfidence})`
  );
  lines.push(``);
  lines.push(`## Anomalies`);
  lines.push(``);
  if (pulse.anomalies.length === 0) lines.push(`_None._`);
  for (const a of pulse.anomalies) lines.push(`- ${a}`);
  lines.push(``);
  lines.push(`## Expense Tracking`);
  lines.push(``);
  lines.push(
    pulse.topExpenseCategory === null
      ? `_No expense-tracking source defined. Field intentionally null — not stubbed._`
      : pulse.topExpenseCategory
  );
  return lines.join("\n");
}
