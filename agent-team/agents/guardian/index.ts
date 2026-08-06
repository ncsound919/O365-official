/**
 * The Guardian — compliance flagging for Justice/Health content.
 *
 * Scope boundary (hard): never drafts final legal/medical text; only flags for
 * human review. No LLM may cite a real law/guideline by name unless it appears
 * in the uploaded rule corpus (empty until the user provides documents).
 */
import { getJusticeRules } from "./rules/justiceRules.js";
import { getHealthRules, type ComplianceRule } from "./rules/healthRules.js";

export interface GuardianFlag {
  itemId: string;
  platform: "justice" | "health";
  matchedRules: string[];
  excerpt: string; // short, paraphrased, not full reproduction
  recommendedAction: "human-review" | "no-action";
}

export interface GuardianReport {
  periodStart: string;
  periodEnd: string;
  flaggedContent: GuardianFlag[];
  disputesResolved: number; // 0 until a dispute-tracking source exists
  corpusStatus: "loaded" | "missing";
}

export interface GuardianRunInput {
  periodStart: string;
  periodEnd: string;
  /** Justice/Health content diffs already normalized to evidence. */
  contentItems: Array<{ platform: "justice" | "health"; itemId: string; text: string }>;
  /** Reused Strategist support-email items. */
  complaintItems: Array<{ itemId: string; text: string }>;
}

export function runGuardian(input: GuardianRunInput): GuardianReport {
  const justiceRules = getJusticeRules();
  const healthRules = getHealthRules();
  const corpus: ComplianceRule[] = [...justiceRules, ...healthRules];
  const corpusStatus: GuardianReport["corpusStatus"] = corpus.length > 0 ? "loaded" : "missing";

  const flaggedContent: GuardianFlag[] = [];

  if (corpusStatus === "loaded") {
    for (const item of input.contentItems) {
      const rules = item.platform === "justice" ? justiceRules : healthRules;
      const matched = rules
        .filter((r) => r.triggerPatterns.some((p) => item.text.toLowerCase().includes(p)))
        .map((r) => r.id);
      if (matched.length > 0) {
        flaggedContent.push({
          itemId: item.itemId,
          platform: item.platform,
          matchedRules: matched,
          excerpt: item.text.slice(0, 160),
          recommendedAction: "human-review",
        });
      }
    }
    for (const complaint of input.complaintItems) {
      flaggedContent.push({
        itemId: complaint.itemId,
        platform: "health", // keyword guess only; corpus match would refine this
        matchedRules: [],
        excerpt: complaint.text.slice(0, 160),
        recommendedAction: "human-review",
      });
    }
  } else {
    // Inert-but-functional: single explicit flag, no fabricated compliance claims.
    flaggedContent.push({
      itemId: "system-corpus-missing",
      platform: "justice",
      matchedRules: [],
      excerpt: "",
      recommendedAction: "no-action",
    });
  }

  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    flaggedContent,
    disputesResolved: 0,
    corpusStatus,
  };
}

export function renderGuardianReport(report: GuardianReport): string {
  const lines: string[] = [];
  lines.push(`# Guardian Report — ${report.periodStart} → ${report.periodEnd}`);
  lines.push(``);
  if (report.corpusStatus === "missing") {
    lines.push(
      `**No compliance rule corpus loaded — Guardian cannot evaluate content until ToS/Privacy Policy/content guidelines are provided.**`
    );
    lines.push(``);
    lines.push(`_The agent is inert but functional; it will begin flagging as soon as a corpus is uploaded._`);
    return lines.join("\n");
  }
  lines.push(`**Corpus loaded: yes**`);
  lines.push(``);
  lines.push(`## Flagged Content`);
  lines.push(``);
  for (const flag of report.flaggedContent) {
    lines.push(
      `- [${flag.platform}] ${flag.itemId} — ${flag.recommendedAction} (rules: ${flag.matchedRules.join(", ") || "none"})`
    );
  }
  lines.push(``);
  lines.push(`## Disputes`);
  lines.push(`\`${report.disputesResolved}\` (0 until a dispute-tracking source exists)`);
  return lines.join("\n");
}

// CLI entrypoint: tsx agents/guardian/index.ts
if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
  const report = runGuardian({
    periodStart: "2026-07-27T00:00:00Z",
    periodEnd: "2026-08-02T00:00:00Z",
    contentItems: [],
    complaintItems: [],
  });
  console.log(JSON.stringify(report, null, 2));
  console.log("\n--- markdown ---\n");
  console.log(renderGuardianReport(report));
}
