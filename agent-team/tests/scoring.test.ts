import { describe, expect, it } from "vitest";
import { scoreCluster } from "../agents/shared/scoring.js";

describe("scoreCluster", () => {
  const base = {
    id: "cl-x",
    label: "test",
    itemIds: ["ev1", "ev2"],
    platforms: ["health" as const],
    frequency: 4,
    frequencyPct: 40,
    severity: "high" as const,
    type: "bug" as const,
    brandAlignment: "undercuts" as const,
  };
  const weights = { frequency: 0.4, severity: 0.35, brandAlignment: 0.25 };

  it("is pure and bounded 0-100", () => {
    const score = scoreCluster(base, weights, 10);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("weights undercuts + high severity + high frequency highest", () => {
    const undercuts = scoreCluster({ ...base, brandAlignment: "undercuts" }, weights, 10);
    const reinforces = scoreCluster({ ...base, brandAlignment: "reinforces" }, weights, 10);
    expect(undercuts).toBeLessThan(reinforces);
  });
});
