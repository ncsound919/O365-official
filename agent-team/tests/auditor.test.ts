import { describe, expect, it, vi, afterEach } from "vitest";
import { checkUptime } from "../agents/auditor/checks/uptime.js";
import { checkBrokenLinks } from "../agents/auditor/checks/brokenLinks.js";
import { checkPaymentFlow } from "../agents/auditor/checks/paymentFlowIntegrity.js";
import { checkDataConsistency } from "../agents/auditor/checks/dataConsistency.js";

function mockFetchMap(responses: Record<string, { status: number; body?: string }>) {
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const match = Object.keys(responses)
      .sort((a, b) => b.length - a.length) // longest prefix first
      .find((r) => url.startsWith(r));
    const res = responses[match ?? url] ?? { status: 404, body: "not found" };
    return {
      status: res.status,
      ok: res.status < 400,
      text: async () => res.body ?? "",
    } as unknown as Response;
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Auditor", () => {
  it("checkUptime records status + response time for each site", async () => {
    mockFetchMap({
      "https://a.com": { status: 200 },
      "https://b.com": { status: 503 },
    });
    const results = await checkUptime(["https://a.com", "https://b.com"]);
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.url === "https://a.com")!.ok).toBe(true);
    expect(results.find((r) => r.url === "https://b.com")!.ok).toBe(false);
    expect(results[0]!.responseTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("checkBrokenLinks crawls same-origin and flags 4xx", async () => {
    mockFetchMap({
      "https://site.com": { status: 200, body: '<a href="https://site.com/page">x</a>' },
      "https://site.com/page": { status: 404, body: "missing" },
    });
    const results = await checkBrokenLinks("https://site.com", 1, 10);
    expect(results.some((r) => r.linkUrl === "https://site.com/page" && !r.ok)).toBe(true);
  });

  it("checkBrokenLinks does not leave the same origin", async () => {
    mockFetchMap({
      "https://site.com": { status: 200, body: '<a href="https://evil.com/x">x</a>' },
    });
    const results = await checkBrokenLinks("https://site.com", 1, 10);
    expect(results.every((r) => r.linkUrl.startsWith("https://site.com"))).toBe(true);
  });

  it("checkPaymentFlow is read-only and reports degraded on failure", async () => {
    mockFetchMap({
      "https://buy.stripe.com": { status: 200 },
      "https://cash.app": { status: 500 },
    });
    const result = await checkPaymentFlow([
      { name: "stripe", url: "https://buy.stripe.com/test" },
      { name: "cashapp", url: "https://cash.app/$x" },
    ]);
    expect(result.overall).toBe("degraded");
    expect(result.checks.find((c) => c.name === "cashapp")!.ok).toBe(false);
  });

  it("data consistency is not-yet-defined until user specifies the model", () => {
    expect(checkDataConsistency()).toBe("not-yet-defined");
  });
});
