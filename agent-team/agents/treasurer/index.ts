/**
 * The Treasurer — weekly cash pulse across Stripe/CashApp/Venmo.
 */
import { reconcile, renderCashPulse, type CashPulse, type Rail } from "./reconcile.js";
import { importManualCsv } from "./sources/manualCsv.js";
import type { EvidenceItem } from "../shared/types.js";

export interface TreasurerRunInput {
  periodStart: string;
  periodEnd: string;
  stripeItems?: EvidenceItem[];
  cashappCsvFile?: string;
  venmoCsvFile?: string;
  mrr?: number | null;
  mrrConfidence?: CashPulse["mrrConfidence"];
  priorWeeksByRail?: Record<Rail, number>[];
}

export async function runTreasurer(input: TreasurerRunInput): Promise<{ pulse: CashPulse; markdown: string }> {
  const cashappItems = input.cashappCsvFile ? importManualCsv(input.cashappCsvFile) : [];
  const venmoItems = input.venmoCsvFile ? importManualCsv(input.venmoCsvFile) : [];

  const pulse = reconcile({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    stripeItems: input.stripeItems ?? [],
    cashappItems,
    venmoItems,
    mrr: input.mrr,
    mrrConfidence: input.mrrConfidence,
    priorWeeksByRail: input.priorWeeksByRail,
  });

  return { pulse, markdown: renderCashPulse(pulse) };
}

// CLI: tsx agents/treasurer/index.ts --cashapp=fixtures/sample-cashapp.csv
if (process.argv[1] && process.argv[1].endsWith("index.ts")) {
  const argCashapp = process.argv.find((a) => a.startsWith("--cashapp="))?.split("=")[1];
  const argVenmo = process.argv.find((a) => a.startsWith("--venmo="))?.split("=")[1];
  runTreasurer({
    periodStart: "2026-07-27T00:00:00Z",
    periodEnd: "2026-08-02T00:00:00Z",
    cashappCsvFile: argCashapp,
    venmoCsvFile: argVenmo,
  }).then(({ pulse, markdown }) => {
    console.log(JSON.stringify(pulse, null, 2));
    console.log("\n--- markdown ---\n");
    console.log(markdown);
  });
}
