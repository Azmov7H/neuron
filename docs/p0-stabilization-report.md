# P0 Stabilization Report

Scope: S-01 (assessment integrity), S-02 (API abuse protection), S-20 (test foundation),
S-06 (reset semantics), S-05 (config boundary). Companion to
`docs/simulation-system-assessment.md`.

## Changed

| Area | Change |
|---|---|
| `src/lib/simulation/assessment.ts` | Honest assessment contract: `AssessmentSource = 'ai' \| 'deterministic'`, `DETERMINISTIC_MODEL = "neuron-local-deterministic-engine"`, `buildAssessmentMetadata()`, `getConfiguredAiModel()` (returns a real AI model name only for `source: 'ai'`) |
| `src/lib/simulation/deterministic-fallback.ts` | Deterministic generator extracted; metadata self-identifies as local — never OpenRouter/Gemma |
| `app/api/simulations/interpret/route.ts` | Provider path persists `('ai', getConfiguredAiModel())`; fallback paths persist `('deterministic', DETERMINISTIC_MODEL, reason)` for `missing_api_key` / `timeout` / `provider_error`; single metadata construction point — the object persisted to `SimulationRun` is the object streamed in `[METADATA_EVENT]` |
| `src/lib/simulation/history-params.ts` + `app/api/simulations/history/route.ts` | `parseHistoryLimit()` clamps to 1–100 (malformed → 15); `buildHistoryQuery()` always scopes to the authenticated user |
| `app/api/simulations/config/route.ts` | New registry-derived config endpoint (GET, no DB): 6 domains × 8 sims in the client's exact shape |
| `components/simulation-runner/simulation-engine.ts` | `resetTime()` clears `stateSnapshot` before `initSubSimData()` — fixes bacteria population not restoring (root cause) |
| `components/simulation-runner/simulation-runner.tsx` | `handleFullReset` (engine params → defaults, `resetTime()`, telemetry/AI state cleared); assessment origin badge (`role="status"`); server error messages surfaced (e.g. 429 text) |
| `src/lib/simulation/nl-interpreter.service.ts` | Pure `resolveNlProposal()` pipeline; behavior fixes: empty provided-param set → `needs_input` (was unreachable); out-of-range values clamped, not dropped |
| `vitest.config.ts`, `package.json` | Vitest 4.1.10 + jsdom devDependency; `"test": "vitest run"`; `resolve.tsconfigPaths: true` (Vite 8 native) makes `@/` resolve |

## Security

- **PASS** — `/interpret` rate-limited via `withRateLimit` *after* auth: 20 req/window
  (env-overridable `RATE_LIMIT_INTERPRET_MAX` / `RATE_LIMIT_INTERPRET_WINDOW_MS`), standard
  429 `RATE_LIMIT_EXCEEDED` response, no silent fallback on 429.
- **PASS** — history `limit` never reaches `.limit()` untrusted; clamped server-side.
- **PASS** — NL pipeline treats LLM output as untrusted: Zod shape → registry id whitelist
  (hallucinated ids rejected) → per-sim schema → bounds clamp → required-param check.
- **PASS** — CSRF + `requireAuth` wrappers preserved on all simulation endpoints.

## Integrity

- **PASS** — deterministic runs persist `source: "deterministic"` +
  `aiModel: "neuron-local-deterministic-engine"`; identical object streamed to the client.
- **PASS** — AI runs use the configured provider's real model name only.
- **PASS** — `/api/simulations/config` is 100% registry-derived; no duplicated catalog.

## Reset

- **PASS** — `resetTime()` returns the engine to a clean initial state: time 0, cleared
  `stateSnapshot`, parameters re-applied from defaults. Verified by engine contract tests:
  bacteria restores to the fresh-run value (not the grown run); one frame after reset
  reproduces the fresh-run physics exactly.

## Tests

`pnpm test` — **66/66 PASS, 7 files** (`vitest run`):

- `src/lib/simulation/__tests__/` — registry (48 sims, 6×8 domains, id/domain/param
  contracts, interactive-id sync with client constants), schemas (defaults within bounds
  registry-wide, unknown-key stripping), history params (clamp/floor/malformed/ownership),
  NL interpreter (whitelist, clamps, `needs_input`, malicious payloads, keyword fallback),
  assessment + deterministic fallback (metadata honesty).
- `components/simulation-runner/__tests__/simulation-engine.test.ts` — jsdom + canvas
  stubs: initial state, deterministic physics (a = 1.04, v = 0.1248), bacteria growth,
  reset semantics, pause gating, 17-sim lifecycle smoke test.

## Validation

| Gate | Result |
|---|---|
| `pnpm test` | PASS (66/66) |
| `npx tsc --noEmit` | PASS (0 errors) |
| `pnpm build` | PASS (all routes: config, natural-language, interpret, history, spark/chat) |
| `pnpm lint` (touched paths) | PASS (0 issues; repo carries 141 pre-existing errors in untouched files) |
| Live `/api/simulations/config` | PASS — 6 domains, 48 sims, all client fields present |
| Live NL endpoint | PASS — keyword → `needs_input` (relativity, `missingParameters: ["speed"]`); keyword+params → `ready` (bacteria); unmatched → `unsupported`; empty text → 400; unauth → 403/307 |
| Live history endpoint | PASS — `limit=9999/0/abc/absent` all 200 with valid shape; unauth → 307 |
| Live interpret (deterministic) | PASS — SSE `[METADATA_EVENT]` carries `source: deterministic`, `aiModel: neuron-local-deterministic-engine`, `fallbackReason: missing_api_key`; persisted `SimulationRun` row matches exactly |
| Live rate limit | PASS — 20 req allowed, then 429s (second wave all 429) |

All live checks were run against a production-mode build with AI keys blanked (no real
LLM calls) and a local Mongo; test rows created during verification were deleted.

Not runnable headlessly (needs a browser): in-browser hub loading, bacteria/full-reset
visuals, AI-metadata round-trip with a real provider (requires real keys).

## Remaining P1 (out of scope)

- Delta-time physics (frame-count stepping)
- Pause/render performance (simulation still advances draw logic)
- Real state snapshots (engine `stateSnapshot` is a thin copy)
- `INTERACTIVE_SIM_IDS` consolidation (duplicated in client constants)
- `DOMAIN_STYLES` shape divergence (registry vs client constants)
- Prompt hardening and accessibility pass
