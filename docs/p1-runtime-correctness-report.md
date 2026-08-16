# P1 — Runtime Correctness & Simulation State: Stabilization Report

**Scope:** S-03 delta-time physics, S-04 pause/render waste, S-07 simulation state contracts, S-13 verified per-frame rendering hotspots, plus the assessment payload contract, engine reset/timing compatibility, telemetry rendering isolation, and conceptual HUD runtime behavior.

**P0 baseline:** 66 tests, `tsc` clean, `pnpm build` clean, lint clean on touched paths (141 pre-existing errors repo-wide).
**P1 result:** 82 tests (16 new), `tsc` clean, `pnpm build` clean, lint clean on P1-touched paths (only pre-existing HEAD error remains — see Validation).

---

## 1. Changed Files

| File | Reason |
|---|---|
| `components/simulation-runner/simulation-types.ts` | Extended `TelemetrySnapshot` with `simulationTime` + `stateType`; added `SimulationStateType` union; extended `InteractiveSimulationConfig` payload fields. |
| `components/simulation-runner/simulation-state.ts` | **New.** S-07: single source of truth classifying every simulation id into `dynamic` / `parameterized_visualization` / `conceptual`. |
| `components/simulation-runner/engine-constants.ts` | Added `ENGINE_TIMESTEP_MS` (1/60 s nominal frame) and `ENGINE_TICKS_PER_SECOND` (engine time unit = 60Hz-equivalent ticks). |
| `components/simulation-runner/simulation-engine.ts` | S-03 delta-time timing model, S-04 pause/resume loop suspension, S-07 stateType + real snapshots (incl. graph metrics + parameterized visualizationState), S-13 caching (graph edges, bacterial colony raster, black hole gradient). |
| `components/simulation-runner/simulation-runner.tsx` | Pause/resume via engine `pause()`/`resume()` (S-04); assessment payload `stateType`/`simulationTime` + explicit non-empty conceptual snapshot (S-07 contract); telemetry init/reset with full snapshot shape; memoized `TelemetryReadoutBadge` (telemetry isolation); physical-time readout. |
| `components/simulation-runner/conceptual-telemetry-hud.tsx` | S-04: rAF loop now cancels when paused (no 60 FPS setState churn while frozen); resume restarts a single loop; phase preserved (the previous code accidentally rewound phase on every pause/resume toggle). |
| `src/lib/security/validation.ts` | `SimulationRunCreateSchema`/`UpdateSchema` accept validated `stateType` (enum) + `simulationTime` (finite, 0..86400) for the API payload contract. |
| `app/api/simulations/interpret/route.ts` | Destructures the new contract fields and feeds `State Type` / `Simulation Time` into the assessment prompt context. |
| `components/simulation-runner/__tests__/simulation-engine.test.ts` | +16 tests: timing equivalence/clamp/first-frame/reset, pause/resume lifecycle, state contracts for all 17 interactive sims. |

No DB model, auth, rate-limit, history cache, or registry schema changes (constraint respected). No new simulations, no runner split, no UI redesign.

---

## 2. Timing (S-03)

**Delta calculation.** Each frame: `rawDelta = previousTimestamp === null ? ENGINE_TIMESTEP_MS (16.667ms) : timestamp - previousTimestamp`; the physics step consumes `deltaTime = clamp(rawDelta, MIN_DELTA_TIME_MS=8, MAX_DELTA_TIME_MS=50) ms`; `simulationTime += deltaTime / 1000` (seconds). All existing per-frame physics constants are preserved as per-"1/60 s engine tick" rates and scaled by `dt = (deltaTime / 1000) * 60` — at steady 60 Hz, `dt = 1`, so behavior is bit-identical to P0 (verified by unchanged P0 physics assertions).

**Conversions:** position integration scaled by `dt`; rate accumulators by `dt` (virus `p.timer`, probability spawn accumulator replacing the raw `timeStep % 8` gate); exponential damping reshaped to `pow(bias, dt)` (immune steering `0.95`, graph damping `0.85`); stochastic rates capped (`min(1, trans * 0.04 * dt)`). The render master clock is now `t = simulationTime * ENGINE_TICKS_PER_SECOND` instead of `timeStep`, so axial/clock/heartbeat/wave visuals scale with physical time, not refresh rate.

**First frame / pause / resume timestamps:** `start()` and `resume()` both run with `previousTimestamp = null`, so the first frame consumes exactly one nominal 16.667 ms tick — a resume can never absorb paused wall-clock duration, and a fresh frame never sees an accidental giant delta. `pause()` cancels the rAF loop and drops the baseline; `resume()` schedules exactly one loop (`if (!animId)` guard → no duplicate loops). `advanceFrame(timestamp)` mirrors a single loop iteration for deterministic tests and no-ops while paused.

**Simulation time vs frame count:** `frameCount` (+ alias `timeStep`) counts executed physics frames; `simulationTime` is the physical clock in seconds; `deltaTime`, `renderTimestamp`, and `telemetrySyncTime` are separate fields. The HUD displays both `Frame N` (frame counter) and `t X.X s` (physical time from `simulationTime`).

---

## 3. State Contract (S-07)

All 17 interactive simulations classified through `simulation-state.ts` (any other id → `conceptual`):

- **`dynamic` = 6** — real measured state, mutated each physics step and emitted in `stateSnapshot`:
  `motion` (acceleration/velocity/friction), `bacteria` (population/growthRate), `virus` (S/I/R compartments, R₀), `immune` (pathogensRemaining/wbcUnits), `probability` (beadsSettled), `graph` (now emits live `nodeCount`/`averageSpeed` measured from the node database — previously it mutated state but emitted nothing).
- **`parameterized_visualization` = 11** — no measured science; the engine emits `{ visualizationState: { animationPhase } }` (the real render clock), and `stateType` tells assessment these are parameter-driven renders: `relativity, gravity, heart, neural, blood, functions, wave, uncertainty, orbit, blackhole, stellar`.
- **`conceptual` = 0 interactive (31 non-interactive labs)** — no canvas engine; the payload carries `{ visualizationState: 'conceptual' }`, never `{}`.

Assessment payload contract (client → `/api/simulations/interpret`): `{ simulationId, domain, parameters, stateSnapshot, stateType, simulationTime, userQuestion }`. Verified live (see Validation): all three classes accepted and persisted; invalid `stateType` rejected 400; `stateType` absent (legacy clients) still 200. Prompt context now receives the state type + simulation time so the interpreter never hallucinates measured values for renders.

---

## 4. Performance (S-13)

Verified per-frame hotspots, all fixed while preserving visual output:

| Hotspot | Before | After |
|---|---|---|
| Graph O(n²) edges | Re-hashed `sin(i·12.98 + j·78.2)·43758.54` for every pair every frame (30–50 nodes → up to 1225 hash computations/frame) | Edge set is deterministic in `(n, p)`; precomputed once (init + `nodesCount`/`connectionProbability` changes) into `graphEdges`; per frame only O(E) line paths over the live layout |
| Bacteria ellipse allocation | ~240 `ellipse()`+`arc()` patches per frame, positions recomputed each frame | Colony is a pure function of `floor(population)` + dish geometry → rasterized into an offscreen transparent canvas once **per population change**; per frame = one `drawImage` |
| Black hole gradient | `createRadialGradient` + 2×`addColorStop` every frame | Gradient cached, keyed by `mass` (the only varying input); rebuilt only on parameter change, dropped on destroy |
| Background grid | Already cached (`ensureBackground`) — no change needed | — |

Cache lifetimes are engine-scoped (`destroy()` clears colony/gradient/edges); caches invalidate on parameter/size change; transparent (alpha) offscreen canvas composites without altering the existing scene.

Telemetry isolation: the 10 Hz engine sync previously re-conciled the entire lab. The telemetry-driven floating readout is now the memoized `TelemetryReadoutBadge` (primitive props, stable strings), confining telemetry re-renders to the badge/canvas layer. The conceptual HUD was already `memo`ized; no global state library introduced anywhere.

Conceptual HUD runtime fixes: rAF loop cancels while paused (zero 60 FPS updates, no path rebuilds), resume restarts a single loop with a safe first-frame delta, phase accumulates from the frozen value (bug fix), and reset still rewinds to 0 via the loop-internal `resetTick` detection. Visual design untouched.

---

## 5. Tests

Before: **66** passing (7 files). After: **82** passing (7 files, +16 in `simulation-engine.test.ts`). All 9 original engine tests kept **unchanged** and still pass — proof of behavioral parity.

New coverage:
- **Delta-time:** 60 Hz vs 120 Hz equivalence of `simulationTime` (|diff| < 1e-5) and motion velocity; bacteria growth-rate parity; irregular frame deltas → stable clock; MIN/MAX clamping (1 ms → 8 ms floor, 3 s → 50 ms cap); first-frame normalization (exact 16.667 ms); zeroed startup fields + classification.
- **Pause:** physics/time/state/telemetry fully frozen while paused; zero frame advancement; resume continues at the frozen time (no paused-duration absorption) and schedules exactly one loop (double `resume()` no-op); `start()` idempotence; no scheduling while paused.
- **State contract:** all 17 interactive sims classified per the declared map; 6 dynamic sims emit non-empty, finite, JSON-round-trippable snapshots; 11 parameterized sims emit `visualizationState` with advancing `animationPhase`; graph exposes real `nodeCount`/`averageSpeed`; unknown id → `conceptual`.
- **Reset/timing compatibility:** full timing model cleared (`simulationTime=0`, `frameCount=0`, `deltaTime=0`, `previousTimestamp=null`, snapshot `{}`); reset→execution parity with a fresh engine (equal clock + state after first post-reset frame).

No pixel/FPS tests (lifecycle/update boundaries only), as required.

---

## 6. Validation

| Check | Result |
|---|---|
| `pnpm test` | **PASS** — 82/82 (7 files) |
| `npx tsc --noEmit` | **PASS** — clean |
| `pnpm build` | **PASS** — compiled, 84/84 static pages |
| `pnpm lint` | **PASS on touched paths** — the only finding in touched files is `src/lib/security/validation.ts:46` `): any`, which exists verbatim at HEAD (pre-existing, in a function untouched by P1; 141 repo errors unchanged) |

**Live runtime verification** (production server on :3001, AI keys blanked → deterministic engine, local Mongo):
- Dynamic (`motion`): payload with `stateType:"dynamic"`, `simulationTime:12.34`, real snapshot → **200**, persisted; history returned the row with the exact snapshot.
- Parameterized (`relativity`): `stateType:"parameterized_visualization"` + `visualizationState` snapshot → **200**, persisted.
- Conceptual (`pendulum`): `stateType:"conceptual"` + explicit `visualizationState:"conceptual"` → **200**, persisted.
- Invalid `stateType:"bogus"`, negative time → **400** (schema validation).
- Legacy payload without contract fields → **200**.
- Engine timing/rAF runtime behavior (60/120 Hz equivalence, pause/resume, reset) exercised deterministically through the jsdom-driven Vitest suite (no browser automation available in this environment); all test rows deleted afterward (0 remaining), server stopped.

---

## 7. Remaining Issues (not implemented — out of scope)

- **Registry source-of-truth consolidation:** interactive-id + state classification currently live in client modules (`components/simulations/constants.ts`, `simulation-state.ts`) while definitions live in `src/lib/simulation/registry.ts`; a single authoritative registry entry per sim (including `stateType`) would prevent drift.
- **Prompt hardening:** the interpret prompt's fallback wording still says "Dynamic state is fully active" in the absolute-fallback branch, which is wrong for parameterized/conceptual sims when AI keys are absent.
- **Accessibility:** canvas labs have no aria labels/descriptions; keyboard users cannot operate sliders-only flows.
- **History cache invalidation:** `historyCacheRef` is keyed by sim id and never invalidated after a new run, so a fresh assessment may be shadowed by the cached list.
- **Unknown-slug 404:** a non-existent `[slug]` silently falls back to the first simulation rather than returning a 404.
- **Runner decomposition:** the ~1,100-line `simulation-runner.tsx` remains unsplit (P2); deeper telemetry isolation beyond the badge memo requires it.
- **URL state:** sim selection/params are not reflected in the URL; deep links persist only via slug.
- **Conceptual visualization depth:** the 31 conceptual labs render a single parametric waveform; richer conceptual presentations are a product-level enhancement.

---

*File: `docs/p1-runtime-correctness-report.md`*