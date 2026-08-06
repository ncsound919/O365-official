/**
 * Guardian — compliance rule corpus (Justice).
 *
 * BLOCKING DEPENDENCY: requires the user's actual ToS / Privacy Policy /
 * content guidelines as the reference corpus. Do NOT build placeholder rules.
 * Until those documents are provided this module exports an empty rule set and
 * the agent emits the corpus-missing flag (see agent index).
 */
export interface ComplianceRule {
  id: string;
  /** Must exist and be uploaded by the user. */
  sourceDocument: string;
  ruleSummary: string;
  triggerPatterns: string[];
}

export function getJusticeRules(): ComplianceRule[] {
  return [];
}
