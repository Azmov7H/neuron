# P2 — Architecture & Contract Consolidation: Stabilization Report

**Scope:** Single authoritative simulation registry (`src/lib/simulation/`), elimination of every duplicated contract (`INTERACTIVE_SIM_IDS`, `ScientificDomain`, parameter specs, domain styles/presentation, config shapes), registry-derived API + client projection, runtime parameter ownership, dead-code cleanup, and a contract-regression test suite that proves the derived surfaces cannot drift.

**P1 baseline:** 82 tests (7 files), `tsc` clean, `pnpm build` clean, lint clean on P1-touched paths (141 pre-existing repo errors).
**P2 result:** 101 tests (8 files, +19 contract tests), `tsc` clean, `pnpm build` clean, lint clean on all P2-touched paths (only pre-existing errors outside the simulation scope remain — see §13).

---

## 1. Scope & Objectives

| Objective | Status |
|---|---|
| ONE registry as the source for ids, domains, names, descriptions, equations, parameters | **VERIFIED** |
| ONE `INTERACTIVE_SIM_IDS` + derived classification everywhere | **VERIFIED** |
| ONE canonical `ScientificDomain` across registry, runner, engine, config API, client projection, NL interpreter, tests | **VERIFIED** (simulation scope, see §14 for the adjacent knowledge-engine union) |
| Parameter chain registry → client → runtime → engine with no metadata drops | **VERIFIED** (live payload: 9-field param objects, 0 missing) |
| `/api/simulations/config` fully registry-derived, one explicit typE | **VERIFIED** |
| UI presentation separated from the scientific model | **VERIFIED** (single `DOMAIN_STYLES`, compile-time key equality) |
| Parameter mutation paths documented + tested (initial, slider, NL, restore, reset, switch) | **VERIFIED** (§12, architecture doc §3) |
| Dead code classified KEEP / REINTEGRATE / DELETE / DEFER (no auto-deleted DB models) | **VERIFIED** (§11) |
| No persisted field-name changes; P0 assessment metadata + history responses backward compatible | **VERIFIED** (§10) |
| No behavior change; no new simulations; 48 sims / 6 domains / 17 interactive preserved | **VERIFIED** (live check + §12) |

---

## 2. Baseline (P1 End State)

- 82/82 tests (7 files), engine delta-time/pause/stateType contracts intact; P1 report at `docs/p1-runtime-correctness-report.md`.
- Known residual duplication at P2 start: `INTERACTIVE_SIM_IDS` (registry + client constants), `ScientificDomain` (registry + knowledge engine), full parameter metadata **dropped** in the client projection (only key/default survived), domain style/icon definitions spread across UI modules, and client/API config shapes that had diverged.
- `npx tsc` at P2 start required `rm -rf .next/dev` (stale generated `routes.d.ts`, git-ignored: TS1109/TS1005/TS1110/TS1161) — then clean.

---

## 3. Registry Consolidation (**VERIFIED**)

`src/lib/simulation/registry.types.ts` is now the single declaration point:
- `SCIENTIFIC_DOMAINS` — the only domain enumeration; `ScientificDomain = (typeof SCIENTIFIC_DOMAINS)[number]`.
- `SimulationParameter` — declared once (line 30): `key, label, type ('number'|'integer'), min, max, step, default, required, unit?, description?`.
- `SimulationDefinition` / `ClientSimulation`; the former `SimulationConfig` and `SimulationParameterSpec` interfaces were removed.

`src/lib/simulation/registry.ts`:
- `INTERACTIVE_SIM_IDS` (line 19, `as const`) — the single interactive-set literal; `isInteractiveSim()` derives membership.
- `DOMAIN_LABELS` (identity), `DOMAIN_ORDER = SCIENTIFIC_DOMAINS` (stable order used by hub, runner, NL prompt, API).
- `SIMULATION_REGISTRY` — 48 definitions keyed `domain:id`, 8 per domain, injected via `register()`/`param()`/`paramExt()`.
- `toClientSimulation()` (line 747) — projects **full** parameter metadata (all 9 fields) into `ClientSimulation`; no drop.

Repo-wide search evidence: a single `interface SimulationParameter` declaration (`registry.types.ts:30`), a single `INTERACTIVE_SIM_IDS` declaration (`registry.ts:19`) with all consumers importing it.

---

## 4. State Classification Consolidation (**VERIFIED**)

`components/simulation-runner/simulation-state.ts` contains the **only** literal (`DYNAMIC_SIM_IDS`, 6 ids, annotated `as const satisfies ReadonlyArray<string>`). `SIMULATION_STATE_TYPES`, the 11-id parameterized set, and `getSimulationStateType()` are **derived** from registry `INTERACTIVE_SIM_IDS` — the classifier and the registry cannot diverge (asserted by reference-identity tests in §12).

`components/simulations/constants.ts` is a zero-literal re-export shim (interactive ids, `DOMAIN_ORDER`, presentation constants) preserving the historical import surface.

---

## 5. Parameter Contract (**VERIFIED**)

- Registry `SimulationParameter` → `ClientSimulation.paramsList` (full metadata, proving no drop) → slider view (`localParams`) → engine via `updateParameter()`.
- NL proposals seed a future engine instantiation (`nlParamOverrideRef`) instead of registry defaults; consumed once by the engine-creation effect.
- Reset always rebuilds from registry defaults through the shared payload builder; restore re-validates and **clamps** to canonical bounds (tested).
- `history-params.ts` (`HISTORY_LIMIT_*`, `buildHistoryQuery`, `parseHistoryLimit`) — no duplicated parameter spec anywhere; runner batching via `scheduleEngineParameterUpdate`/`flushPendingEngineUpdates` unchanged behaviorally.

---

## 6. Presentation Boundary (**VERIFIED**)

- `components/simulations/domain-presentation.ts` — the single `DOMAIN_STYLES` map: Tailwind gradients, hex accents, icons; annotated `as const satisfies Record<ScientificDomain, DomainPresentation>`, so the key set is **proven equal** to `SCIENTIFIC_DOMAINS` at compile time (adding a domain without presentation fails the build).
- All consumers (`simulation-runner.tsx` via `withIcons()`, `sim-categories.tsx`, `experimental-labs.tsx`, `continue-experimenting.tsx`, `config-payload.ts`) import from that one module; `engine-constants.ts`'s unused `DOMAIN_ICONS_MAP` was deleted.
- Registry/model layer contains zero styling (no Tailwind, icons, or colors).

---

## 7. API Surface (**VERIFIED**)

- **`GET /api/simulations/config`** — one-line handler over `buildSimulationConfigPayload()`; payload produced by `src/lib/simulation/config-payload.ts`, which is also the type of the client cache (`SimulationDomainConfig[]`, normalized to `Record<ScientificDomain, SimulationDomainConfig>` at the single fetch-boundary narrowing in `simulation-config-client.ts:32`). Live response: 6 domains × 8 sims = 48, registry order, `domainKey/name/colorClass/glowClass/accentHex/simulations[{id,name,desc,equation,defaultParams,paramsList}]`.
- **`POST /api/simulations/interpret`** — generic `validateSimulationRun<T>` + `SimulationRunCreateSchema`; `domain` preprocessed to the **derived** Title-Case enum (`SCIENTIFIC_TITLE_CASE_DOMAINS`) so persisted casing never needs a second literal; P0 assessment metadata (`buildAssessmentMetadata`) single-construction + stream-back intact; persisted field names unchanged (`simulationId, userId, domain, parameters, stateSnapshot, aiInterpretation, timestamp`).
- **`GET /api/simulations/history`** — `parseHistoryLimit` (clamped 1–100) + `buildHistoryQuery` (userId always from auth context); response shape + ETag/304 unchanged.
- **`POST /api/simulations/natural-language`** — `NlInterpretationRequestSchema` + `NaturalLanguageInterpreter`; `DOMAIN_ENUM = z.enum(SCIENTIFIC_DOMAINS)` is the single trusted narrowing for NL input and LLM output.

No route file contains simulation literals; all consume the registry (verified by read-through and grep).

---

## 8. Client Projection & Runner Integration (**VERIFIED**)

- `simulation-config-client.ts` — single narrowing at the untrusted fetch boundary; module-level promise cache + `clearSimulationConfigCache()`.
- `simulation-runner.tsx` — `RunnerDomainConfig = SimulationDomainConfig & { icon }` via explicit `withIcons()` mapper; typed `resolveSlug` iterating `DOMAIN_ORDER`; conceptual HUD icons (`Orbit`/`Brain`) imported directly; zero casts added.
- `simulation.types.ts` — re-exports canonical types only; keeps `SimulationStateType`, `TelemetrySnapshot`, `TelemetrySyncCallback` (runtime-owned, not duplicated from the registry).

---

## 9. Validation Boundary (**VERIFIED**)

`src/lib/security/validation.ts`:
- Domain set **derived** from `SCIENTIFIC_DOMAINS` (Title-Case normalization at the untrusted boundary only).
- `simulationId` length-bounded; `parameters` = `z.record(z.string(), z.number().finite().min(-1000).max(1000))`; `stateSnapshot` = string-keyed arbitrary-object record (engine-typed snapshot contract is internal-only); `stateType` = fixed enum; `simulationTime` finite 0–86400; `entities` = `z.any()` array (documented: genuinely dynamic runtime shape) narrowed immediately after validation.
- Removed the old `): any` function signature — `validateSimulationRun<T>(data, schema: z.ZodType<T>): T` is fully typed.
- Cast sweep: **no production `as` casts bridging divergent contracts remain** in any simulation path; the only casts left are the intentional single fetch-boundary narrowing and test-file stubs.

---

## 10. NL Pipeline + Assessment Flow (**VERIFIED**)

- `nl-interpreter.service.ts` — `buildRegistrySystemPrompt()` lists every registered sim id + name and the domain rules **from the registry**; `LlmInterpretationOutputSchema` (schema `DOMAIN_ENUM`) rejects unknown ids; `resolveNlProposal` + result union (`NlReady | NlNeedsInput | NlUnsupported`), `fallback-interpreter.ts` keyword matcher, `deterministic-fallback.ts` keyless proposal — all consume `getAllSimulations()`, none declare ids.
- Assessment boundary unchanged from P0/P1: validated payload → prompt with `stateType`/`simulationTime` context → `buildAssessmentMetadata` single construction point → `SimulationRun.create` with the same persisted fields. Persisted field-name audit: **no changes** (diff of `simulation-run.ts` is P0/P1 additive metadata only: `source`, `fallbackReason`, typed `parameters`).

---

## 11. Dead Code (**VERIFIED**)

**Deleted (zero consumers, via `git rm`):**
- `components/simulation-runner/sim-controls.tsx`, `sim-header.tsx`, `spark-insight.tsx`
- `src/lib/ai/llm.ts`
- `src/modules/simulations/core/{engine,lifecycle-manager,reset-fix,snapshots}.ts`
- `src/modules/simulations/domains/{anatomy,biology,mathematics,physics,quantum}.ts`
- `src/modules/simulations/{registry.ts,types.ts}`
- `src/modules/spark/{chat-application.service.ts,spark.prompt.ts}`
- `engine-constants.ts` `DOMAIN_ICONS_MAP`, registry.types `SimulationConfig`/`SimulationParameterSpec`, runner-local duplicates

**Kept:** `getAllSimulations()` (4 production consumers), engine switch `default:` branches (defensive — unreachable by construction for registered sims), `spark-ai.service.ts`, `SimulationHistory` model, engine `stop()`.

**Kept (test-support):** `getAllSimulationIds()` — registry-derived, used by regression tests only.

**Deferred (requires migration/data analysis — do not delete):** `SimulationConfig` DB model (`src/database/models/simulation-config.ts`, zero consumers) and related unused schema surfaces.

**Documented deficiency (not fixed — behavior risk, P1 carry-over):** `historyCacheRef` is per-sim and never invalidated after a new run, so a fresh assessment can be shadowed by the cached page; intentionally out of P2's no-behavior-change mandate.

---

## 12. Tests (**VERIFIED**, 82 → 101)

New suite `src/lib/simulation/__tests__/contracts.test.ts` (19 tests, 8 describes) — the P2 contract consolidation regressions:

| Requirement | Proof |
|---|---|
| Registry is the single catalog | 48 entries; every sim in exactly one domain (via `domain:id` key); 8 per domain; `SCIENTIFIC_DOMAINS` ≡ `DOMAIN_ORDER` |
| Interactive classification has no duplicate source | `CLIENT_INTERACTIVE_SIM_IDS` is `toBe` (reference-identical to) `INTERACTIVE_SIM_IDS`; 17 unique, all registered via `isInteractiveSim`; parameterized set = 17 − 6 derived; `SIMULATION_STATE_TYPES` consistent with the classifier; unknown slug → `conceptual` |
| Client projection preserves the registry contract | `paramsList` carries key/label/type/bounds/default; motion param key/type/bounds spot-checked |
| API config payload derives entirely from the registry | 6 × 8 = 48, registry order, name/color/glow/accent shape per domain |
| Unknown simulation ids rejected | Registry lookup + `LlmInterpretationOutputSchema` both reject |
| NL whitelist derives from the registry | Prompt contains every `"id": name` pair + the domain rule line |
| Reset + history restore use canonical definitions | Reset defaults pass `checkParameterBounds`/`buildParameterSchema`; restored values pass bounds; out-of-range restore **clamps** to canonical max |
| Compile-time assertions | `DYNAMIC_SIM_IDS` tuple is exactly the 6 dynamic ids |

All 82 pre-existing tests (incl. the 17 lifecycle engine tests and 8 registry tests) remain green unchanged.

---

## 13. Validation

| Check | Result |
|---|---|
| `pnpm test` | **PASS** — 101/101 (8 files) |
| `npx tsc --noEmit` | **PASS** — clean (one test-side narrowing fix applied, see below) |
| `pnpm build` | **PASS** — compiled, all routes present (incl. `/api/simulations/config`, `natural-language`) |
| `pnpm lint` | **PASS on P2-touched paths** — zero findings in any simulation/registry/config/NL file; remaining repo errors are pre-existing and outside the simulation scope (spark, cognitive, knowledge engine, matrix, auth, hooks, ...) |
| Repo-wide searches | Single `INTERACTIVE_SIM_IDS` declaration; single `DOMAIN_STYLES` module with typed import consumers; single `SimulationParameter` interface; **no cross-imports** between `src/lib/simulation` and the knowledge engine |
| Live runtime check (production server, port 3101) | `GET /api/simulations/config` → **200**; 6 domains × 8 sims = 48 in registry order; full 9-field `paramsList` on every sim (0 missing contract keys); `accentHex` present per domain; server stopped |

**TS note:** the `as const satisfies ReadonlyArray<string>` annotation on `DYNAMIC_SIM_IDS` narrowed element types to literals, which surfaced one test `includes(string)` mismatch — widened via `const dynamicIds: ReadonlyArray<string> = DYNAMIC_SIM_IDS` (no cast). This is the compiler enforcing the derived-set guarantee, not a runtime defect.

---

## 14. Remaining Issues (not implemented — out of scope)

- **Knowledge-engine `ScientificDomain` (documented, NOT merged):** `src/types/knowledge.ts:14` declares a separate 18-domain union (physics, mathematics, biology, human-anatomy, microbiology, astronomy, astrophysics, quantum-mechanics, chemistry, earth-science, medicine, neuroscience, computer-science, artificial-intelligence, engineering, philosophy-of-science, statistics, data-science) consumed exclusively by the knowledge module (`taxonomy.service`, `search.service`, `domain.service`, `concept.service`, `import/adapters`, `validations/knowledge.ts`). **INFERRED** separate subsystem taxonomy (domain slugs persist in knowledge documents — any merge requires a knowledge-engine migration, outside P2 and the no-unrelated-modules constraint). Verified: zero cross-imports in either direction.
- **Prompt hardening** (P1 carry-over): interpret fallback wording still claims "Dynamic state is fully active" on absolute-fallback despite stateType — unchanged.
- **History cache invalidation** (`historyCacheRef`) — documented in §11.
- **Unknown-slug 404** on `[slug]` pages (silently falls back to first sim) — unchanged.
- **Runner decomposition** (~1,100-line `simulation-runner.tsx` still unsplit) — deferred.
- **URL state for sim selection/params** — deferred.
- **P2 `SimulationConfig` DB model removal** — deferred pending migration analysis.

---

*File: `docs/p2-contract-consolidation-report.md` — companion doc: `docs/simulation-architecture.md`*