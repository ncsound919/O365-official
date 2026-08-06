/**
 * Report renderer — AgentReport JSON -> Markdown.
 *
 * Single source of truth: markdown is always regenerated from the JSON data
 * structure, never hand-written separately.
 */
import type { AgentReport, EvidenceCluster } from "./types.js";

function clusterSection(cluster: EvidenceCluster, labelOverride?: string): string {
  return [
    `### ${labelOverride ?? cluster.label} _(score ${cluster.score})_`,
    ``,
    `- **Type:** ${cluster.type} · **Severity:** ${cluster.severity} · **Brand:** ${cluster.brandAlignment}`,
    `- **Frequency:** ${cluster.frequency} (${cluster.frequencyPct.toFixed(1)}% of period)`,
    `- **Platforms:** ${cluster.platforms.join(", ")}`,
    `- **Audit trail (${cluster.itemIds.length}):** ${cluster.itemIds.join(", ")}`,
  ].join("\n");
}

export function renderAgentReport(report: AgentReport, clusterLabels?: Record<string, string>): string {
  const lines: string[] = [];
  lines.push(`# ${report.agentName} Report`);
  lines.push(``);
  lines.push(
    `**Period:** ${report.periodStart} → ${report.periodEnd} · **Items processed:** ${report.coverage.totalItemsProcessed}`
  );
  lines.push(``);
  lines.push(`## Coverage`);
  lines.push(``);
  lines.push(`| Platform | Items |`);
  lines.push(`|---|---|`);
  for (const [platform, count] of Object.entries(report.coverage.byPlatform)) {
    lines.push(`| ${platform} | ${count} |`);
  }
  lines.push(`| excluded | ${report.coverage.excludedCount} |`);
  if (report.coverage.excludedReasons.length) {
    lines.push(`| excluded reasons | ${report.coverage.excludedReasons.join("; ")} |`);
  }
  lines.push(``);

  lines.push(`## Clusters`);
  lines.push(``);
  if (report.clusters.length === 0) {
    lines.push(`_No clusters above threshold._`);
  } else {
    for (const cluster of report.clusters) {
      lines.push(clusterSection(cluster, clusterLabels?.[cluster.id]));
      lines.push(``);
    }
  }

  lines.push(`## Watch List`);
  lines.push(``);
  if (report.watchList.length === 0) {
    lines.push(`_None._`);
  } else {
    for (const item of report.watchList) {
      lines.push(`- [${item.id}] ${item.rawText.slice(0, 200)}`);
    }
  }
  lines.push(``);

  lines.push(`## Flags`);
  lines.push(``);
  for (const flag of report.flags) lines.push(`- ${flag}`);
  lines.push(``);

  lines.push(`## Recommendations`);
  lines.push(``);
  for (const rec of report.recommendations) lines.push(`1. ${rec}`);
  lines.push(``);

  lines.push(`## Confidence Note`);
  lines.push(``);
  lines.push(report.confidenceNote);

  return lines.join("\n");
}
