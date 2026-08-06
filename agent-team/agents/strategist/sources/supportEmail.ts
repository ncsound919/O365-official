/**
 * Strategist source adapter — support email.
 *
 * Only confirmed live channel on the Overlay365 sites is the contact email.
 * Until a Gmail/inbox API is wired, this is a manual-import stub that reads an
 * exported JSON array of messages.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import type { EvidenceItem, Platform } from "../../shared/types.js";

export interface SourceAdapter {
  name: string;
  fetch(periodStart: string, periodEnd: string): Promise<EvidenceItem[]>;
}

export interface ImportedEmail {
  id: string;
  from: string;
  receivedAt: string; // ISO 8601
  subject: string;
  body: string;
  platform?: Platform;
}

export function fetchFromExportedJson(filepath: string): ImportedEmail[] {
  const raw = fs.readFileSync(filepath, "utf-8");
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error("support-email export must be a JSON array");
  return parsed as ImportedEmail[];
}

export function toEvidenceItems(emails: ImportedEmail[]): EvidenceItem[] {
  return emails.map((email) => {
    const rawText = `Subject: ${email.subject}\nBody: ${email.body}`;
    const platform: Platform = email.platform ?? "cross-platform";
    const missing = !email.receivedAt || !email.subject;
    return {
      id: `ev${createHash("sha256").update(`support-email:${email.id}`).digest("hex").slice(0, 16)}`,
      source: "support-email",
      platform,
      rawText,
      timestamp: email.receivedAt,
      channel: "contact-form",
      metadata: { from: email.from, emailId: email.id },
      confidence: missing ? "low" : "high",
    };
  });
}
