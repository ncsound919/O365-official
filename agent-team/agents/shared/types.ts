/**
 * Shared types for the Overlay365 agent team.
 *
 * Every agent produces `AgentReport`-shaped output. The audit-first rule is
 * structural: every `EvidenceCluster` carries `itemIds` (the full trace back to
 * raw input records) and no claim may appear in output that cannot be traced to
 * an input record.
 */

export type Platform = "health" | "wealth" | "justice" | "cross-platform";

export const PLATFORMS: Platform[] = ["health", "wealth", "justice", "cross-platform"];

export type Severity = "low" | "med" | "high";
export type ClusterType =
  | "bug"
  | "feature"
  | "friction"
  | "confusion"
  | "praise"
  | "risk"
  | "other";
export type BrandAlignment = "reinforces" | "neutral" | "undercuts";

export interface EvidenceItem {
  /** Stable hash of source+rawId. */
  id: string;
  /** e.g. "stripe", "github-issues", "support-email". */
  source: string;
  platform: Platform;
  /** Original, unmodified text. */
  rawText: string;
  /** ISO 8601. */
  timestamp: string;
  /** e.g. "contact-form", "webhook", "api-poll". */
  channel: string;
  /** Source-specific extra fields. */
  metadata: Record<string, unknown>;
  /** "low" if required fields were missing/inferred. */
  confidence: "high" | "low";
}

export interface EvidenceCluster {
  id: string;
  /** Short human-readable label for the cluster. */
  label: string;
  /** EvidenceItem.id[] — the audit trail. */
  itemIds: string[];
  platforms: Platform[];
  /** Raw count. */
  frequency: number;
  /** % of period total. */
  frequencyPct: number;
  severity: Severity;
  type: ClusterType;
  brandAlignment: BrandAlignment;
  /** 0-100, see per-agent weighting. */
  score: number;
}

export interface AgentReport {
  agentName: string;
  periodStart: string;
  periodEnd: string;
  coverage: {
    totalItemsProcessed: number;
    byPlatform: Record<Platform, number>;
    excludedCount: number;
    excludedReasons: string[];
  };
  clusters: EvidenceCluster[];
  /** Single-mention / below-threshold items, verbatim. */
  watchList: EvidenceItem[];
  /** Free-text warnings (e.g. cross-platform imbalance). */
  flags: string[];
  /** Ranked, tied to cluster IDs. */
  recommendations: string[];
  /** Explicit statement on data thinness. */
  confidenceNote: string;
}
