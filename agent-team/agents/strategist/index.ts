/**
 * The Strategist — bi-weekly feedback clustering & roadmap prioritization.
 */
import { compileClusters } from "./cluster.js";
import { toEvidenceItems, fetchFromExportedJson } from "./sources/supportEmail.js";
import type { ScoringWeights } from "../shared/scoring.js";
import { runHarness, type LLMHarnessInput } from "../shared/llmHarness.js";
import { renderAgentReport } from "../shared/reportRenderer.js";
import type { AgentReport, EvidenceItem, Platform } from "../shared/types.js";

export const STRATEGIST_WEIGHTS: ScoringWeights = {
  frequency: 0.4,
  severity: 0.35,
  brandAlignment: 0.25,
};

const MIN_CLUSTER_SIZE = 2; // minimum independent items, per spec §2.2

export interface StrategistRunInput {
  periodStart: string;
  periodEnd: string;
  /** Manually exported support emails. */
  supportEmailFile?: string;
  /** Extra items (e.g. from GitHub issues) already normalized. */
  extraItems?: EvidenceItem[];
  /** Injectable LLM for the narrative layer (optional — falls back to template). */
  callLlm?: (system: string, user: string) => Promise<string>;
}

export async function runStrategist(input: StrategistRunInput): Promise<{
  report: AgentReport;
  markdown: string;
}> {
  const allItems: EvidenceItem[] = [];
  const excludedReasons: string[] = [];

  if (input.supportEmailFile) {
    try {
      const emails = fetchFromExportedJson(input.supportEmailFile);
      allItems.push(...toEvidenceItems(emails));
    } catch (err) {
      excludedReasons.push(`support-email: ${err instanceof Error ? err.message : String(err)}`);
    }
  } else {
    excludedReasons.push("support-email: no export file provided (manual import pending)");
  }

  if (input.extraItems) allItems.push(...input.extraItems);

  const { clusters, watchList } = compileClusters({
    items: allItems,
    weights: STRATEGIST_WEIGHTS,
    minClusterSize: MIN_CLUSTER_SIZE,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
  });

  const byPlatform: Record<Platform, number> = {
    health: 0,
    wealth: 0,
    justice: 0,
    "cross-platform": 0,
  };
  for (const item of allItems) byPlatform[item.platform] += 1;

  const evidenceById = new Map(allItems.map((i) => [i.id, i]));

  let clusterLabels: Record<string, string> = {};
  let recommendations: string[] = [];
  let flags: string[] = [];

  if (input.callLlm && clusters.length > 0) {
    const harnessInput: LLMHarnessInput = {
      clusters,
      evidenceById,
      agentContext:
        "You are The Strategist. Cluster feedback, prioritize roadmap items, and flag brand-alignment risks for Overlay365 (Health/Wealth/Justice sites).",
    };
    const out = await runHarness(harnessInput, { callLlm: input.callLlm });
    clusterLabels = out.clusterLabels;
    recommendations = out.recommendations;
    flags = out.flags;
  } else {
    recommendations = clusters.map((c) =>
      c.brandAlignment === "undercuts"
        ? `Address "${c.label}" (score ${c.score}) — undercuts the low-cost / auditable promise.`
        : `Consider "${c.label}" (score ${c.score}) for roadmap triage.`
    );
  }

  if (allItems.length === 0) {
    flags.push("No data sources produced items this period — report reflects no input.");
  }

  const report: AgentReport = {
    agentName: "The Strategist",
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    coverage: {
      totalItemsProcessed: allItems.length,
      byPlatform,
      excludedCount: 0,
      excludedReasons,
    },
    clusters,
    watchList,
    flags,
    recommendations,
    confidenceNote:
      allItems.length === 0
        ? "No evidence processed. Data is too thin to make claims; recommendations are withheld."
        : `Based on ${allItems.length} items. ${
            allItems.some((i) => i.confidence === "low")
              ? "Some items were low-confidence (missing timestamp/channel) and may affect counts."
              : "All items carried full provenance."
          }`,
  };

  return { report, markdown: renderAgentReport(report, clusterLabels) };
}

// CLI entrypoint: tsx agents/strategist/index.ts --email=fixtures/sample-period.json
if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
  const argEmail = process.argv.find((a) => a.startsWith("--email="))?.split("=")[1];
  runStrategist({
    periodStart: "2026-07-20T00:00:00Z",
    periodEnd: "2026-08-02T00:00:00Z",
    supportEmailFile: argEmail,
  }).then(({ report, markdown }) => {
    console.log(JSON.stringify(report, null, 2));
    console.log("\n--- markdown ---\n");
    console.log(markdown);
  });
}
