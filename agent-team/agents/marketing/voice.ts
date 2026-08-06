/**
 * Marketing team member — The Voice Keeper (brand-voice guard).
 *
 * Deterministic: matches draft posts against a brand-tone rule corpus.
 * Fail-closed like the Guardian: with an empty corpus it flags exactly once and
 * evaluates nothing, rather than guessing brand tone.
 */
export interface VoiceRule {
  id: string;
  /** e.g. "overlay365-brand-guidelines-v1.md" — must be uploaded by the user. */
  sourceDocument: string;
  ruleSummary: string;
  kind: "forbidden" | "required" | "pattern";
  /** forbidden: banned terms/phrases; required: must-appear tokens; pattern: regex. */
  terms: string[];
  pattern?: string;
}

export interface VoiceCheckResult {
  postId: string;
  ruleMatches: Array<{ ruleId: string; kind: string; matched: string }>;
  verdict: "pass" | "review";
  corpusStatus: "loaded" | "missing";
}

export interface VoiceReport {
  corpusStatus: "loaded" | "missing";
  checks: VoiceCheckResult[];
}

/** Empty until the user uploads Overlay365 brand guidelines. */
export function getBrandVoiceRules(): VoiceRule[] {
  return [];
}

export function checkVoice(posts: Array<{ id: string; text: string }>, rules: VoiceRule[] = getBrandVoiceRules()): VoiceReport {
  if (rules.length === 0) {
    return {
      corpusStatus: "missing",
      checks: [
        {
          postId: "system-voice-corpus-missing",
          ruleMatches: [],
          verdict: "review",
          corpusStatus: "missing",
        },
      ],
    };
  }

  const checks: VoiceCheckResult[] = [];
  for (const post of posts) {
    const ruleMatches: VoiceCheckResult["ruleMatches"] = [];
    for (const rule of rules) {
      if (rule.kind === "forbidden") {
        for (const term of rule.terms) {
          if (post.text.toLowerCase().includes(term.toLowerCase())) {
            ruleMatches.push({ ruleId: rule.id, kind: rule.kind, matched: term });
          }
        }
      } else if (rule.kind === "required") {
        for (const term of rule.terms) {
          if (!post.text.toLowerCase().includes(term.toLowerCase())) {
            ruleMatches.push({ ruleId: rule.id, kind: rule.kind, matched: `missing "${term}"` });
          }
        }
      } else if (rule.pattern) {
        if (new RegExp(rule.pattern, "i").test(post.text)) {
          ruleMatches.push({ ruleId: rule.id, kind: rule.kind, matched: "pattern hit" });
        }
      }
    }
    checks.push({
      postId: post.id,
      ruleMatches,
      verdict: ruleMatches.length > 0 ? "review" : "pass",
      corpusStatus: "loaded",
    });
  }
  return { corpusStatus: "loaded", checks };
}
