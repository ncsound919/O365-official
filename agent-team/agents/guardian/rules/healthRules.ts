/**
 * Guardian — compliance rule corpus (Health).
 * Empty until the user uploads content guidelines / medical-adjacent rules.
 */
export interface ComplianceRule {
  id: string;
  sourceDocument: string;
  ruleSummary: string;
  triggerPatterns: string[];
}

export function getHealthRules(): ComplianceRule[] {
  return [];
}
