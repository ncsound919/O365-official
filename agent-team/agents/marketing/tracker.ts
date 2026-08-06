/**
 * Marketing team member — The Tracker (performance analyst).
 *
 * Deterministic aggregation of engagement metrics from an imported JSON/CSV
 * source. Null-safe like the Treasurer: metrics without a data source stay
 * unavailable rather than estimated.
 */
export interface EngagementRow {
  postId: string;
  platform: string;
  impressions: number;
  engagements: number;
  postedAt: string; // ISO
}

export interface PerformanceReport {
  periodStart: string;
  periodEnd: string;
  status: "available" | "unavailable";
  totalImpressions: number | null;
  totalEngagements: number | null;
  engagementRatePct: number | null;
  byPlatform: Record<string, { impressions: number; engagements: number }>;
  anomalies: string[];
  dataSource: string | null;
}

const EMPTY_BY_PLATFORM: Record<string, { impressions: number; engagements: number }> = {};

export function analyzePerformance(
  rows: EngagementRow[],
  opts: {
    periodStart: string;
    periodEnd: string;
    priorWeeks?: Array<{ impressions: number; engagements: number }>;
    dataSource?: string | null;
  }
): PerformanceReport {
  if (rows.length === 0) {
    return {
      periodStart: opts.periodStart,
      periodEnd: opts.periodEnd,
      status: "unavailable",
      totalImpressions: null,
      totalEngagements: null,
      engagementRatePct: null,
      byPlatform: { ...EMPTY_BY_PLATFORM },
      anomalies: ["No engagement data imported for this period."],
      dataSource: opts.dataSource ?? null,
    };
  }

  const byPlatform: PerformanceReport["byPlatform"] = {};
  let impressions = 0;
  let engagements = 0;
  for (const row of rows) {
    impressions += row.impressions;
    engagements += row.engagements;
    const p = byPlatform[row.platform] ?? { impressions: 0, engagements: 0 };
    p.impressions += row.impressions;
    p.engagements += row.engagements;
    byPlatform[row.platform] = p;
  }

  const engagementRatePct = impressions > 0 ? (engagements / impressions) * 100 : 0;

  const anomalies: string[] = [];
  const prior = opts.priorWeeks ?? [];
  if (prior.length > 0) {
    const avgImp = prior.reduce((s, w) => s + w.impressions, 0) / prior.length;
    if (avgImp > 0 && impressions < avgImp * 0.6) {
      anomalies.push(`Impressions ${Math.round((impressions / avgImp) * 100)}% of ${prior.length}-week average`);
    }
  }

  return {
    periodStart: opts.periodStart,
    periodEnd: opts.periodEnd,
    status: "available",
    totalImpressions: impressions,
    totalEngagements: engagements,
    engagementRatePct,
    byPlatform,
    anomalies,
    dataSource: opts.dataSource ?? "imported",
  };
}
