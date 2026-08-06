/**
 * Strategist — clustering & classification.
 *
 * Reuses the clusterize-on-similarity principle from kodus-ai's
 * `analyzeClusterFeedback` (cluster suggestions by embedding similarity) but
 * deterministically: token-overlap based, keeping the full itemId audit trail.
 */
import { deduplicate } from "../shared/dedupe.js";
import { scoreCluster, type ScoringWeights } from "../shared/scoring.js";
import type {
  BrandAlignment,
  ClusterType,
  EvidenceCluster,
  EvidenceItem,
  Platform,
} from "../shared/types.js";

const COST_HINTS = ["cost", "price", "pricing", "expensive", "cheap", "free", "$"];
const CONFUSION_HINTS = ["understand", "explain", "how does", "what is", "confus"];

/**
 * Rule-based first pass (per spec §2.4). LLM may only relabel a "neutral" item
 * if it can cite language in rawText — logged in flags either way.
 */
export function classifyBrandAlignment(item: EvidenceItem): BrandAlignment {
  const text = item.rawText.toLowerCase();
  const type = classifyType(item);

  if (type === "friction" && COST_HINTS.some((h) => text.includes(h))) return "undercuts";
  if (type === "confusion" && CONFUSION_HINTS.some((h) => text.includes(h))) return "undercuts";
  if (type === "praise") return "reinforces";
  // bug without cost/clarity language → neutral (explicit category, not a hidden number)
  return "neutral";
}

export function classifyType(item: EvidenceItem): ClusterType {
  const text = item.rawText.toLowerCase();
  if (/bug|broken|error|crash|fails?|won'?t work|not working/.test(text)) return "bug";
  if (/please add|feature|would love|wish|roadmap|request/.test(text)) return "feature";
  if (text.includes("praise") || /love|great|awesome|thank|excellent|amazing/.test(text)) return "praise";
  if (CONFUSION_HINTS.some((h) => text.includes(h))) return "confusion";
  if (/risky|liability|concern|worried|privacy|legal|compliance/.test(text)) return "risk";
  if (/too hard|difficult|friction|annoying|takes too long|hate|too expensive|pricing|cost/.test(text)) return "friction";
  return "other";
}

export function classifySeverity(item: EvidenceItem): "low" | "med" | "high" {
  const type = classifyType(item);
  if (type === "bug") return "high";
  if (type === "risk" || type === "friction") return "med";
  return "low";
}

/** Group items into clusters by similarity (token overlap >= 0.6). */
export function clusterize(items: EvidenceItem[]): Array<EvidenceItem[]> {
  const clusters: Array<EvidenceItem[]> = [];
  const used = new Set<string>();

  for (const item of items) {
    if (used.has(item.id)) continue;
    const group = [item];
    used.add(item.id);
    const norm = (s: string) =>
      Array.from(
        new Set(s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2))
      );
    const tokens = norm(item.rawText);
    for (const other of items) {
      if (used.has(other.id) || other.id === item.id) continue;
      const otherTokens = norm(other.rawText);
      const inter = tokens.filter((t) => otherTokens.includes(t)).length;
      const sim = inter / Math.min(tokens.length, otherTokens.length);
      if (sim >= 0.6) {
        group.push(other);
        used.add(other.id);
      }
    }
    clusters.push(group);
  }
  return clusters;
}

export interface StrategistClusterInput {
  items: EvidenceItem[];
  weights: ScoringWeights;
  /** Minimum independent items for a cluster to leave the watch list. */
  minClusterSize: number;
  periodStart: string;
  periodEnd: string;
}

export interface StrategistCompileResult {
  clusters: EvidenceCluster[];
  watchList: EvidenceItem[];
}

export function compileClusters(input: StrategistClusterInput): StrategistCompileResult {
  const { items } = input;
  const { deduped, corroborationCounts } = deduplicate(items);

  const grouped = clusterize(deduped);
  const periodMaxFreq = Math.max(1, ...grouped.map((g) => g.length));

  const clusters: EvidenceCluster[] = [];
  const watchList: EvidenceItem[] = [];

  for (const group of grouped) {
    const representative = group[0];
    if (!representative) continue;
    // Corroboration counts fold deduped copies; independent items are the group members.
    const independentCount = group.length;
    if (independentCount < input.minClusterSize) {
      watchList.push(...group);
      continue;
    }

    const platforms = Array.from(new Set(group.map((g) => g.platform))) as Platform[];
    const type = classifyType(representative);
    const severity = group.some((g) => classifySeverity(g) === "high")
      ? "high"
      : group.some((g) => classifySeverity(g) === "med")
        ? "med"
        : "low";
    const brandAlignment = classifyBrandAlignment(representative);
    const frequency = independentCount + (corroborationCounts.get(representative.id) ?? 0) - 1;
    const frequencyPct = (frequency / Math.max(1, items.length)) * 100;

    const cluster: Omit<EvidenceCluster, "score"> = {
      id: `cl-${representative.id}`,
      label: representative.rawText.slice(0, 48),
      itemIds: group.map((g) => g.id),
      platforms,
      frequency,
      frequencyPct,
      severity,
      type,
      brandAlignment,
    };

    clusters.push({
      ...cluster,
      score: scoreCluster(cluster, input.weights, periodMaxFreq),
    });
  }

  return { clusters: clusters.sort((a, b) => b.score - a.score), watchList };
}
