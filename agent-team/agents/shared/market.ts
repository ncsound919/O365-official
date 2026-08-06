/**
 * Shared market data for the agent-team — CoinGecko crypto prices (no key).
 * Used by the Treasurer and other financial agents for a live market context.
 */

export async function cryptoPrices(ids = "bitcoin,ethereum,solana"): Promise<Record<string, number>> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
    { signal: AbortSignal.timeout(10_000) }
  );
  if (!res.ok) throw new Error(`coingecko HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, { usd?: number }>;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(data)) out[k] = v.usd ?? 0;
  return out;
}
