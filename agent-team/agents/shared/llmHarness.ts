/**
 * LLM Harness — the ONLY tier allowed to call an LLM.
 *
 * The audit-first guardrail is enforced mechanically, not just by prompt
 * wording: any itemId the LLM references in its output must exist in
 * `evidenceById`, or the call is rejected, retried once, then falls back to a
 * template-only report with no LLM narrative.
 *
 * The LLM implementation is injected so tests can run without a real key.
 */
import type { EvidenceCluster, EvidenceItem } from "./types.js";

export interface LLMHarnessInput {
  clusters: EvidenceCluster[];
  /** Full text map, for grounding only. */
  evidenceById: Map<string, EvidenceItem>;
  /** Agent-specific system-prompt fragment. */
  agentContext: string;
}

export interface LLMHarnessOutput {
  /** clusterId -> human label. */
  clusterLabels: Record<string, string>;
  recommendations: string[];
  flags: string[];
}

/** Returns text that references zero itemIds. */
function templateOnly(): LLMHarnessOutput {
  return {
    clusterLabels: {},
    recommendations: [],
    flags: [
      "LLM harness fell back to template-only mode: LLM output failed itemId grounding validation.",
    ],
  };
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* not JSON */
  }
  return null;
}

/** Pull every itemId-like token out of an arbitrary LLM output blob. */
function referencedIds(output: unknown): string[] {
  const out: string[] = [];
  const visit = (value: unknown): void => {
    if (typeof value === "string") {
      for (const m of value.matchAll(/ev[0-9a-f]{16,}/g)) out.push(m[0]);
    } else if (Array.isArray(value)) {
      value.forEach(visit);
    } else if (value && typeof value === "object") {
      Object.values(value as Record<string, unknown>).forEach(visit);
    }
  };
  visit(output);
  return out;
}

export interface RunHarnessOptions {
  /** Injectable LLM. Returns raw text; must be parsed by the harness. */
  callLlm: (system: string, user: string) => Promise<string>;
  /** Custom id shape for tests. */
  idPattern?: RegExp;
}

export async function runHarness(
  input: LLMHarnessInput,
  options: RunHarnessOptions
): Promise<LLMHarnessOutput> {
  const { callLlm, idPattern = /ev[0-9a-f]{16,}/g } = options;

  const system =
    `You are a report compiler for an auditable agent system.\n${input.agentContext}\n` +
    `Only reference facts present in the provided evidence. If you characterize a cluster, ` +
    `cite specific itemIds. Never state a count, percentage, or trend not derivable from the ` +
    `input JSON. Respond with strict JSON: { "clusterLabels": {clusterId: label}, ` +
    `"recommendations": string[], "flags": string[] } where recommendations reference ` +
    `clusterIds.`;

  const user = JSON.stringify({
    clusters: input.clusters.map((c) => ({
      id: c.id,
      itemIds: c.itemIds,
      frequency: c.frequency,
      severity: c.severity,
      type: c.type,
      score: c.score,
    })),
    evidence: Array.from(input.evidenceById.entries()).map(([id, item]) => ({
      id,
      text: item.rawText,
    })),
  });

  const validFor = (parsed: Record<string, unknown>): boolean => {
    const ids = referencedIds(parsed);
    return ids.every((id) => input.evidenceById.has(id));
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const raw = await callLlm(system, user);
      const parsed = parseJsonObject(raw);
      if (!parsed) return templateOnly();
      if (!validFor(parsed)) continue; // reject + retry once

      const clusterLabels: Record<string, string> = {};
      for (const [cid, label] of Object.entries(
        (parsed.clusterLabels ?? {}) as Record<string, string>
      )) {
        if (input.clusters.some((c) => c.id === cid) && typeof label === "string") {
          clusterLabels[cid] = label;
        }
      }
      const recommendations = Array.isArray(parsed.recommendations)
        ? (parsed.recommendations as unknown[]).filter(
            (r): r is string => typeof r === "string"
          )
        : [];
      const flags = Array.isArray(parsed.flags)
        ? (parsed.flags as unknown[]).filter((f): f is string => typeof f === "string")
        : [];

      return { clusterLabels, recommendations, flags };
    } catch {
      return templateOnly();
    }
  }
  return templateOnly();
}
