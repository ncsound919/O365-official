/**
 * Strategist source — in-app feedback. STUB ONLY.
 * Existence unconfirmed on the Overlay365 platforms. Throw if called.
 */
import type { EvidenceItem } from "../../shared/types.js";

export function fetchInAppFeedback(): Promise<EvidenceItem[]> {
  throw new Error(
    "inAppFeedback: source not confirmed to exist on any Overlay365 platform — do not call until confirmed."
  );
}
