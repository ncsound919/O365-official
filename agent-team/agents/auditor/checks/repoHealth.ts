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
  /** Enable optional OWASP dep-scan (needs `dep-scan` installed). */
  enableDepScan?: boolean;
  /** Enable optional nuclei scan (needs `nuclei` installed). */
  enableNuclei?: boolean;
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
    try {
      const out = execFileSync(
        process.platform === "win32" ? "python" : "python3",
        ["-m", "heisenberg.main", "check", ...opts.packages.slice(0, 20)],
        {
          cwd: opts.heisenbergPath ?? undefined,
          encoding: "utf-8",
          timeout: 60_000,
          stdio: "pipe",
        }
      );
      const flagged = /(critical|high)/i.test(out) && /vuln/i.test(out);
      results.push({
        check: "supply-chain (heisenberg)",
        status: flagged ? "fail" : "pass",
        detail: out.split(/\r?\n/).filter(Boolean).slice(-8).join(" | "),
        tool: "heisenberg",
      });
    } catch (err) {
      results.push({
        check: "supply-chain (heisenberg)",
        status: "fail",
        detail: `heisenberg errored: ${err instanceof Error ? err.message : String(err)}`,
        tool: "heisenberg",
      });
    }
  }

  // OWASP dep-scan (SCA).
  if (opts.enableDepScan && which("dep-scan")) {
    try {
      const out = execFileSync("dep-scan", ["--no-verify-ssl", "--json"], {
        encoding: "utf-8",
        timeout: 120_000,
        stdio: "pipe",
      });
      results.push({
        check: "sca (dep-scan)",
        status: /"high":\s*[1-9]/.test(out) || /"critical":\s*[1-9]/.test(out) ? "fail" : "pass",
        detail: out.length > 500 ? `${out.length} bytes of SCA output` : out,
        tool: "dep-scan",
      });
    } catch {
      results.push({ check: "sca (dep-scan)", status: "fail", detail: "dep-scan errored", tool: "dep-scan" });
    }
  } else if (opts.enableDepScan) {
    results.push({
      check: "sca (dep-scan)",
      status: "not-available",
      detail: "dep-scan not installed — pip install owasp-dep-scan",
      tool: "dep-scan",
    });
  }

  // Nuclei vuln scan (optional, target-based).
  if (opts.enableNuclei && which("nuclei")) {
    results.push({
      check: "vuln-scan (nuclei)",
      status: "not-available",
      detail: "nuclei present; scheduled target scans are wired at the Draymond scheduler level",
      tool: "nuclei",
    });
  } else if (opts.enableNuclei) {
    results.push({
      check: "vuln-scan (nuclei)",
      status: "not-available",
      detail: "nuclei not installed — go install github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest",
      tool: "nuclei",
    });
  }

  return results;
}
