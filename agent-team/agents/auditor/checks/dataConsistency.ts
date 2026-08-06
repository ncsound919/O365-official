/**
 * Auditor — data consistency.
 *
 * TODO: undefined until the user specifies what "data consistency" means for
 * this system (e.g. whether Health/Wealth/Justice share a user/tier/auth model).
 * Per the spec: DO NOT build speculative checks against an unconfirmed shared
 * data model. This returns "not-yet-defined" until then.
 */
export interface ConsistencyResult {
  check: string;
  status: "not-yet-defined";
  note: string;
}

export function checkDataConsistency(): ConsistencyResult[] | "not-yet-defined" {
  return "not-yet-defined";
}
