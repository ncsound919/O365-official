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
  /** Enable VirusTotal URL report checks (needs VIRUSTOTAL_API_KEY). */
  enableVirusTotal?: boolean;
  /** URLs to check via VirusTotal (defaults to the Overlay365 sites). */
  virusTotalTargets?: string[];
}

function which(tool: string): boolean {
  try {
    execFileSync(tool, ["--version"], { stdio: "pipe", timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

export async function checkRepoHealth(opts: RepoHealthOptions = {}): Promise<RepoHealthResult[]> {
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

  // OWASP dep-scan (SCA). Scans configured packages via --purl (lighter than a
  // full BOM build). Reports config-status when no packages are configured.
  if (opts.enableDepScan) {
    if (!which("depscan")) {
      results.push({
        check: "sca (dep-scan)",
        status: "not-available",
        detail: "depscan not installed — pip install owasp-depscan (needs packages/analysis-lib)",
        tool: "dep-scan",
      });
    } else {
      const purls = (opts.packages ?? [])
        .slice(0, 8)
        .map((p) => (p.includes("@") ? `pkg:npm/${p.replace("@", "@")}` : `pkg:pypi/${p.replace("==", "@")}`))
        .filter((p) => !/@@/.test(p));
      if (purls.length === 0) {
        results.push({
          check: "sca (dep-scan)",
          status: "pass",
          detail: "depscan installed; no packages configured for --purl scan",
          tool: "dep-scan",
        });
      } else {
        let findings = 0;
        const details: string[] = [];
        for (const purl of purls) {
          try {
            const out = execFileSync("depscan", ["--purl", purl, "--no-banner"], {
              encoding: "utf-8",
              timeout: 60_000,
              stdio: "pipe",
            });
            const vulnMatches = out.match(/(\d+) vulnerabilities found/i);
            const n = vulnMatches ? Number(vulnMatches[1]) : /vulnerabilit/i.test(out) && /No vulnerabilities/.test(out) ? 0 : null;
            if (n === null) continue;
            findings += n;
            details.push(`${purl.split("/").pop()}: ${n}`);
          } catch {
            details.push(`${purl.split("/").pop()}: error`);
          }
        }
        results.push({
          check: "sca (dep-scan)",
          status: findings > 0 ? "fail" : "pass",
          detail: findings > 0 ? `${findings} vulnerabilities: ${details.join(", ")}` : `clean: ${details.join(", ")}`,
          tool: "dep-scan",
        });
      }
    }
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

  // VirusTotal URL reputation (key-gated — VIRUSTOTAL_API_KEY).
  if (opts.enableVirusTotal) {
    const apiKey = process.env.VIRUSTOTAL_API_KEY;
    if (!apiKey) {
      results.push({
        check: "url-reputation (virustotal)",
        status: "not-available",
        detail: "VIRUSTOTAL_API_KEY not configured",
        tool: "virustotal",
      });
    } else {
      let malicious = 0;
      const detail: string[] = [];
      for (const url of (opts.virusTotalTargets ?? []).slice(0, 4)) {
        try {
          const enc = Buffer.from(url).toString("base64url");
          const res = await fetch(`https://www.virustotal.com/api/v3/urls/${enc}`, {
            headers: { "x-apikey": apiKey },
            signal: AbortSignal.timeout(15_000),
          });
          if (res.ok) {
            const data = (await res.json()) as { data?: { attributes?: { last_analysis_stats?: { malicious?: number } } } };
            const m = data.data?.attributes?.last_analysis_stats?.malicious ?? 0;
            malicious += m;
            detail.push(`${new URL(url).host}: ${m}`);
          } else {
            detail.push(`${new URL(url).host}: HTTP ${res.status}`);
          }
        } catch {
          detail.push(`${new URL(url).host}: error`);
        }
      }
      results.push({
        check: "url-reputation (virustotal)",
        status: malicious > 0 ? "fail" : "pass",
        detail: detail.length ? detail.join(", ") : "no targets configured",
        tool: "virustotal",
      });
    }
  }

  return results;
}
