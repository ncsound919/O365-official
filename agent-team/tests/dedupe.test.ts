import { describe, expect, it } from "vitest";
import { deduplicate } from "../agents/shared/dedupe.js";
import type { EvidenceItem } from "../agents/shared/types.js";

function item(id: string, rawText: string, timestamp: string, source = "support-email"): EvidenceItem {
  return {
    id: `ev${id.padEnd(16, "0")}`,
    source,
    platform: "cross-platform",
    rawText,
    timestamp,
    channel: "contact-form",
    metadata: {},
    confidence: "high",
  };
}

describe("deduplicate", () => {
  it("merges near-identical items within the 14-day window", () => {
    const a = item("1", "the app crashes when I open the dashboard on my phone", "2026-07-21T00:00:00Z");
    const b = item("2", "the app crashes when I open the dashboard on my phone", "2026-07-22T00:00:00Z");
    const { deduped, corroborationCounts } = deduplicate([a, b]);
    expect(deduped).toHaveLength(1);
    expect(corroborationCounts.get(deduped[0]!.id)).toBe(2);
  });

  it("keeps distinct items separate", () => {
    const a = item("1", "the app crashes when I open the dashboard on my phone", "2026-07-21T00:00:00Z");
    const b = item("2", "please add a dark mode feature to the settings", "2026-07-22T00:00:00Z");
    const { deduped } = deduplicate([a, b]);
    expect(deduped).toHaveLength(2);
  });

  it("does not merge items outside the 14-day window", () => {
    const a = item("1", "same exact message that repeats", "2026-07-01T00:00:00Z");
    const b = item("2", "same exact message that repeats", "2026-08-01T00:00:00Z");
    const { deduped } = deduplicate([a, b]);
    expect(deduped).toHaveLength(2);
  });
});
