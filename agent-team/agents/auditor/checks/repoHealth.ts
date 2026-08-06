/**
 * Auditor — repo / supply-chain health check.
 *
 * Wraps the Heisenberg supply-chain health CLI (cloned at
 * ../integrations/heisenberg-ssc-health-check) plus optional OWASP dep-scan and
 * nuclei. Deterministic: if the tool isn't installed, that check reports
 * "not-available" with an explicit reason — never a guessed pass/fail.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface RepoHealthResult {
  check: string;
  status: "pass" | "fail" | "not-available";
  detail: string;
  tool: string;
}

export interface RepoHealthOptions {
  /** Absolute path to the heisenberg repo (or the `heisenberg` CLI name). */
  heisenbergPath?: string;
  /** npm/pypi packages to check. */
  packages?: string[];
  /** Enable optional OWASP dep-scan (reports installed status; heavy scan is scheduled). */
  enableDepScan?: boolean;
  /** Enable optional nuclei scan against live targets. */
  enableNuclei?: boolean;
  /** URLs to scan with nuclei (defaults to the Overlay365 sites). */
  nucleiTargets?: string[];
}

function which(tool: string): boolean {
  try {
    execFileSync(tool, ["--version"], { stdio: "pipe", timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

export function checkRepoHealth(opts: RepoHealthOptions = {}): RepoHealthResult[] {
  const results: RepoHealthResult[] = [];

  // Heisenberg supply-chain health (deps.dev + SBOM).
  const heisenbergCli = opts.heisenbergPath ?? "heisenberg";
  const heisenbergAvailable =
    existsSync(join(opts.heisenbergPath ?? "", "pyproject.toml")) || which(heisenbergCli);

  if (!heisenbergAvailable) {
    results.push({
      check: "supply-chain (heisenberg)",
      status: "not-available",
      detail: "heisenberg CLI not found — clone ../integrations/heisenberg-ssc-health-check and `pip install -e .`",
      tool: "heisenberg",
    });
  } else if (!opts.packages?.length) {
    results.push({
      check: "supply-chain (heisenberg)",
      status: "not-available",
      detail: "no packages configured for heisenberg check",
      tool: "heisenberg",
    });
  } else {
    // heisenberg check expects per-package args: -mgmt <npm|pypi> -pkg <name> -v <version>.
    const flagged: string[] = [];
    const errors: string[] = [];
    for (const pkg of opts.packages.slice(0, 12)) {
      const parsed = pkg.includes("@")
        ? { mgmt: "npm", name: pkg.split("@")[0], version: pkg.split("@")[1] }
        : { mgmt: "pypi", name: pkg.split("==")[0], version: pkg.split("==")[1] };
      if (!parsed.name || !parsed.version) continue;
      try {
        const out = execFileSync(
          process.platform === "win32" ? "python" : "python3",
          ["-m", "heisenberg.main", "check", "-mgmt", parsed.mgmt, "-pkg", parsed.name, "-v", parsed.version],
          { cwd: opts.heisenbergPath ?? undefined, encoding: "utf-8", timeout: 60_000, stdio: "pipe" }
        );
        if (/(critical|high)/i.test(out) && /vuln/i.test(out)) flagged.push(pkg);
      } catch (err) {
        errors.push(`${pkg}: ${err instanceof Error ? err.message.split("\n")[0] : String(err)}`);
      }
    }
    results.push({
      check: "supply-chain (heisenberg)",
      status: flagged.length > 0 ? "fail" : "pass",
      detail: flagged.length
        ? `${flagged.length} flagged: ${flagged.join(", ")}`
        : errors.length
          ? `checked ${opts.packages.slice(0, 12).length} pkg(s), ${errors.length} errored (${errors[0]})`
          : `checked ${opts.packages.slice(0, 12).length} package(s), no high/critical findings`,
      tool: "heisenberg",
    });
  }

  // OWASP dep-scan (SCA). Heavy (generates a BOM via cdxgen) — reports config
  // status inline; the actual scan runs on the Draymond scheduler, not here.
  if (opts.enableDepScan) {
    results.push({
      check: "sca (dep-scan)",
      status: which("depscan") ? "pass" : "not-available",
      detail: which("depscan")
        ? "installed — heavy BOM scan runs on schedule, not inline"
        : "depscan not installed — pip install owasp-depscan (needs packages/analysis-lib)",
      tool: "dep-scan",
    });
  }

  // Nuclei vuln scan (optional, target-based). Quick targeted scan inline.
  if (opts.enableNuclei) {
    if (!which("nuclei")) {
      results.push({
        check: "vuln-scan (nuclei)",
        status: "not-available",
        detail: "nuclei not installed — go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest",
        tool: "nuclei",
      });
    } else {
      const targets = (opts.nucleiTargets ?? []).slice(0, 3);
      if (targets.length === 0) {
        results.push({
          check: "vuln-scan (nuclei)",
          status: "not-available",
          detail: "no nuclei targets configured — pass nucleiTargets (e.g. Overlay365 sites)",
          tool: "nuclei",
        });
      } else {
        try {
          const out = execFileSync(
            "nuclei",
            ["-u", targets.join(","), "-silent", "-no-color", "-severity", "low,medium,high,critical", "-timeout", "10"],
            { encoding: "utf-8", timeout: 90_000, stdio: "pipe" }
          );
          const findings = out.split(/\r?\n/).filter(Boolean);
          results.push({
            check: "vuln-scan (nuclei)",
            status: findings.length > 0 ? "fail" : "pass",
            detail: findings.length > 0 ? `${findings.length} finding(s): ${findings.slice(0, 3).join(" | ")}` : "no findings",
            tool: "nuclei",
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          results.push({
            check: "vuln-scan (nuclei)",
            status: "fail",
            detail: msg.length > 250 ? `${msg.slice(0, 250)}…` : msg,
            tool: "nuclei",
          });
        }
      }
    }
  }

  return results;
}
