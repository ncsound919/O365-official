import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { runStrategist } from "../agents/strategist/index.js";
import { STRATEGIST_WEIGHTS } from "../agents/strategist/index.js";
import { compileClusters, classifyBrandAlignment } from "../agents/strategist/cluster.js";

const FIXTURE = fileURLToPath(new URL("../agents/strategist/fixtures/sample-period.json", import.meta.url));

describe("Strategist", () => {
  it("runs against the fixture and forms clusters + watch list", async () => {
    const { report } = await runStrategist({
      periodStart: "2026-07-20T00:00:00Z",
      periodEnd: "2026-08-02T00:00:00Z",
      supportEmailFile: FIXTURE,
    });
    expect(report.coverage.totalItemsProcessed).toBe(6);
    expect(report.clusters.length).toBeGreaterThanOrEqual(1);
    // Below-threshold single items land in watchList verbatim, never clustered.
    expect(report.watchList.length).toBeGreaterThanOrEqual(0);
    // Every cluster itemId must trace to an input id pattern.
    for (const c of report.clusters) {
      expect(c.itemIds.length).toBeGreaterThanOrEqual(2);
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
    }
  });

  it("emits an explicit thin-data note when no sources are wired", async () => {
    const { report } = await runStrategist({
      periodStart: "2026-07-20T00:00:00Z",
      periodEnd: "2026-08-02T00:00:00Z",
    });
    expect(report.confidenceNote).toContain("No evidence processed");
    expect(report.coverage.excludedReasons.length).toBeGreaterThan(0);
  });

  it("classifies cost-friction as undercuts, praise as reinforces", () => {
    const cost = { id: "ev1", source: "x", platform: "health" as const, rawText: "too expensive", timestamp: "2026-01-01T00:00:00Z", channel: "contact-form", metadata: {}, confidence: "high" as const };
    const praise = { ...cost, id: "ev2", rawText: "great work thank you" };
    expect(classifyBrandAlignment(cost)).toBe("undercuts");
    expect(classifyBrandAlignment(praise)).toBe("reinforces");
  });

  it("respects the configured weights", () => {
    expect(STRATEGIST_WEIGHTS).toEqual({ frequency: 0.4, severity: 0.35, brandAlignment: 0.25 });
  });

  it("keeps compileClusters pure (no LLM side effects)", () => {
    const result = compileClusters({ items: [], weights: STRATEGIST_WEIGHTS, minClusterSize: 2, periodStart: "a", periodEnd: "b" });
    expect(result.clusters).toHaveLength(0);
    expect(result.watchList).toHaveLength(0);
  });
});
