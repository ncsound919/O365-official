/**
 * Guardian — user complaints filter.
 * Reuses the Strategist's support-email evidence; keyword-classifies items as
 * likely legal or medical complaints (rule-based first pass, audit-logged).
 */
import type { EvidenceItem } from "../../shared/types.js";

const LEGAL_HINTS = ["legal", "lawsuit", "sue", "terms", "tos", "privacy", "refund", "liability", "contract"];
const HEALTH_HINTS = ["medical", "doctor", "diagnosis", "treatment", "health", "dosage", "symptom", "side effect"];

export function filterLegalHealthComplaints(items: EvidenceItem[]): EvidenceItem[] {
  return items.filter((item) => {
    const text = item.rawText.toLowerCase();
    return LEGAL_HINTS.some((h) => text.includes(h)) || HEALTH_HINTS.some((h) => text.includes(h));
  });
}

export function complaintCategory(item: EvidenceItem): "legal" | "health" | "both" | "none" {
  const text = item.rawText.toLowerCase();
  const legal = LEGAL_HINTS.some((h) => text.includes(h));
  const health = HEALTH_HINTS.some((h) => text.includes(h));
  if (legal && health) return "both";
  if (legal) return "legal";
  if (health) return "health";
  return "none";
}
