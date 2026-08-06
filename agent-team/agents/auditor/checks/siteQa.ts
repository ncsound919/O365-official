/**
 * Auditor — Overlay365 QA via AgentBrowser's Playwright testing tool.
 *
 * Calls AgentBrowser's /api/testing endpoint (the official QA harness) and
 * folds the per-site results into the Auditor report. Fail-closed: when
 * AgentBrowser isn't configured/running, this reports not-available rather than
 * guessing.
 */

export interface SiteQaSummary {
  suite: string;
  status: "pass" | "fail" | "partial" | "not-available";
  passed: number;
  failed: number;
  errored: number;
  sites: Array<{
    siteLabel: string;
    url: string;
    status: string;
    loadMs: number;
    consoleErrors: string[];
    failedRequests: string[];
    brokenLinks: string[];
  }>;
  detail: string;
}

export interface SiteQaOptions {
  agentBrowserUrl?: string;
  agentBrowserApiKey?: string;
  suite?: string;
}

const AGENTBROWSER_DEFAULT = "http://localhost:3000";

export async function runSiteQa(opts: SiteQaOptions = {}): Promise<SiteQaSummary> {
  const base = opts.agentBrowserUrl ?? process.env.AGENTBROWSER_URL ?? AGENTBROWSER_DEFAULT;
  const apiKey = opts.agentBrowserApiKey ?? process.env.AGENTBROWSER_API_KEY ?? "";
  const suite = opts.suite ?? "all";

  if (!apiKey) {
    return {
      suite, status: "not-available", passed: 0, failed: 0, errored: 0, sites: [],
      detail: "AgentBrowser API key not configured — set AGENTBROWSER_API_KEY",
    };
  }

  try {
    const res = await fetch(`${base}/api/testing?suite=${encodeURIComponent(suite)}`, {
      headers: { "X-Agent-Auth": apiKey },
      signal: AbortSignal.timeout(240_000),
    });
    if (!res.ok) {
      return {
        suite, status: "not-available", passed: 0, failed: 0, errored: 0, sites: [],
        detail: `AgentBrowser /api/testing returned HTTP ${res.status}`,
      };
    }
    const data = (await res.json()) as {
      overall: string;
      summary: { passed: number; failed: number; errored: number };
      sites: Array<{
        siteLabel: string;
        url: string;
        status: string;
        loadMs: number;
        consoleErrors: string[];
        failedRequests: string[];
        brokenLinks: string[];
      }>;
    };
    return {
      suite,
      status: data.overall as SiteQaSummary["status"],
      passed: data.summary.passed,
      failed: data.summary.failed,
      errored: data.summary.errored,
      sites: data.sites ?? [],
      detail: data.overall === "pass" ? "all sites passed" : `${data.summary.failed} failed, ${data.summary.errored} errored`,
    };
  } catch (err) {
    return {
      suite, status: "not-available", passed: 0, failed: 0, errored: 0, sites: [],
      detail: `AgentBrowser unreachable: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
