/**
 * Auditor — uptime check.
 * Reuses Draymond's monitors.ts approach (HTTP HEAD/GET against live sites).
 * Deterministic, no auth.
 */
export interface UptimeResult {
  url: string;
  statusCode: number;
  ok: boolean;
  responseTimeMs: number;
  error?: string;
}

export async function checkUptime(urls: string[]): Promise<UptimeResult[]> {
  const results: UptimeResult[] = [];
  for (const url of urls) {
    const started = Date.now();
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "manual",
        signal: AbortSignal.timeout(10_000),
      });
      // HEAD unsupported → retry with GET.
      if (res.status === 405 || res.status === 501) {
        const get = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(10_000) });
        results.push({
          url,
          statusCode: get.status,
          ok: get.status < 400,
          responseTimeMs: Date.now() - started,
        });
      } else {
        results.push({
          url,
          statusCode: res.status,
          ok: res.status < 400,
          responseTimeMs: Date.now() - started,
        });
      }
    } catch (err) {
      results.push({
        url,
        statusCode: 0,
        ok: false,
        responseTimeMs: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return results;
}
