/**
 * Auditor — broken link check.
 * Follows the tldraw/tldraw docs checker pattern (same-origin crawl, depth cap,
 * status validation) with a rate limit to avoid hammering own infra.
 */
export interface BrokenLinkResult {
  pageUrl: string;
  linkUrl: string;
  statusCode: number;
  ok: boolean;
  depth: number;
  error?: string;
}

const MAX_DEPTH = 2;
const MAX_PAGES = 40;
const RATE_LIMIT_MS = 150;

function sameOrigin(base: string, link: string): boolean {
  try {
    return new URL(link).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

function resolveUrl(base: string, href: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

async function fetchOk(url: string): Promise<{ status: number; body: string }> {
  const res = await fetch(url, {
    headers: { "user-agent": "overlay365-auditor/0.1 (+https://overlay365.com)" },
    redirect: "follow",
    signal: AbortSignal.timeout(10_000),
  });
  const body = await res.text();
  return { status: res.status, body };
}

const LINK_RE = /href\s*=\s*["']([^"']+)["']/g;

export async function checkBrokenLinks(
  baseUrl: string,
  maxDepth = MAX_DEPTH,
  maxPages = MAX_PAGES
): Promise<BrokenLinkResult[]> {
  const results: BrokenLinkResult[] = [];
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: baseUrl, depth: 0 }];

  while (queue.length > 0 && visited.size < maxPages) {
    const current = queue.shift();
    if (!current || visited.has(current.url)) continue;
    visited.add(current.url);

    let status = 0;
    let body = "";
    try {
      ({ status, body } = await fetchOk(current.url));
    } catch (err) {
      results.push({
        pageUrl: current.url,
        linkUrl: current.url,
        statusCode: 0,
        ok: false,
        depth: current.depth,
        error: err instanceof Error ? err.message : String(err),
      });
      continue;
    }

    if (status >= 400) {
      results.push({
        pageUrl: current.url,
        linkUrl: current.url,
        statusCode: status,
        ok: false,
        depth: current.depth,
      });
    }

    if (current.depth >= maxDepth) continue;

    for (const match of body.matchAll(LINK_RE)) {
      const raw = match[1];
      if (!raw || raw.startsWith("#") || raw.startsWith("mailto:") || raw.startsWith("tel:")) continue;
      const resolved = resolveUrl(current.url, raw);
      if (!resolved || !sameOrigin(baseUrl, resolved)) continue;

      let linkStatus = 0;
      try {
        const res = await fetch(resolved, {
          method: "HEAD",
          redirect: "follow",
          signal: AbortSignal.timeout(10_000),
        });
        linkStatus = res.status;
      } catch (err) {
        results.push({
          pageUrl: current.url,
          linkUrl: resolved,
          statusCode: 0,
          ok: false,
          depth: current.depth + 1,
          error: err instanceof Error ? err.message : String(err),
        });
      }
      if (linkStatus >= 400) {
        results.push({
          pageUrl: current.url,
          linkUrl: resolved,
          statusCode: linkStatus,
          ok: false,
          depth: current.depth + 1,
        });
      }
      if (!visited.has(resolved)) {
        queue.push({ url: resolved, depth: current.depth + 1 });
      }
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }
  }

  return results;
}
