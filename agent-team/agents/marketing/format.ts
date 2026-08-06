/**
 * Marketing team member — The Format Auditor.
 *
 * Deterministic per-platform content-format validation (character limits,
 * hashtag ceilings, link requirements). Mirrors the Auditor's pass/fail style.
 */
import type { MarketingPlatform } from "./scheduler.js";

export interface FormatConstraint {
  platform: MarketingPlatform;
  maxChars: number;
  maxHashtags: number;
  linkRequired: boolean;
}

export const DEFAULT_FORMAT_CONSTRAINTS: FormatConstraint[] = [
  { platform: "x", maxChars: 280, maxHashtags: 3, linkRequired: false },
  { platform: "instagram", maxChars: 2200, maxHashtags: 30, linkRequired: false },
  { platform: "linkedin", maxChars: 3000, maxHashtags: 5, linkRequired: true },
  { platform: "facebook", maxChars: 63206, maxHashtags: 5, linkRequired: false },
  { platform: "tiktok", maxChars: 2200, maxHashtags: 5, linkRequired: false },
];

export interface FormatIssue {
  postId: string;
  platform: MarketingPlatform;
  issues: string[];
}

export function auditFormats(
  posts: Array<{ id: string; platform: MarketingPlatform; text: string }>,
  constraints: FormatConstraint[] = DEFAULT_FORMAT_CONSTRAINTS
): FormatIssue[] {
  const results: FormatIssue[] = [];
  for (const post of posts) {
    const constraint = constraints.find((c) => c.platform === post.platform);
    if (!constraint) {
      results.push({ postId: post.id, platform: post.platform, issues: ["unknown platform constraints"] });
      continue;
    }
    const issues: string[] = [];
    const chars = Array.from(post.text).length;
    if (chars > constraint.maxChars) {
      issues.push(`over ${constraint.maxChars}-char limit (${chars})`);
    }
    const hashtags = (post.text.match(/#\w+/g) ?? []).length;
    if (hashtags > constraint.maxHashtags) {
      issues.push(`over ${constraint.maxHashtags} hashtag limit (${hashtags})`);
    }
    if (constraint.linkRequired && !/https?:\/\/\S+/.test(post.text)) {
      issues.push("link required");
    }
    if (issues.length > 0) results.push({ postId: post.id, platform: post.platform, issues });
  }
  return results;
}
