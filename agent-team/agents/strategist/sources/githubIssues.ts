/**
 * Strategist source adapter — GitHub issues.
 * Uses the GitHub REST API /repos/{owner}/{repo}/issues.
 *
 * Account model (confirmed with the owner):
 * - ncsound919  = all NEW builds (primary feedback source)
 * - tap919      = legacy agent repos (secondary)
 * Repo names below were confirmed against the live GitHub API, not guessed.
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

/** Multi-owner config: each owner is one GitHub account with its repos. */
export interface GithubIssuesConfig {
  owners: Array<{ owner: string; repos: string[] }>;
  token?: string;
}

/** List repos for an account — used to wire new owners incrementally. */
export async function discoverRepos(owner: string, token?: string): Promise<string[]> {
  const names: string[] = [];
  let page = 1;
  for (;;) {
    const url = new URL(`${GITHUB_API}/users/${owner}/repos`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    const res = await fetch(url, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "overlay365-strategist",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`github discoverRepos: HTTP ${res.status} for ${owner}`);
    const repos = (await res.json()) as Array<{ name: string }>;
    if (repos.length === 0) break;
    names.push(...repos.map((r) => r.name));
    if (repos.length < 100) break;
    page += 1;
  }
  return names;
}

export async function fetchGithubIssues(
  config: GithubIssuesConfig,
  periodStart: string,
  periodEnd: string
): Promise<EvidenceItem[]> {
  if (!config.owners.some((o) => o.repos.length > 0)) return [];

  const since = new Date(periodStart).toISOString();
  const until = new Date(periodEnd).toISOString();
  const items: EvidenceItem[] = [];

  for (const { owner, repos } of config.owners) {
    if (repos.length === 0) continue;
    for (const repo of repos) {
      const url = new URL(`${GITHUB_API}/repos/${owner}/${repo}/issues`);
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
      if (!res.ok) throw new Error(`githubIssues: HTTP ${res.status} for ${owner}/${repo}`);

      const issues = (await res.json()) as GitHubIssue[];
      for (const issue of issues) {
        if (new Date(issue.created_at) > new Date(until)) continue;
        const rawText = `[${owner}/${repo}] #${issue.number} ${issue.title}\n${issue.body ?? ""}`;
        items.push({
          id: `ev${createHash("sha256").update(`github-issues:${owner}/${repo}#${issue.number}`).digest("hex").slice(0, 16)}`,
          source: "github-issues",
          platform: "cross-platform",
          rawText,
          timestamp: issue.created_at,
          channel: "api-poll",
          metadata: {
            owner,
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
  }
  return items;
}
