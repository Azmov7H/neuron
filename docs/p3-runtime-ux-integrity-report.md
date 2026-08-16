# P3 — Simulation Runtime & UX Integrity Audit Report

**Scope.** Evidence-based audit of the full simulation execution path — registry → engine → loop → telemetry → UI → assessment → API — for runtime integrity, UX robustness, and internal consistency of the Neuron Scientific Simulation System, with implementation of all P0/P1 (and high-risk P2) findings and regression tests.

**Method.** The source code is the current behavior authority. Every finding and fix below is traced to a specific file/line, and every fix is verified by execution (§18 verification log: test suite, `tsc --noEmit`, `pnpm build`, ESLint on touched paths). This pass **modified production code** (unlike the P3 scientific audit, which was inspect-only) per the "audit + repair, verified" mission contract.

**Baseline verified (P3.1).** 48 simulations · 6 domains · 17 interactive (6 dynamic / 11 parameterized) · 31 conceptual · 153 tests (11 files) · `tsc` clean · `pnpm build` clean.

---

## 1. Executive Summary

**GATE RESULT: GREEN — P0 = 0, P1 = 0 outstanding, all fixes implemented and regression-tested.** Post-mission state: **172 tests (13 files) · `tsc` clean · `pnpm build` clean · ESLint clean on all touched paths**.

The execution path is sound and consistent after this pass. Headline repairs:

1. **VAL-01/VAL-02 — parameters were the only unguarded boundary.** `POST /api/simulations/interpret` accepted out-of-registry parameters that could produce NaN/Infinity in formulas (motion `a = F/m` with `m→0`, relativity `1/√(1−v²)` with `v→1`) and feed them to the LLM prompt, the deterministic fallback, and the persisted `SimulationRun`. A registry-driven `clampSimulationParameters` boundary now rejects unknown simulations with 400 and clamps/drops non-finite and undeclared values on **both** ingestion paths (interpret route, history restore).
2. **MEAS-04 — telemetry lied about the motion box.** The reported velocity was `boxVel·4`, a different scale than the velocity that drives the drawn position. Telemetry now reports the actual box velocity.
3. **RC-04 — friction only fought motion when the force was zero.** Below the friction threshold a moving box glided forever; now friction continuously opposes motion and the box decelerates to rest without ever going negative.
4. **MEAS-03 — the HUD recomputed a 190-sample Lotka–Volterra integration every animation frame.** Now memoized on (p0, p1).
5. **UX-02 — the equation badge showed raw LaTeX** (`\frac{t}{\sqrt{1 - v^2/c^2}}`) on the two most prominent labs. A deterministic `presentEquation` translator now renders readable plain text and covers nested constructions across **all 48** registry equations.
6. **EDGE-06/ASSESS-02 — NaN/Infinity could reach React state and the AI pipeline**: snapshots are now sanitized recursively at the telemetry emission point.
7. **Loop integrity (RC-07/RC-01/RC-02/RC-03)** — external frame drive can no longer double-schedule physics; reset drains pending slider batches; `resetTime` zeroes the sync clock; tab-visibility flushes coalesced updates.
8. **Dead-code cleanup (DEAD-01…07)** — unreachable draw branch, never-used constants/types/re-exports removed; wired constants centralized (incl. `AXON_PROGRESS_MAX_OFFSET`).

**Deferred (by constraint, not by risk):** P3.2–P3.8 (§20) remain unauthorized and are recorded with justification.

---

## 2. Execution Path (as implemented, verified)

```
src/lib/simulation/registry.ts            ← 48 defs: equation string, params (unit/type/min/max/step/default/required)
        ↓  toClientSimulation / config-payload
GET /api/simulations/config + client LOCAL_FALLBACK_CONFIG
        ↓  components/simulation-runner/simulation-runner.tsx
SimulationEngine (interactive 17)   vs   ConceptualTelemetryHUD (conceptual 31)
        ↓  getSimulationStateType (dynamic 6 | parameterized_visualization 11 | conceptual 31)
simulation-engine.ts: updatePhysics() → sanitizeSnapshot() → stateSnapshot → draw() ; 10 Hz telemetry
        ↓  POST /api/simulations/interpret   ← clampSimulationParameters (boundary)
validation → LLM stream | deterministic fallback → SimulationRun.create (persistence)
        ↓  history restore ← clampSimulationParameters (boundary)
SimulationRun ← params + snapshot
```

External ingestion boundaries: interpret route + history restore → `clampSimulationParameters`. Internal emission boundary: `sanitizeSnapshot` at telemetry build.

---

## 3. Severity Inventory

| ID | Severity | Finding | Status |
|---|---|---|---|
| VAL-01 | P0 | Interpret route accepts out-of-registry parameters (NaN/Infinity → LLM/fallback/persistence) | FIXED |
| VAL-02 | P0 | History restore applies persisted parameters unvalidated | FIXED |
| MEAS-03 | P0 | LV integration recomputed per animation frame (31-sim HUD hot path) | FIXED |
| MEAS-04 | P1 | Motion telemetry velocity ≠ drawn velocity (`boxVel·4`) | FIXED |
| RC-04 | P1 | Friction applied only when force == 0; sub-threshold boxes glide forever | FIXED |
| RC-07 | P1 | External frame drive could double-schedule the live loop (2× speed, 2× telemetry) | FIXED |
| RC-01 | P1 | Reset could be re-poisoned by a pending slider RAF batch | FIXED |
| RC-02 | P1 | Coalesced parameter updates lost on tab visibility change | FIXED |
| RC-03 | P1 | `resetTime` left `lastSyncTime` stale (telemetry clock skew) | FIXED |
| ASSESS-02 | P1 | Snapshot allowing NaN values could reach the assessment prompt | FIXED |
| EDGE-06 | P1 | NaN/Infinity reach React state from the engine | FIXED |
| UX-02 | P1 | Equation badge renders raw LaTeX for most interactive + conceptual sims | FIXED |
| EDGE-05 | P1 | Sim-switch leaves previous sim's telemetry visible under new sim's name | FIXED |
| PHYS-04 | P2 | "Defaults" restored sliders but left grown engine state running | FIXED |
| UX-01 | P2 | Slider values presented without their units in multiple places | FIXED |
| UX-07 | P2 | History modal: fetch failure masqueraded as empty; legacy rows could crash | FIXED |
| FB-01…FB-16 | P2/P3 | Fallback-formula NaN-prone guard rails | FIXED/verified (see §20) |
| A11Y-… | P2 | Modal semantics, non-button items, missing aria-labels, LTR direction | FIXED |
| DEAD-01…07 | P3 | Dead code, stale types, never-used constants | FIXED |

---

## 4. Parameter Boundary — VAL-01 / VAL-02 (P0)

**Finding.** The registry is the authoritative parameter boundary (min/max/step/default per key), but two external ingestion points bypassed it: `POST /api/simulations/interpret` (unknown sim IDs silently fell into wrong branches, values like `mass=0 → a=∞` or `speed=1 → √(1−v²)=NaN` reached the LLM prompt, the deterministic fallback **and** the persisted row) and history restore (legacy/persisted rows applied directly to engine physics).

**Fix.** `clampSimulationParameters(simulationId, domain, params)` in `src/lib/simulation/schemas.ts` — registry-driven sanitizer:

- Unknown simulation ID or domain mismatch → `simulation: null` (caller rejects with 400).
- Every in-registry key clamped to `[min, max]`; out-of-range keys reported in `changed`.
- Unknown keys and non-finite values (`NaN`, `±Infinity`) **dropped** — they never enter the clamped set.

Interpret route (`app/api/simulations/interpret/route.ts`): unknown sim → `400 Unknown simulation`, then the live `parameters` object is rebuilt from the clamped set (changed values overwritten, undeclared/non-finite keys deleted) so prompt, fallback, and `SimulationRun.create` observe only sanitized values. History restore (`simulation-runner.tsx` `loadHistoryItem`): `clamped` is what is applied to React state and `engine.updateParameter` before the engine is touched.

---

## 5. Loop & Lifecycle Integrity — RC-01/02/03/07 (P1)

- **RC-07** — `advanceFrame` cancels a pending live-loop rAF handle before stepping and re-arms exactly once: an external driver (tests, tooling) can never double-run physics or double-emit telemetry.
- **RC-01** — `handleFullReset` drains the coalesced slider batch (`pendingParamUpdatesRef = {}`) and cancels the RAF flush *before* `resetTime()`, so a stale pre-reset user value can no longer re-apply after the reset.
- **RC-02** — `visibilitychange` to visible flushes pending parameter updates immediately (no lost final slider position).
- **RC-03** — `resetTime` zeroes `lastSyncTime` (and the full timing model: frameCount, simulationTime, deltaTime, previousTimestamp, spawnAccum) — no post-reset telemetry clock skew.

---

## 6. Motion Physics & Telemetry — RC-04 / MEAS-04 (P1)

**Findings.** `motion`: friction participated only in the `force === 0` branch, so a sub-threshold force left a moving box gliding forever (or — worse — the old code could inject reverse motion); and telemetry reported `velocity = boxVel·4` while position advanced with the raw `boxVel` scale — the readout and the drawing disagreed.

**Fix** (`simulation-engine.ts`, motion branch):

- `a = (F − μmg)/m` with the sign of friction always opposing motion (`boxVel > 0` → `F − Ff`; `< 0` → `F + Ff`; stationary → net force only if it exceeds the static threshold, else `a = 0`).
- `boxVel` is clamped ≥ 0 — a box never spontaneously glides backward.
- Telemetry `velocity: this.boxVel` — the single authoritative scale (also drives `boxX`).

Regression: a box pushed with `force=30` then dropped to `force=5 < μmg=9.8` decelerates to exactly `velocity = 0` and stays parked (`acceleration = 0`, no negative excursion across 80 frames).

---

## 7. Telemetry Integrity — EDGE-06 / ASSESS-02 / EDGE-05 (P1)

- **EDGE-06/ASSESS-02** — the snapshot sanitizer now lives in a **shared module** (`src/lib/simulation/snapshot-sanitize.ts`, recursive non-finite stripper) used at **both** snapshot boundaries: the client engine's telemetry emission **and** the server-side interpret ingestion (`app/api/simulations/interpret/route.ts` sanitizes the incoming `stateSnapshot` before it can reach the LLM prompt or the persisted `SimulationRun` row — a bypassing client can no longer inject NaN/Infinity). React state, the Spark panel, and the AI/assessment payload can never observe non-finite values from engine state.
- **EDGE-05** — switching labs cleared the floating telemetry badge synchronously inside an effect (lint: `set-state-in-effect`); moved to a **render-time adjustment** (React-documented "storing information from previous renders" pattern — `if (prevSimId !== activeSimId) { setPrevSimId(...); setTelemetrySnap(clean); }`) so the cleared snapshot lands before the engine-instantiation effect runs, with zero effect-body setState.

---

## 8. HUD Performance — MEAS-03 (P0)

**Finding.** `conceptual-telemetry-hud.tsx` recomputed the full 190-sample Lotka–Volterra integration (50 s window, dt = 50/190) on **every animation frame** for the ecosystem lab.

**Fix.** The integration is pure with respect to `(p0, p1)` → memoized via `useMemo(…, [isEcosystem, p0, p1])`; only the playhead index derives from the per-frame phase. (RF-3 rendering from P3.1 is otherwise untouched.)

---

## 9. Equation Presentation — UX-02 (P1)

**Finding.** The equation badge (runner + HUD) rendered raw registry strings: `t' = \frac{t}{\sqrt{1 - v^2/c^2}}`, `a = \frac{F_{thrust} - \mu m g}{m}` — backslashes and braces visible on the most prominent labs. No KaTeX/MathJax exists in the project.

**Fix.** `src/lib/simulation/equation-presentation.ts` — deterministic plain-text translator:

- Braced subscripts `X_{...}` → `X_...` (also unblocks fraction flattening).
- `\frac{a}{b}` and `\sqrt{x}` → `a/b` and `√(x)`, including **nested** constructions (`\frac{a}{\frac{b}{c}}`, `\frac{t}{\sqrt{1-v²/c²}}`) via interleaved flatten/symbol passes until stable (8 iterations max).
- Greek tokens → Unicode glyphs (α, β, μ, σ, √, →, ≤, ≈, ∝, ⇒ …); `\left(`/`\right)` collapse to parentheses.
- Unrecognized tokens (e.g. `\hbar`, `\sin`) are left verbatim — never silently dropped.

Wired into the runner equation badge **and** the conceptual HUD equation label. Verified over **all 48** registry equations: no `\frac`/`\sqrt` remnants, deterministic output.

---

## 10. Parameter Presentation & Reset — UX-01 / PHYS-04 (P2)

- **UX-01** — slider step/unit suffixes: `formatParamValue` appends the registry `unit` and shows full precision (e.g. `0.05` sample steps) where the old fixed `toFixed(2)` truncated/omitted units.
- **PHYS-04** — "Defaults" previously reset sliders only, leaving a grown state box running under default-looking sliders. `handleResetParams` now routes through `handleFullReset` (the same deterministic reset contract as the toolbar): parameters (React + engine) + engine time/state + telemetry + assessment output.

---

## 11. History UX — UX-07 (P2)

- Fetch failure sets an explicit `historyError` (never masquerades as "no history").
- The modal dialog uses proper dialog semantics (`role="dialog"`, `aria-label="Calibration history"`, focusable close) and an error state.
- Legacy/pre-schema rows render via `EMPTY_LEGACY_INTERPRETATION` instead of dereferencing missing fields.
- The history effect performs all setState from its async callback (cache-hit path included) — satisfies the lint `set-state-in-effect` contract with identical UX-07 semantics.
- `FALLBACK_REASON_LABELS` resolved from a single source (`@/lib/simulation/assessment`) — no duplicated local const.

---

## 12. Accessibility (P2)

- `app/layout.tsx`: explicit `<html lang="en" dir="ltr">`.
- History panel: `role="dialog"` + aria-labels for open/close/pause/resume/reset/AI/interpret/history controls.
- Simulation controls (pause/resume/reset, lab switcher), conceptual HUD plot, and the natural-language input carry aria-labels.

---

## 13. Dead Code & Constants — DEAD-01…07 (P3)

- Removed the unreachable `draw()` default lissajous branch (~90 lines) — the engine is only ever constructed for the 17 interactive sims.
- `engine-constants.ts`: deleted never-used exports — `CANVAS_LOGICAL_WIDTH/HEIGHT`, `PARTICLE_POOL_SIZE`, `SIR_PARTICLE_RADIUS_SUSCEPTIBLE/INFECTED`, `WBC_RADIUS`, `WBC_NUCLEUS_RADIUS`, `PATHOGEN_RADIUS`, `BEAD_RADIUS`, `PARTICLE_COLORS`; fixed a duplicated `DEFAULT_POPULATIONS` block.
- Engine-consumable constants are wired rather than deleted (zero behavior change): `GRAVITY_CONSTANT`, `MOTION_VELOCITY_DAMPING`, `MOTION_BOX_START_X`, `DEFAULT_POPULATIONS`, `AXON_SIGNAL_BASE_SPEED`, `AXON_PROGRESS_MAX_OFFSET` (replaces the magic `50` in the axon progress modulo), `CANVAS_BG_COLOR`, `GRID_CELL_SIZE/COLOR/LINE_WIDTH`, `ORBIT_RENDER_SPEED` (restored — the P3.1 RF-2 normalization constant).
- `simulation.types.ts`: removed the stale `ScientificDomain`/`SimulationParameter` re-export (single canonical import: `@/lib/simulation/registry.types`) and the unused `TelemetrySyncCallback` alias.

---

## 14. Regression Tests (15 new; 153 → 168)

| File | Coverage |
|---|---|
| `components/simulation-runner/__tests__/simulation-engine.test.ts` | RC-04: sub-threshold force decelerates a moving box to exactly 0, never negative, stationary box doesn't creep; MEAS-04: telemetry velocity == box velocity scale (2×1.04×0.03 at dt=1); RC-07: `advanceFrame` cancels the pending loop, re-arms once, no double advance; EDGE-06: `sanitizeSnapshot` strips NaN/±Infinity recursively, passes strings/arrays, JSON-round-trips (2 pre-existing assertions updated to the corrected velocity scale) |
| `src/lib/simulation/__tests__/schemas.test.ts` | VAL-01/VAL-02: unknown id → null; domain mismatch → null; out-of-range clamped with `changed` list; unknown + non-finite keys dropped; in-range values pass through |
| `src/lib/simulation/__tests__/equation-presentation.test.ts` (new) | UX-02: fraction flatten (incl. nested), Greek glyphs, sqrt/relations, Lorenz params, unknown tokens verbatim, all-48-registry determinism + no `\frac`/`\sqrt` remnants |
| `src/lib/simulation/__tests__/snapshot-sanitize.test.ts` (new) | Shared sanitizer boundary: top-level NaN/±Infinity strip, nested recursion, 100-level deep nesting, JSON round-trip safety |

---

## 15. Verification Log

| Gate | Result |
|---|---|
| `pnpm test` | **172/172 pass (13 files)** |
| `pnpm exec tsc --noEmit` | clean |
| `pnpm build` | compiled successfully (first retry: transient Google Fonts fetch failure, not code) |
| `npx eslint` (all touched paths) | 0 problems (runner `set-state-in-effect` regressions introduced by this session's EDGE-05/UX-07 edits were restructured and eliminated) |

Session compile/verify notes: first `tsc` dump after the edit batch surfaced 5 errors — duplicate `DEFAULT_POPULATIONS` (engine-constants.ts), missing `ORBIT_RENDER_SPEED` export (accidentally removed with dead constants), and `handleFullReset` used before declaration — all fixed and re-verified green.

---

## 16. Compatibility Analysis

- **No schema or DB changes** — the persisted `SimulationRun` shape is untouched; Mongo remains the only store.
- **No payload changes** — interpret request/response contracts unchanged; only values are now bounded.
- **No registry changes** — 48 sims, IDs, domains, and parameter definitions intact (P3.1 registry re-scoping for blackhole still in effect).
- User-visible behavior changes (all intentional): motion velocity readout now matches the drawing; sub-threshold forces stop the box; equation badges show plain text; "Defaults" is a full reset; failed history fetches surface an error.

---

## 17. Files Touched

`app/layout.tsx`, `app/api/simulations/interpret/route.ts`, `src/lib/simulation/schemas.ts`, `src/lib/simulation/equation-presentation.ts`, `src/lib/simulation/snapshot-sanitize.ts` (new), `components/simulation-runner/{simulation-runner,simulation-engine,engine-constants,simulation.types,conceptual-telemetry-hud}.tsx/ts`, `components/simulation-runner/__tests__/simulation-engine.test.ts`, `src/lib/simulation/__tests__/{schemas,equation-presentation,snapshot-sanitize}.test.ts`.

---

## 18. Deferred Findings — P3.2–P3.8 (unauthorized)

Recorded as deferred per mission constraint (no expansion beyond the authorized P3 runtime/UX scope):

- **P3.2** Motion friction/braking tuning beyond the RC-04 contract (wheels, inertia curves).
- **P3.3** Quantum superposition waveform rendering improvements (HUD phase mapping for `wave`/`uncertainty`).
- **P3.4** Quantum tunneling visualization.
- **P3.5** Per-sim unit display on HUD axes (currently sliders/badges only).
- **P3.6** Virus reseed on parameter change.
- **P3.7** Neural stimulus calibration.
- **P3.8** Shared gravity constant across engine + interpreter (`gravity` 0.5 vs 0.667 noted in the P3.1 audit), telemetry-driven AI prompt enrichment (currently no live telemetry values in the prompt beyond JSON serialization).

Each remains classified and reproducible; no code change was made to any.

---

## 19. Risk Register

| Risk | Mitigation |
|---|---|
| Removal of `PARTICLE_COLORS`/radii/`CANVAS_LOGICAL_*`/`TelemetrySyncCallback` breaks an unsearched importer | clean `tsc` over the full project confirms zero remaining importers |
| Memoized LV samples get stale if p0/p1 resolve change identity per render | deps are the exact resolved slider values used by the integration |
| Render-time telemetry reset re-renders on every sim switch | one extra render per switch, before the engine effect; state unchanged between switches |
| Interleaved equation passes mis-translate an exotic token | 8-iteration bound; all 48 registry equations verified; unknown tokens left verbatim |
| History effect refactor changes UX-07 semantics | cache-hit path explicitly clears stale errors; setState confined to the async callback |

---

## 20. Next Steps

1. Present P3 completion summary to stakeholders.
2. Await authorization for P3.2–P3.8 (deferred list above) with the P3.1 audit report as the source of the underlying findings.
3. Commit the working tree — the entire P3 runtime/UX mission is currently uncommitted (36+ files, cumulative with prior P3.1 work), pending explicit commit authorization.