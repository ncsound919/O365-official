# Overlay365 Agent Team

Business-operations agents for the Overlay365 platforms (Health / Wealth /
Justice). Built **on top of existing GitHub agents** — not from scratch — and
rounded out with Draymond registry components.

```
[Diagnostic Agents] → [Evidence Compiler] → [LLM Harness] → [Report Output]
```

Every agent is empirically auditable: every claim traces to an input record
(`itemIds`), and the LLM harness mechanically rejects output that references an
id that doesn't exist in the evidence set.

## The four agents & what they reuse

| Agent | Cadence | Reuses (GitHub) | Draymond components |
|---|---|---|---|
| **The Strategist** — feedback clustering & roadmap | Bi-weekly | `kodustech/kodus-ai` clustering engine | `market-research`, `contentanalysis`, `web-search`, `writing-plans`, `bookbridge` |
| **The Treasurer** — cash pulse (Stripe/CashApp/Venmo) | Weekly | `progrmoiz/stripe-pulse` MRR/ARR math | `finance`, `stock-analysis`, `charts`, `xlsx` |
| **The Guardian** — compliance flagging (Justice/Health) | On content change | `talvinder/carrot-ai-pm` rule interface; `purpleroc/mcp-security-inspector` | `skill-vetter`, `book-synthesis`, `qingyan-research` |
| **The Auditor** — deterministic site integrity | Weekly | `tldraw/tldraw` + `mex-memory/mex` link checkers; `sundial-org/awesome-openclaw` web-qa-bot | Draymond `monitors.ts`, `web-reader`, `web-search`, `coding-agent`, `charts` |

## Run

```bash
npm install
npm run build        # tsc --noEmit (zero type errors required)
npm test             # vitest — 28 tests incl. fixture executions
npm run agents:strategist -- --email=agents/strategist/fixtures/sample-period.json
npm run agents:treasurer   -- --cashapp=agents/treasurer/fixtures/sample-cashapp.csv
npm run agents:guardian
npm run agents:auditor     # hits the live overlay365 sites (read-only)
```

## Build spec compliance

- **Shared layer** (`agents/shared/`): `types`, `dedupe` (near-identical fold,
  ids preserved), `scoring` (pure weighted 0-100), `llmHarness` (grounding
  validation — rejects fabricated itemIds, retries once, template fallback),
  `reportRenderer` (markdown always regenerated from JSON).
- **Auditor**: deterministic, no LLM. Uptime, same-origin broken-link crawl
  (depth 2, rate-limited), read-only payment-flow check, data consistency =
  `not-yet-defined` until the user specifies the shared data model.
- **Strategist**: only confirmed source is support email (manual import stub);
  GitHub issues adapter built but repos unconfirmed; in-app feedback + social
  are throwing stubs. Cost-friction → `undercuts` brand alignment.
- **Treasurer**: Stripe API adapter + manual CSV imports for CashApp/Venmo.
  `mrr` stays `null` (never estimated); `topExpenseCategory` stays `null`
  (no expense source defined); `pricingRecommendation` withheld until 4+ weeks
  of data.
- **Guardian**: empty rule corpus → inert-but-functional with a single
  explicit flag. No placeholder rules; no legal/medical citations from memory.
- **Orchestrator**: weekly Founder Sync — unwired agents report `"not-run"`,
  never a fabricated "no issues found".

## Unresolved inputs (hard stops, not guesses)

1. Exact GitHub repo names under `tap919` (Strategist GitHub issues source).
2. Whether an in-app feedback widget exists.
3. Whether Stripe products/prices carry platform metadata.
4. Expense-tracking source location (Treasurer `topExpenseCategory`).
5. ToS / Privacy Policy / content guidelines (Guardian rule corpus).
6. Justice/Health repo + content-file structure (Guardian content diff).
7. Whether Health/Wealth/Justice share a data model (Auditor data consistency).
