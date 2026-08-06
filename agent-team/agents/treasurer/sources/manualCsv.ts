/**
 * Treasurer source — CashApp / Venmo manual CSV import.
 * No reliable public transaction-export API — manual import only.
 * CashApp/Venmo give no platform attribution (donation-oriented); default is
 * "cross-platform".
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import type { EvidenceItem, Platform } from "../../shared/types.js";

export interface ManualCsvRow {
  date: string; // ISO 8601
  amountCents: number; // signed; negative = outflow
  note?: string;
  id?: string;
}

function parseCsv(text: string): ManualCsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
  const rows: ManualCsvRow[] = [];
  for (const line of lines.slice(1)) {
    const cols = line.split(",");
    const get = (name: string) => cols[header.indexOf(name)]?.trim();
    const date = get("date") ?? get("timestamp");
    const amount = get("amount") ?? get("amountcents");
    const note = get("note") ?? get("memo") ?? get("description");
    if (!date || amount === undefined) continue;
    rows.push({
      date,
      amountCents: Math.round(parseFloat(amount) * 100),
      note,
      id: get("id"),
    });
  }
  return rows;
}

export function importManualCsv(filepath: string, platformHint?: Platform): EvidenceItem[] {
  const text = fs.readFileSync(filepath, "utf-8");
  const rows = parseCsv(text);
  const platform: Platform = platformHint ?? "cross-platform";

  return rows.map((row) => {
    const id = row.id ?? `${row.date}:${row.amountCents}:${row.note ?? "anon"}`;
    return {
      id: `ev${createHash("sha256").update(`manual-csv:${id}`).digest("hex").slice(0, 16)}`,
      source: "manual-csv",
      platform,
      rawText: `${row.amountCents >= 0 ? "Inflow" : "Outflow"} ${Math.abs(row.amountCents)} cents${row.note ? ` — ${row.note}` : ""}`,
      timestamp: row.date,
      channel: "manual-csv",
      metadata: { amountCents: row.amountCents, note: row.note },
      confidence: "low", // manual import — provenance is by definition weaker
    };
  });
}
