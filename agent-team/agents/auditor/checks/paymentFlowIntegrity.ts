/**
 * Auditor — payment flow integrity.
 * Read-only checks that donation/payment links resolve. NEVER executes a real
 * payment.
 */
export interface PaymentFlowResult {
  checks: Array<{
    name: string;
    url: string;
    statusCode: number;
    ok: boolean;
    error?: string;
  }>;
  overall: "ok" | "degraded";
}

export async function checkPaymentFlow(urls: Array<{ name: string; url: string }>): Promise<PaymentFlowResult> {
  const checks = [];
  for (const { name, url } of urls) {
    try {
      const res = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });
      checks.push({ name, url, statusCode: res.status, ok: res.status < 400 });
    } catch (err) {
      checks.push({
        name,
        url,
        statusCode: 0,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return {
    checks,
    overall: checks.some((c) => !c.ok) ? "degraded" : "ok",
  };
}
