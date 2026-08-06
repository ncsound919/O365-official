/**
 * Evidence Compiler — scoring.
 *
 * Pure, deterministic, unit-testable. Mirrors the weights defined per-agent in
 * the build spec (frequency / severity / brand alignment). No LLM, no I/O.
 */
import type { BrandAlignment, EvidenceCluster, Severity } from "./types.js";

export interface ScoringWeights {
  frequency: number;
  severity: number;
  brandAlignment: number;
}

export const SEVERITY_SCORE: Record<Severity, number> = {
  low: 25,
  med: 60,
  high: 100,
};

export const BRAND_ALIGNMENT_SCORE: Record<BrandAlignment, number> = {
  undercuts: 0,
  neutral: 50,
  reinforces: 100,
};

/**
 * frequency is normalized to 0-100 relative to the period max frequency.
 * score = weighted sum, rounded to nearest integer. Pure.
 */
export function scoreCluster(
  cluster: Omit<EvidenceCluster, "score">,
  weights: ScoringWeights,
  periodMaxFrequency: number
): number {
  const maxFreq = Math.max(1, periodMaxFrequency);
  const freqScore = (cluster.frequency / maxFreq) * 100;
  const sevScore = SEVERITY_SCORE[cluster.severity];
  const alignScore = BRAND_ALIGNMENT_SCORE[cluster.brandAlignment];

  const total =
    freqScore * weights.frequency + sevScore * weights.severity + alignScore * weights.brandAlignment;

  return Math.max(0, Math.min(100, Math.round(total)));
}
