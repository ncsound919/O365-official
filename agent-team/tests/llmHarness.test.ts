import { describe, expect, it, vi } from "vitest";
import { runHarness } from "../agents/shared/llmHarness.js";
import type { EvidenceCluster, EvidenceItem } from "../agents/shared/types.js";

function cluster(id: string, itemIds: string[]): EvidenceCluster {
  return {
    id,
    label: "x",
    itemIds,
    platforms: ["health"],
    frequency: itemIds.length,
    frequencyPct: 50,
    severity: "med",
    type: "bug",
    brandAlignment: "neutral",
    score: 60,
  };
}

function evidence(id: string): EvidenceItem {
  return {
    id: `ev${id}`,
    source: "support-email",
    platform: "health",
    rawText: "real text",
    timestamp: "2026-07-21T00:00:00Z",
    channel: "contact-form",
    metadata: {},
    confidence: "high",
  };
}

const REAL_ID = "a".repeat(16);
const FABRICATED_ID = "b".repeat(16);

describe("runHarness", () => {
  it("accepts valid output that cites only real itemIds", async () => {
    const callLlm = vi.fn().mockResolvedValue(
      JSON.stringify({
        clusterLabels: { "cl-a": "Dashboard crash" },
        recommendations: ["[cl-a] fix the crash"],
        flags: [],
      })
    );
    const evidenceById = new Map([[REAL_ID, evidence(REAL_ID)]]);
    const out = await runHarness(
      { clusters: [cluster("cl-a", [REAL_ID])], evidenceById, agentContext: "" },
      { callLlm }
    );
    expect(out.clusterLabels["cl-a"]).toBe("Dashboard crash");
  });

  it("rejects fabricated itemIds and falls back to template-only", async () => {
    const callLlm = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify({ clusterLabels: { "cl-a": "x" }, recommendations: [`ev${FABRICATED_ID}`], flags: [] }))
      .mockResolvedValueOnce(JSON.stringify({ clusterLabels: { "cl-a": "x" }, recommendations: [`ev${FABRICATED_ID}`], flags: [] }));
    const out = await runHarness(
      { clusters: [cluster("cl-a", [REAL_ID])], evidenceById: new Map([[REAL_ID, evidence(REAL_ID)]]), agentContext: "" },
      { callLlm }
    );
    expect(out.recommendations).toHaveLength(0);
    expect(out.flags.some((f) => f.includes("template"))).toBe(true);
    expect(callLlm).toHaveBeenCalledTimes(2); // rejected + retried once, then fallback
  });

  it("falls back to template on non-JSON output", async () => {
    const callLlm = vi.fn().mockResolvedValue("not json at all");
    const out = await runHarness(
      { clusters: [], evidenceById: new Map(), agentContext: "" },
      { callLlm }
    );
    expect(out.flags.some((f) => f.includes("template"))).toBe(true);
  });
});
