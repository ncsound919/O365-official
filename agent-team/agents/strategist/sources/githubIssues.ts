/**
 * Strategist source adapter — GitHub issues.
 * Uses the GitHub REST API /repos/{owner}/{repo}/issues.
 *
 * NOTE: exact repo names under tap919 must be confirmed by the user before
 * wiring — do not guess.
 */
import { createHash } from "node:crypto";
import type { EvidenceItem } from "../../shared/types.js";

const GITHUB_API = "https://api.github.com";

export interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  created_at: string;
  html_url: string;
  labels?: Array<{ name: string }>;
  state: string;
}

/** Owner/repo pairs. Empty by default until repo names are confirmed. */
export interface GithubIssuesConfig {
  owner: string;
  repos: string[];
  token?: string;
}

export async function fetchGithubIssues(
  config: GithubIssuesConfig,
  periodStart: string,
  periodEnd: string
): Promise<EvidenceItem[]> {
  if (config.repos.length === 0) {
    throw new Error("githubIssues: no repos configured — confirm exact repo names under tap919 first");
  }
  const since = new Date(periodStart).toISOString();
  const until = new Date(periodEnd).toISOString();
  const items: EvidenceItem[] = [];

  for (const repo of config.repos) {
    const url = new URL(`${GITHUB_API}/repos/${config.owner}/${repo}/issues`);
    url.searchParams.set("state", "all");
    url.searchParams.set("since", since);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("sort", "created");
    url.searchParams.set("direction", "asc");

    const res = await fetch(url, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "overlay365-strategist",
        ...(config.token ? { authorization: `Bearer ${config.token}` } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`githubIssues: HTTP ${res.status} for ${repo}`);

    const issues = (await res.json()) as GitHubIssue[];
    for (const issue of issues) {
      if (issue.state === "open" && new Date(issue.created_at) > new Date(until)) continue;
      if (new Date(issue.created_at) > new Date(until)) continue;
      const rawText = `[${repo}] #${issue.number} ${issue.title}\n${issue.body ?? ""}`;
      items.push({
        id: `ev${createHash("sha256").update(`github-issues:${repo}#${issue.number}`).digest("hex").slice(0, 16)}`,
        source: "github-issues",
        platform: "cross-platform",
        rawText,
        timestamp: issue.created_at,
        channel: "api-poll",
        metadata: {
          repo,
          number: issue.number,
          url: issue.html_url,
          state: issue.state,
          labels: issue.labels?.map((l) => l.name) ?? [],
        },
        confidence: "high",
      });
    }
  }
  return items;
}
