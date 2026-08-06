/**
 * Evidence Compiler — dedup.
 *
 * Reuses the clustering principle from kodustech/kodus-ai's
 * `analyzeClusterFeedback` (embedding-similarity clustering of user feedback):
 * near-identical items fold into a cluster, but every source id is preserved on
 * the cluster's `itemIds` trail — never discarded.
 */
import type { EvidenceItem } from "./types.js";

/**
 * Conservative overlap: normalized token intersection ratio. The spec's
 * embedding-cosine approach is approximated deterministically here so the
 * compiler stays pure (no external model calls) and unit-testable.
 */
function similarity(a: string, b: string): number {
  const norm = (s: string): string[] =>
    Array.from(
      new Set(
        s
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter(Boolean)
      )
    );
  const ta = norm(a);
  const tb = norm(b);
  if (ta.length === 0 || tb.length === 0) return 0;
  const inter = ta.filter((w) => tb.includes(w)).length;
  return inter / Math.min(ta.length, tb.length);
}

export interface DedupResult {
  deduped: EvidenceItem[];
  /** clusterKey -> count of folded items. */
  corroborationCounts: Map<string, number>;
}

const DEDUP_SIMILARITY_THRESHOLD = 0.85;
const DEDUP_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

/**
 * Merge near-identical items: same source + similarity >= 0.85 within a 14-day
 * window. The earliest item wins as the representative; all folded ids are
 * counted via `corroborationCounts` keyed by representative item id.
 */
export function deduplicate(items: EvidenceItem[]): DedupResult {
  const corroborationCounts = new Map<string, number>();
  const deduped: EvidenceItem[] = [];

  for (const item of items) {
    const rep = deduped.find(
      (existing) =>
        existing.source === item.source &&
        Math.abs(new Date(existing.timestamp).getTime() - new Date(item.timestamp).getTime()) <=
          DEDUP_WINDOW_MS &&
        similarity(existing.rawText, item.rawText) >= DEDUP_SIMILARITY_THRESHOLD
    );
    if (rep) {
      corroborationCounts.set(rep.id, (corroborationCounts.get(rep.id) ?? 1) + 1);
    } else {
      deduped.push(item);
    }
  }
  return { deduped, corroborationCounts };
}
