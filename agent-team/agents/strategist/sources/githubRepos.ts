/**
 * Confirmed GitHub owners/repos for the Overlay365 feedback pipeline.
 *
 * Account model (confirmed by the owner, 2026-08):
 * - ncsound919 = all NEW builds (primary feedback source)
 * - tap919     = legacy agent repos (secondary)
 *
 * Product repos were confirmed against the live GitHub API:
 * - ncsound919/O365-official    → overlay365.com main site
 * - ncsound919/Uplift-Wealth-    → uplift-wealth.onrender.com (Wealth)
 * - ncsound919/uplift-code       → uplift-health.vercel.app (Health)
 * - Justice has no public source repo yet (deployed only) — left out rather
 *   than guessed.
 */
import type { GithubIssuesConfig } from "./githubIssues.js";

export const DEFAULT_GITHUB_CONFIG: GithubIssuesConfig = {
  owners: [
    {
      owner: "ncsound919",
      repos: ["O365-official", "Uplift-Wealth-", "uplift-code"],
    },
    {
      // Legacy agent repos — add specific ones as they become feedback sources.
      owner: "tap919",
      repos: [],
    },
  ],
};
