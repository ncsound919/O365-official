/**
 * Guardian — content diff sources.
 *
 * TODO: confirm exact repo paths + content-file structure (CMS JSON vs markdown
 * vs component-embedded text) before wiring — must not be guessed.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import type { EvidenceItem } from "../../shared/types.js";

export interface DiffConfig {
  repoPath: string;
  sinceCommit: string;
  contentGlobs: string[]; // e.g. ["content/**/*.md"]
}

export async function diffNewContent(config: DiffConfig, platform: "justice" | "health"): Promise<EvidenceItem[]> {
  // List changed files under the content globs since the given commit.
  const diffOut = execFileSync("git", ["diff", "--name-only", config.sinceCommit, "HEAD", "--"], {
    cwd: config.repoPath,
    encoding: "utf-8",
    maxBuffer: 4 * 1024 * 1024,
  });

  const changedFiles = diffOut.split(/\r?\n/).filter((f) => f && config.contentGlobs.some((g) => matchesGlob(f, g)));

  const items: EvidenceItem[] = [];
  for (const file of changedFiles) {
    const content = execFileSync("git", ["show", `HEAD:${file}`], {
      cwd: config.repoPath,
      encoding: "utf-8",
      maxBuffer: 4 * 1024 * 1024,
    });
    const commitHash = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: config.repoPath,
      encoding: "utf-8",
    }).trim();
    items.push({
      id: `ev${createHash("sha256").update(`${platform}-diff:${file}:${commitHash}`).digest("hex").slice(0, 16)}`,
      source: `${platform}-content-diff`,
      platform,
      rawText: content.slice(0, 4000),
      timestamp: new Date().toISOString(),
      channel: "git-diff",
      metadata: { filePath: file, commitHash, repoPath: config.repoPath },
      confidence: "high",
    });
  }
  return items;
}

function matchesGlob(file: string, glob: string): boolean {
  if (glob.includes("**")) {
    const [before, after] = glob.split("**") as [string, string];
    return file.startsWith(before) && file.endsWith(after);
  }
  if (glob.includes("*")) {
    const [before, after] = glob.split("*") as [string, string];
    return file.startsWith(before) && file.endsWith(after);
  }
  return file === glob || file.startsWith(glob.replace(/\/$/, ""));
}
