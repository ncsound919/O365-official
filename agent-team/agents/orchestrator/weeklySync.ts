/**
 * Orchestrator — weekly Founder Sync memo.
 * Consolidates the 4 agents. An agent with no wired data source returns
 * "not-run" and the memo says so — never fabricate a "no issues found" from an
 * agent that didn't execute.
 */
import type { AgentReport } from "../shared/types.js";
import type { CashPulse } from "../treasurer/reconcile.js";
import type { GuardianReport } from "../guardian/index.js";
import type { AuditorReport } from "../auditor/index.js";

export interface FounderSyncMemo {
  weekOf: string;
  financialHealth: CashPulse | "not-run";
  productInsight: AgentReport | "not-run";
  legalFlags: GuardianReport | "not-run";
  systemHealth: AuditorReport | "not-run";
  actionItems: string[]; // max 5, each cites which agent's output it came from
}

export interface SyncInput {
  weekOf: string;
  financialHealth?: CashPulse | "not-run";
  productInsight?: AgentReport | "not-run";
  legalFlags?: GuardianReport | "not-run";
  systemHealth?: AuditorReport | "not-run";
}

export function weeklySync(input: SyncInput): FounderSyncMemo {
  const actionItems: string[] = [];

  if (input.systemHealth && input.systemHealth !== "not-run") {
    for (const u of input.systemHealth.uptime) {
      if (!u.ok && actionItems.length < 5) {
        actionItems.push(`[Auditor] Site DOWN ${u.url} (${u.statusCode}).`);
      }
    }
    for (const b of input.systemHealth.brokenLinks) {
      if (!b.ok && actionItems.length < 5) {
        actionItems.push(`[Auditor] Broken link ${b.linkUrl} from ${b.pageUrl}.`);
      }
    }
    if (input.systemHealth.overallStatus === "critical" && actionItems.length < 5) {
      actionItems.push("[Auditor] Overall status critical — investigate immediately.");
    }
  }

  if (input.financialHealth && input.financialHealth !== "not-run") {
    for (const a of input.financialHealth.anomalies) {
      if (actionItems.length < 5) actionItems.push(`[Treasurer] ${a}`);
    }
  }

  if (input.productInsight && input.productInsight !== "not-run") {
    for (const rec of input.productInsight.recommendations.slice(0, 2)) {
      if (actionItems.length < 5) actionItems.push(`[Strategist] ${rec}`);
    }
  }

  if (input.legalFlags && input.legalFlags !== "not-run" && input.legalFlags.flaggedContent.length > 0) {
    if (actionItems.length < 5) {
      actionItems.push(
        `[Guardian] ${input.legalFlags.flaggedContent.length} content item(s) need human review.`
      );
    }
  }

  return {
    weekOf: input.weekOf,
    financialHealth: input.financialHealth ?? "not-run",
    productInsight: input.productInsight ?? "not-run",
    legalFlags: input.legalFlags ?? "not-run",
    systemHealth: input.systemHealth ?? "not-run",
    actionItems: actionItems.slice(0, 5),
  };
}

export function renderFounderSync(memo: FounderSyncMemo): string {
  const lines: string[] = [];
  lines.push(`# Founder Sync — ${memo.weekOf}`);
  lines.push(``);
  lines.push(`## Financial Health`);
  lines.push(`\`${memo.financialHealth === "not-run" ? "not-run" : "run"}\``);
  lines.push(`## Product Insight`);
  lines.push(`\`${memo.productInsight === "not-run" ? "not-run" : "run"}\``);
  lines.push(`## Legal Flags`);
  lines.push(`\`${memo.legalFlags === "not-run" ? "not-run" : "run"}\``);
  lines.push(`## System Health`);
  lines.push(`\`${memo.systemHealth === "not-run" ? "not-run" : "run"}\``);
  lines.push(``);
  lines.push(`## Action Items`);
  lines.push(``);
  for (const item of memo.actionItems) lines.push(`- ${item}`);
  return lines.join("\n");
}
