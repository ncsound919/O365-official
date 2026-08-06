import { describe, expect, it, vi, afterEach } from "vitest";
import { fetchGithubIssues, discoverRepos } from "../agents/strategist/sources/githubIssues.js";
import { DEFAULT_GITHUB_CONFIG } from "../agents/strategist/sources/githubRepos.js";

function mockGithub() {
  const fetchMock = vi.fn(async (input: string | URL) => {
    const url = String(input);
    const json = (body: unknown) =>
      ({ ok: true, status: 200, json: async () => body } as unknown as Response);

    if (url.startsWith("https://api.github.com/users/ncsound919/repos")) {
      return json([{ name: "O365-official" }, { name: "Uplift-Wealth-" }, { name: "uplift-code" }]);
    }
    if (url.includes("/repos/ncsound919/O365-official/issues")) {
      return json([
        {
          number: 1,
          title: "Add dark mode",
          body: "please add dark mode",
          created_at: "2026-07-22T00:00:00Z",
          html_url: "https://github.com/ncsound919/O365-official/issues/1",
          labels: [{ name: "enhancement" }],
          state: "open",
        },
      ]);
    }
    if (url.includes("/repos/ncsound919/Uplift-Wealth-/issues")) {
      return json([
        {
          number: 3,
          title: "Portfolio chart broken",
          body: "the chart crashes",
          created_at: "2026-07-24T00:00:00Z",
          html_url: "https://github.com/ncsound919/Uplift-Wealth-/issues/3",
          labels: [{ name: "bug" }],
          state: "open",
        },
      ]);
    }
    // uplift-code — no issues
    return json([]);
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("githubIssues (multi-owner)", () => {
  it("fetches issues across every owner/repo pair", async () => {
    mockGithub();
    const items = await fetchGithubIssues(DEFAULT_GITHUB_CONFIG, "2026-07-20T00:00:00Z", "2026-08-02T00:00:00Z");
    expect(items).toHaveLength(2);
    expect(items.some((i) => i.metadata.repo === "O365-official" && i.metadata.owner === "ncsound919")).toBe(true);
    expect(items.some((i) => i.metadata.repo === "Uplift-Wealth-")).toBe(true);
    // Platform stays cross-platform until GitHub metadata can attribute it.
    expect(items.every((i) => i.platform === "cross-platform")).toBe(true);
  });

  it("skips empty repo lists per owner", async () => {
    const fetchMock = mockGithub();
    await fetchGithubIssues({ owners: [{ owner: "tap919", repos: [] }] }, "a", "b");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("discovers repos for an account", async () => {
    mockGithub();
    const names = await discoverRepos("ncsound919");
    expect(names).toContain("O365-official");
    expect(names).toContain("uplift-code");
  });
});
