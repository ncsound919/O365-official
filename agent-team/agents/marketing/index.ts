/**
 * The Observer — lead of the deterministic marketing team.
 *
 * Consolidates the four member agents (Voice Keeper, Scheduler, Format Auditor,
 * Tracker) into a weekly Marketing Pulse memo. Every action item cites which
 * member output it came from. Deterministic throughout — no LLM in the core.
 */
import { checkVoice, getBrandVoiceRules, type VoiceReport } from "./voice.js";
import { buildCalendar, type CalendarRule, type ScheduledPost } from "./scheduler.js";
import { auditFormats, type FormatIssue } from "./format.js";
import { analyzePerformance, type EngagementRow, type PerformanceReport } from "./tracker.js";

export interface MarketingPulse {
  weekOf: string;
  voice: VoiceReport;
  calendar: ScheduledPost[];
  formatFails: FormatIssue[];
  performance: PerformanceReport;
  actionItems: string[]; // each cites a member output
}

export interface MarketingRunInput {
  weekOf: string; // ISO date of the Monday
  topicSeeds: string[];
  calendarRules?: CalendarRule[];
  /** Draft posts to voice-check + format-audit. */
  draftPosts?: Array<{ id: string; text: string; platform: string }>;
  engagementRows?: EngagementRow[];
  priorWeeks?: Array<{ impressions: number; engagements: number }>;
}

export function runMarketingTeam(input: MarketingRunInput): MarketingPulse {
  const voice = checkVoice(
    (input.draftPosts ?? []).map((p) => ({ id: p.id, text: p.text })),
    getBrandVoiceRules()
  );

  const { posts } = buildCalendar(input.weekOf, input.topicSeeds, input.calendarRules);

  const formatFails = auditFormats(
    (input.draftPosts ?? []).map((p) => ({ id: p.id, platform: p.platform as never, text: p.text }))
  );

  const performance = analyzePerformance(input.engagementRows ?? [], {
    periodStart: input.weekOf,
    periodEnd: addDays(input.weekOf, 6),
    priorWeeks: input.priorWeeks,
    dataSource: input.engagementRows?.length ? "imported" : null,
  });

  const actionItems: string[] = [];
  if (voice.corpusStatus === "missing") {
    actionItems.push(
      "[Voice Keeper] No brand-voice corpus loaded — upload Overlay365 brand guidelines before voice checks can run."
    );
  } else {
    for (const check of voice.checks) {
      if (check.verdict === "review") {
        actionItems.push(`[Voice Keeper] Post ${check.postId} needs review (${check.ruleMatches.length} rule match).`);
      }
    }
  }
  for (const fail of formatFails) {
    actionItems.push(`[Format Auditor] Post ${fail.postId} (${fail.platform}): ${fail.issues.join("; ")}.`);
  }
  for (const anomaly of performance.anomalies) {
    actionItems.push(`[Tracker] ${anomaly}`);
  }
  if (performance.status === "unavailable") {
    actionItems.push("[Tracker] No engagement data imported — performance section reflects no input.");
  }

  return {
    weekOf: input.weekOf,
    voice,
    calendar: posts,
    formatFails,
    performance,
    actionItems: actionItems.slice(0, 8),
  };
}

export function renderMarketingPulse(pulse: MarketingPulse): string {
  const lines: string[] = [];
  lines.push(`# Marketing Pulse — ${pulse.weekOf}`);
  lines.push(``);
  lines.push(`## Voice`);
  lines.push(`\`${pulse.voice.corpusStatus === "loaded" ? "loaded" : "corpus missing"}\` · ${pulse.voice.checks.length} post check(s)`);
  lines.push(`## Calendar`);
  lines.push(`${pulse.calendar.length} planned post(s) across platforms`);
  lines.push(`## Format Audit`);
  lines.push(pulse.formatFails.length === 0 ? `_Clean._` : `${pulse.formatFails.length} post(s) failed format checks`);
  lines.push(`## Performance`);
  lines.push(
    pulse.performance.status === "available"
      ? `${pulse.performance.totalImpressions} impressions · ${(pulse.performance.engagementRatePct ?? 0).toFixed(2)}% engagement`
      : `_Unavailable — no imported data._`
  );
  lines.push(``);
  lines.push(`## Action Items`);
  lines.push(``);
  for (const item of pulse.actionItems) lines.push(`- ${item}`);
  return lines.join("\n");
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// CLI entrypoint: tsx agents/marketing/index.ts --seeds="overlay health,wealth tips"
if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
  const argSeeds = process.argv.find((a) => a.startsWith("--seeds="))?.split("=").slice(1).join("=");
  const topicSeeds = argSeeds ? argSeeds.split(",").map((s) => s.trim()).filter(Boolean) : ["brand update"];
  const pulse = runMarketingTeam({ weekOf: "2026-08-03", topicSeeds });
  console.log(JSON.stringify(pulse, null, 2));
  console.log("\n--- markdown ---\n");
  console.log(renderMarketingPulse(pulse));
}
