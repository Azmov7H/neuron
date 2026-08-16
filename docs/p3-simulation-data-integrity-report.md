# P3 — Simulation Data Integrity, Scientific Correctness & Experimental Data Cleanup: Report

**Scope:** Full audit of persisted `SimulationRun` records against the authoritative registry and the actual engine, classification of every record, root-cause analysis of cross-simulation AI contamination, scientific consistency verification of the formulas vs implementation, and a safe, dry-run-by-default cleanup tool.

**P2 baseline:** 101 tests, `tsc` clean, `pnpm build` clean, single authoritative registry, canonical `ScientificDomain`/`SimulationParameter` (P2 report: `docs/p2-contract-consolidation-report.md`).

**P3 result:** 135 tests (34 new), `tsc` clean, `pnpm build` clean, lint clean on P3-touched paths. **No destructive operation was executed.** The database was left exactly as found (1 live record, classified VALID → KEEP).

---

## 1. Executive Summary

- The local production database (`neuron.simulationruns`) was audited at two points in time: **0 documents** at discovery (P1/P2 live-verification rows were deleted after each report, per P1 §6) and **1 document** at final audit — a real user experiment on `relativity` created by the running dev server **after** discovery began (timestamp 2026-08-16T02:48Z).
- That single record is **fully coherent**: resolves against the registry, correct domain, valid in-bounds parameter, engine-correct snapshot shape, mathematically correct deterministic interpretation (Lorentz γ = 7.089 at v = 0.99c verified), honest `source: deterministic` metadata. **Classification: VALID → KEEP. No action required.**
- No synthetic/test/demo records exist in the database. No records require deletion, archiving, or review.
- The audit machinery (`src/lib/simulation/audit.ts` + `scripts/simulation-data-cleanup.ts`) classifies all 11 diagnostic categories, is dry-run by default, and can never delete REVIEW records.
- Cross-simulation contamination (the `ecosystem → immune` class) cannot originate from the current fallback generator for any registered simulation (48/48 covered); the residual vector is the unvalidated `simulationId` at the API boundary — documented in §6, not patched (API-contract change requires explicit authorization).

| Records | VALID | INVALID_* | AI_MISMATCH | SYNTHETIC | DUPLICATE | REVIEW |
|---|---|---|---|---|---|---|
| 1 | 1 | 0 | 0 | 0 | 0 | 0 |

## 2. Database Inventory

- **Location:** `mongodb://localhost:27017/neuron` (`MONGODB_URI` from `.env`, no override in `.env.local`; `src/config/env.ts` defaults identical).
- **Collection** (mongoose pluralization of the `SimulationRun` model): `simulationruns`.
- **Only production writer:** `app/api/simulations/interpret/route.ts:147` (`SimulationRun.create`). Verified by repo-wide search — no seed script, no test harness, no worker, and no other module writes this collection. `scripts/run-seed.ts` → `src/database/seed.ts` seeds knowledge topics only (no `SimulationRun` anywhere — grep-verified).
- **Adjacent collections:** `simulationhistories` (SimulationHistory model — 0 records), `simulationconfigs` (unused `SimulationConfig` model — 0 records), `anatomysimulations` (0 records). No backup/export JSON files exist in the repository.
- **No explicit synthetic/test/demo marker field exists.** The closest honest marker is `aiInterpretation.metadata.source` (`'ai' | 'deterministic'`) — which labels the *answer origin*, not the experiment's authenticity. Synthetic evidence therefore uses hard structural markers (see §11), never timestamps.

## 3. SimulationRun Counts

| Metric | Value |
|---|---|
| Total documents (final audit) | **1** |
| Distinct simulationIds | 1 (`relativity`) |
| Distinct stored domains | 1 (`Physics`, Title-Case legacy) |
| Distinct users | 1 (`6a099d2e486e7ba19b8db2f0`, valid ObjectId) |
| Records with `entities` / `metrics` fields | 0 / 0 |
| Records with `createdAt`/`updatedAt` | 1 / 1 |
| AI-source records | 0 |
| Deterministic-source records | 1 (`neuron-local-deterministic-engine`, `fallbackReason: provider_error`) |

## 4. Valid Records

**Record `6a8124f747d0225ce72ca28a` — `relativity` / `Physics` — VALID, KEEP.**

| Check | Result |
|---|---|
| simulationId resolves in registry | ✓ (`relativity`, physics, interactive parameterized_visualization) |
| domain matches registry | ✓ (`Physics` ≡ `physics`, case-insensitive legacy form) |
| parameters | `speed: 0.99` — within [0.0, 0.99] ✓, finite ✓, number type ✓, `speed` is the sim's only parameter (required) ✓ |
| snapshot shape | `{ visualizationState: { animationPhase: 13.034 } }` — exactly the engine-emitted render clock for a parameterized visualization ✓ |
| scientific coherence | γ = 1/√(1−0.99²) = 7.0888… — interpretation states 7.089, dilation interval 1/γ = 0.141 s, length contraction 100/γ = 14.1% — **all mathematically correct** ✓ |
| AI identity | explanation/concepts/actions all relativity-domain; `metadata.simulationType = 'relativity'`, `metadata.domain = 'Physics'` agree with the record ✓ |
| designation | Real user experiment (valid auth userId), deterministic fallback text (no AI keys configured in this environment) — honest `source` label. **No action.** |

## 5. Invalid Records

**None.** Zero documents classified INVALID_PARAMETERS, INVALID_DOMAIN, INVALID_STATE, MISSING_SNAPSHOT, STALE_SCHEMA, or UNKNOWN_SIMULATION.

## 6. AI Mismatches

**None persisted.** The contamination class was instead verified at the *generator* level (Phase C root cause, see §9). Pipeline trace (runner → validation → context → prompt → LLM/fallback → structured output → metadata → persistence):

1. **Runner** sends `simulationId, domain, parameters, stateSnapshot, stateType, simulationTime, userQuestion` from the registry-derived config client — ids the UI operates are always registered sims.
2. **Validation** (`src/lib/security/validation.ts`): `domain` is registry-derived (Title-Case normalization); **`simulationId` is validated only as an arbitrary 1–50 char string — no registry membership check at this boundary.** An unregistered id (e.g. a legacy `ecosystem` from an older catalog, or a direct API probe) passes validation and is persisted.
3. **Context/prompt** (interpret route): simulation id, domain, stateType, snapshot and parameters are all injected; the prompt instructs structured explanation only. Correct simId + snapshot make cross-sim content an LLM hallucination, not a system mapping.
4. **LLM path:** not exercised in this environment (no API keys — every live call falls back).
5. **Fallback path** (`generateLocalSimulationFallback`): the domain-first switch covers **48/48 registered simulations with dedicated branches** (verified id-by-id). Domain-default branches exist (`physics→gravity`, `biology→immune`, `anatomy→blood`, `mathematics→graph`, `quantum→uncertainty`, `space→stellar`) and fire **only for simulation ids absent from the switch** — i.e. unregistered/legacy ids. **An unknown biology-domain id receives the immune-system text** (with `pathogenCount`/`wbcCount` default placeholders) — this is the exact mechanism that produces "ecosystem-like record, immune interpretation" records when a stale catalog id or a direct probe persists.
6. **Structured output / metadata / persistence:** `buildAssessmentMetadata` is a single construction point — label honesty verified (never claims a real model for deterministic output).

**Conclusion:** the defect class originates upstream of persistence (unconstrained `simulationId` at the API boundary + domain-default fallback text for unknown ids), not from the database layer. The classifier flags such records (UNKNOWN_SIMULATION / SYNTHETIC_TEST_DATA / AI_MISMATCH) so they surface in the cleanup plan instead of being silently trusted. A contract-tightening change (rejecting unregistered `simulationId` at validation) is a **recommended follow-up requiring explicit authorization** — not applied in P3 (API-contract change).

## 7. Empty Snapshots

Snapshot expectations derived from the engine (verified against `simulation-engine.ts` `update()`), per simulation:

| stateType | sims (48 total) | snapshot emitted by engine | empty snapshot classification |
|---|---|---|---|
| dynamic (6) | motion, bacteria, virus, immune, probability, graph | `acceleration/velocity/frictionalForce` · `population/growthRate` · `susceptible/infected/recovered/r0` · `pathogensRemaining/wbcUnits` · `beadsSettled` · `nodeCount/averageSpeed` | **MISSING_RUNTIME_STATE** |
| parameterized_visualization (11) | relativity, gravity, heart, neural, blood, functions, wave, uncertainty, orbit, blackhole, stellar | `{ visualizationState: { animationPhase } }` | EXPECTED_EMPTY pre-P1; post-P1 STALE_SCHEMA (render clock expected) |
| conceptual (31) | the remaining non-interactive labs | none (or explicit `{ visualizationState: 'conceptual' }` marker since P1) | **EXPECTED_EMPTY** |

Persisted records: **0 empty snapshots.** The single record has the correct parameterized visualization shape.

## 8. Parameter Violations

**None persisted.** Registry-verified bounds/type/integers/finiteness:

| Simulation | canonical params (min–max, type) | engine equation used for coherence re-check |
|---|---|---|
| motion | force 0–50 (int), mass 1–20, friction 0–0.8 | μmg; a = max(0, F − μmg)/m (verified F=36, m=20, μ=0.8 → 156.8 N, a = 0 — physically justified) |
| virus | transmissionRate 0.1–0.9, recoveryRate 0.02–0.3, populationSize 30–300 (int) | β/γ ratio reporting + SIR agent totals ≤ N |
| immune | pathogenCount 10–100 (int), wbcCount 2–35 (int) | pathogensRemaining ≤ initial; wbcUnits ≤ initial |
| probability | beadsCount 50–400 (int) | beadsSettled ∈ [0, beadsCount] |
| graph | nodesCount 10–50 (int), connectionProbability 0–0.5 | nodeCount ≤ nodesCount; averageSpeed ≥ 0 |

Historical clamping is NOT performed anywhere in P3 — out-of-range values are classified, never silently fixed.

## 9. Scientific Inconsistencies / Formula vs Implementation Audit (§7 of the brief)

Audited against the actual engine (the runtime authority), not the registry equation string:

- **MOTION:** engine computes `F_friction = μ·m·9.8`, `F_net = max(0, F − F_friction)`, `a = F_net/m`; friction *decelerates* only while `force === 0` (asymmetric). Static-vs-kinetic distinction is not modeled; `a = 0` with active force is correct (below-threshold regime, velocity persists constant — matches snapshot `velocity` semantics). **Consistent; no fix.**
- **RELATIVITY:** γ = 1/√(1−v²) in both engine draw and fallback; v ∈ [0, 0.99] → γ ∈ [1, 7.09]. Verified numbers ✓. **Consistent.**
- **VIRUS:** the sim implements a **stochastic agent-based SIR** (particles in a box, contact-transmission probability `min(1, β·0.04·dt)`, recovery after `(1/γ)·12` ticks). `r0 = β/γ` is a **diagnostic ratio reported in the snapshot, not the dynamics driver** — the engine does NOT evolve compartments by an ODE with that R₀. Documented semantics; no formula replacement.
- **PROBABILITY:** `beadsSettled` = **count of completed beads** (bins reached); spawning is accumulator-paced up to configured `beadsCount`; in-flight beads are excluded; the histogram bins are render-internal and not part of the persisted snapshot. Documented semantics.
- **IMMUNE:** snapshot carries `pathogensRemaining` (active) + `wbcUnits` (constant WBC list length); WBC steering uses `pow(0.95, dt)` damping; contact < 10 px deactivates a pathogen. Coherence checks enforce ≤ initial counts.

**Registry equation strings were not rewritten; no arbitrary approximations introduced. Zero scientific inconsistencies found in the persisted record.**

## 10. Duplicate Records

**None.** The duplicate detector (`recordContentDigest` grouped per user) finds no content-identical records (1 record → no groups). Earliest-in-group preservation logic is regression-tested.

## 11. Synthetic / Test Data

**None persisted.** Synthetic detection uses hard structural evidence **only** (timestamp heuristics are explicitly forbidden by the brief):

| Rule | Evidence |
|---|---|
| Invalid userId | `userId` not a 24-hex ObjectId (auth always supplies valid ObjectIds) |
| Unregistered fallback probe | unknown simId + deterministic engine + empty parameters + empty snapshot (the UI cannot reach unregistered sims) |
| Empty interactive payload | interactive sim + empty params + empty snapshot (the runner always seeds registry defaults) |

**`source: deterministic` alone is NOT synthetic evidence** — it labels a real user experiment answered by the local fallback (exactly the pattern of live record `6a8124…`).

## 12. Records Requiring Review

**None.** (REVIEW is the protected disposition for AI_MISMATCH, INVALID_*, MISSING_SNAPSHOT, UNKNOWN_SIMULATION and ambiguous records — the cleanup script never assigns it DELETE under any flag combination.)

## 13. Recommended Cleanup

**No cleanup is currently required.** The database contains exactly one VALID record to KEEP.

Tooling for future cleanups (ready, dry-run by default):

```
pnpm tsx scripts/simulation-data-cleanup.ts --dry-run            # default
pnpm tsx scripts/simulation-data-cleanup.ts --apply --delete-synthetic
```

- Prints KEEP/ARCHIVE/DELETE/REVIEW with affected record IDs (verbose adds reasons + synthetic evidence).
- Deletions require `--apply` AND the disposition-specific `--delete-synthetic` flag AND an interactive `DELETE` confirmation (or `--yes` for scripted operators).
- ARCHIVE (duplicates, stale-schema-era) and REVIEW are report-only — the script performs no updates, moves, or field renames on them (no archive collection exists; persisted fields are frozen by P2's backward-compatibility guarantee).
- `--report-out=path.json` emits the full plan + snapshot expectations table.

## 14. Migration Safety Assessment

- **No schema migration is necessary** and none was performed. The audit found no persisted data requiring reshaping.
- **No model changes:** `SimulationRun` untouched — `simulationId, userId, domain, parameters, stateSnapshot, aiInterpretation, timestamp` keep P2's exported names exactly.
- **No records deleted/archived/moved**, and none recommended.
- **Dependency additions:** `tsx` (devDependency) for the cleanup script; `src/lib/simulation/audit.ts` (pure, no mongoose import — reusable server/client-safe); `scripts/simulation-data-cleanup.ts` (script-level mongoose, no app import).
- The audit module imports registry + a single engine-mirrored snapshot-field table (its own literal, documented and test-guarded: the §8 table asserts 6/11/31 split against the registry's interactive set, so drift fails tests).

---

## Outputs (brief §18)

- **A. Data integrity report** — this document.
- **B. Exact corrupted/synthetic records** — **none exist**. The DB holds the single VALID record `6a8124f747d0225ce72ca28a` (relativity).
- **C. Root cause analysis** — §6/§9: contamination originates at the validation boundary (unconstrained `simulationId`) plus domain-default fallback text for unknown ids in `generateLocalSimulationFallback`; the class is now detected by the classifier; contract tightening is a recommended, unauthorized follow-up.
- **D. Safe cleanup strategy** — §13: dry-run default, per-disposition flags, interactive confirmation, REVIEW never deleted, ARCHIVE report-only.
- **E. Cleanup script** — `scripts/simulation-data-cleanup.ts`, tested end-to-end against the live DB (dry-run: `KEEP=1`, no writes).
- **F. Tests** — `src/lib/simulation/__tests__/audit.test.ts` (34 tests: unknown sim, wrong domain, Title-Case domain, invalid param, out-of-range, non-finite, wrong type, missing snapshot, expected-empty conceptual, stale schema, contaminated fields, impossible values, engine-coherent valid records, SIR/beads coherence, AI contamination, metadata mismatch, own-marker acceptance, synthetic user/probe evidence, deterministic≠synthetic, duplicates, plan dispositions, REVIEW protection, flag-gated deletions, §8 snapshot table). Existing 101 P2 tests unchanged and green.
- **G. Commands used** — inventory: `mongosh` read-only scripts; audit UI-hours: `npx tsc --noEmit`, `pnpm test`; live dry-run: `pnpm tsx scripts/simulation-data-cleanup.ts --dry-run --verbose`; abort-guard: `pnpm tsx scripts/simulation-data-cleanup.ts --apply` (exit 2, no writes).
- **H. Final validation** — §15.

## 15. Final Validation

| Check | Result |
|---|---|
| `pnpm test` | **PASS** — 135/135 (9 files; 101 P2 + 34 new) |
| `npx tsc --noEmit` | **PASS** — clean |
| `pnpm build` | **PASS** |
| `pnpm lint` | **PASS on P3-touched paths** (audit.ts, audit.test.ts, cleanup script, report); repo-wide pre-existing errors outside simulation scope unchanged |
| Cleanup script dry-run | **PASS** — connected, audited 1 record → KEEP=1; zero writes |
| Destructive-mode guard | **PASS** — `--apply` without `--delete-synthetic` aborts with exit 2 |

**Deletion ledger:** deleted **0** · preserved **1** · archived **0** · reviewed **0**. Destructive operations: **none executed** — the default final state (AUDITED + REPORTED + TESTED) is the delivered state.

---

*File: `docs/p3-simulation-data-integrity-report.md` — companions: `docs/simulation-architecture.md`, `docs/p2-contract-consolidation-report.md`*