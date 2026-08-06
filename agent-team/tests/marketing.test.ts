import { describe, expect, it } from "vitest";
import { runMarketingTeam } from "../agents/marketing/index.js";
import { checkVoice, type VoiceRule } from "../agents/marketing/voice.js";
import { auditFormats } from "../agents/marketing/format.js";
import { buildCalendar } from "../agents/marketing/scheduler.js";
import { analyzePerformance } from "../agents/marketing/tracker.js";

describe("marketing team", () => {
  it("lead consolidates members into a Marketing Pulse with cited action items", () => {
    const pulse = runMarketingTeam({
      weekOf: "2026-08-03",
      topicSeeds: ["overlay health", "wealth tips"],
      draftPosts: [
        { id: "p1", platform: "x", text: "Big announcement https://overlay365.com #a #b #c #d #e #f #g #h #i #j #k" },
        { id: "p2", platform: "linkedin", text: "no link in this post" },
      ],
      engagementRows: [
        { postId: "p1", platform: "x", impressions: 1000, engagements: 50, postedAt: "2026-08-03T09:00:00Z" },
      ],
      priorWeeks: [
        { impressions: 3000, engagements: 150 },
        { impressions: 3200, engagements: 160 },
      ],
    });
    expect(pulse.voice.corpusStatus).toBe("missing");
    expect(pulse.calendar.length).toBeGreaterThan(0);
    // p1 exceeds hashtag limit on x (10 > 3); p2 missing required link on linkedin.
    expect(pulse.formatFails.some((f) => f.postId === "p1")).toBe(true);
    expect(pulse.formatFails.some((f) => f.postId === "p2")).toBe(true);
    // Impressions below 60% of 2-week average (1000 < 1860) → anomaly.
    expect(pulse.actionItems.some((a) => a.startsWith("[Tracker]"))).toBe(true);
    expect(pulse.actionItems.some((a) => a.startsWith("[Voice Keeper]"))).toBe(true);
    // Deterministic: no LLM anywhere.
    expect(JSON.stringify(pulse)).not.toContain("llm");
  });

  it("voice guard is fail-closed with an empty corpus", () => {
    const report = checkVoice([{ id: "p1", text: "anything" }], []);
    expect(report.corpusStatus).toBe("missing");
    expect(report.checks[0]!.postId).toBe("system-voice-corpus-missing");
  });

  it("voice guard flags forbidden terms when a corpus is loaded", () => {
    const rules: VoiceRule[] = [
      { id: "vr1", sourceDocument: "overlay365-brand.md", ruleSummary: "no hype words", kind: "forbidden", terms: ["guaranteed"] },
    ];
    const report = checkVoice(
      [{ id: "p1", text: "This result is guaranteed!" }, { id: "p2", text: "learn more" }],
      rules
    );
    expect(report.corpusStatus).toBe("loaded");
    expect(report.checks[0]!.verdict).toBe("review");
    expect(report.checks[1]!.verdict).toBe("pass");
  });

  it("scheduler produces a deterministic plan and rotates topic seeds", () => {
    const { posts } = buildCalendar("2026-08-03", ["topic-a", "topic-b"]);
    const aCount = posts.filter((p) => p.topic === "topic-a").length;
    expect(aCount).toBeGreaterThan(0);
    expect(posts.every((p) => p.status === "planned")).toBe(true);
  });

  it("tracker returns unavailable (nulls) when no data imported", () => {
    const report = analyzePerformance([], { periodStart: "a", periodEnd: "b" });
    expect(report.status).toBe("unavailable");
    expect(report.totalImpressions).toBeNull();
    expect(report.engagementRatePct).toBeNull();
  });
});
