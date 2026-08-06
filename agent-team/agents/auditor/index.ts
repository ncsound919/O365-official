/**
 * Auditor agent — deterministic weekly checks. No LLM harness.
 */
import { checkUptime, type UptimeResult } from "./checks/uptime.js";
import { checkBrokenLinks, type BrokenLinkResult } from "./checks/brokenLinks.js";
import { checkPaymentFlow, type PaymentFlowResult } from "./checks/paymentFlowIntegrity.js";
import { checkDataConsistency } from "./checks/dataConsistency.js";
import { checkRepoHealth, type RepoHealthResult, type RepoHealthOptions } from "./checks/repoHealth.js";

export interface AuditorReport {
  runTimestamp: string;
  uptime: UptimeResult[];
  brokenLinks: BrokenLinkResult[];
  paymentFlow: PaymentFlowResult;
  dataConsistency: ConsistencyUnion;
  repoHealth: RepoHealthResult[];
  overallStatus: "healthy" | "degraded" | "critical";
}

type ConsistencyUnion = ReturnType<typeof checkDataConsistency>;

export interface AuditorRunInput {
  sites: string[];
  /** Optional product labels for each site (e.g. "Overlay Health"). */
  siteLabels?: string[];
  paymentLinks: Array<{ name: string; url: string }>;
  /** Crawl target for broken-link check. */
  crawlBaseUrl?: string;
  /** Supply-chain/SCA checks (heisenberg + optional dep-scan/nuclei). */
  repoHealth?: RepoHealthOptions;
}

export async function runAuditor(input: AuditorRunInput): Promise<AuditorReport> {
  const uptime = await checkUptime(input.sites);
  const brokenLinks = input.crawlBaseUrl ? await checkBrokenLinks(input.crawlBaseUrl) : [];
  const paymentFlow = await checkPaymentFlow(input.paymentLinks);
  const dataConsistency = checkDataConsistency();
  const repoHealth = checkRepoHealth(input.repoHealth);

  const downCount = uptime.filter((u) => !u.ok).length;
  const brokenCount = brokenLinks.filter((b) => !b.ok).length;
  const paymentDegraded = paymentFlow.overall !== "ok";
  const repoFail = repoHealth.some((r) => r.status === "fail");

  const overallStatus: AuditorReport["overallStatus"] =
    downCount > 1 ? "critical" : downCount > 0 || paymentDegraded || repoFail ? "degraded" : "healthy";

  // Attach product labels for display (labels[i] corresponds to sites[i]).
  if (input.siteLabels) {
    uptime.forEach((u, i) => {
      if (input.siteLabels?.[i]) u.url = `${input.siteLabels[i]} (${u.url})`;
    });
  }

  return {
    runTimestamp: new Date().toISOString(),
    uptime,
    brokenLinks,
    paymentFlow,
    dataConsistency,
    repoHealth,
    overallStatus,
  };
}

export function renderAuditorReport(report: AuditorReport): string {
  const lines: string[] = [];
  lines.push(`# Auditor Report — ${report.runTimestamp}`);
  lines.push(``);
  lines.push(`**Overall status: ${report.overallStatus}**`);
  lines.push(``);
  lines.push(`## Uptime`);
  lines.push(``);
  for (const u of report.uptime) {
    lines.push(`- ${u.ok ? "OK" : "DOWN"} ${u.url} (${u.statusCode}) ${u.responseTimeMs}ms${u.error ? ` — ${u.error}` : ""}`);
  }
  lines.push(``);
  lines.push(`## Broken Links`);
  lines.push(``);
  if (report.brokenLinks.length === 0) lines.push(`_None found._`);
  for (const b of report.brokenLinks) {
    lines.push(`- [${b.statusCode}] ${b.linkUrl} (from ${b.pageUrl})`);
  }
  lines.push(``);
  lines.push(`## Payment Flow`);
  lines.push(``);
  for (const c of report.paymentFlow.checks) {
    lines.push(`- ${c.ok ? "OK" : "FAIL"} ${c.name} (${c.statusCode})`);
  }
  lines.push(``);
  lines.push(`## Data Consistency`);
  lines.push(``);
  lines.push(
    report.dataConsistency === "not-yet-defined"
      ? `_Not yet defined — awaiting user definition of the shared data model._`
      : `${JSON.stringify(report.dataConsistency)}`
  );
  lines.push(``);
  lines.push(`## Repo / Supply-Chain Health`);
  lines.push(``);
  if (report.repoHealth.length === 0) lines.push(`_Not configured._`);
  for (const r of report.repoHealth) {
    lines.push(`- [${r.status.toUpperCase()}] ${r.check} — ${r.detail}`);
  }
  return lines.join("\n");
}

// CLI entrypoint: tsx agents/auditor/index.ts [--fixture=agents/auditor/fixtures/sample-run.json]
if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
  const argFixture = process.argv.find((a) => a.startsWith("--fixture="))?.split("=")[1];
  const fixture = argFixture ?? "agents/auditor/fixtures/sample-run.json";
  const { readFileSync } = await import("node:fs");
  const input = JSON.parse(readFileSync(fixture, "utf-8")) as AuditorRunInput;
  const report = await runAuditor(input);
  console.log(JSON.stringify(report, null, 2));
  console.log("\n--- markdown ---\n");
  console.log(renderAuditorReport(report));
}
