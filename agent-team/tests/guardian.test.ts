import { describe, expect, it } from "vitest";
import { runGuardian } from "../agents/guardian/index.js";
import { getJusticeRules } from "../agents/guardian/rules/justiceRules.js";
import { getHealthRules } from "../agents/guardian/rules/healthRules.js";
import { complaintCategory } from "../agents/guardian/sources/userComplaints.js";

describe("Guardian", () => {
  it("is inert-but-functional when the corpus is missing", () => {
    const report = runGuardian({
      periodStart: "a",
      periodEnd: "b",
      contentItems: [{ platform: "justice", itemId: "ev1", text: "some content" }],
      complaintItems: [],
    });
    expect(report.corpusStatus).toBe("missing");
    expect(report.flaggedContent.length).toBeGreaterThan(0);
    expect(report.flaggedContent[0]!.itemId).toBe("system-corpus-missing");
    expect(report.flaggedContent[0]!.recommendedAction).toBe("no-action");
  });

  it("exports an empty rule set until documents are uploaded (no placeholder rules)", () => {
    expect(getJusticeRules()).toEqual([]);
    expect(getHealthRules()).toEqual([]);
  });

  it("disputesResolved is 0 until a dispute source exists", () => {
    const report = runGuardian({ periodStart: "a", periodEnd: "b", contentItems: [], complaintItems: [] });
    expect(report.disputesResolved).toBe(0);
  });

  it("classifies legal vs health complaint categories", () => {
    const legal = { id: "ev1", source: "x", platform: "justice" as const, rawText: "I want to sue over these terms", timestamp: "2026-01-01T00:00:00Z", channel: "contact-form", metadata: {}, confidence: "high" as const };
    const health = { ...legal, id: "ev2", rawText: "my doctor said this dosage is wrong" };
    expect(complaintCategory(legal)).toBe("legal");
    expect(complaintCategory(health)).toBe("health");
  });
});
