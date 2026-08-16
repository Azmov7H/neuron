# Simulation System Architecture

**Purpose:** Canonical description of the simulation subsystem after P2 (Architecture & Contract Consolidation). Describes who owns what data, how contracts flow from the registry to every consumer, and what must change to add a simulation.

**Applies to:** `src/lib/simulation/` (authoritative model), `components/simulation-runner/` (runtime), `components/simulations/` (presentation), `app/api/simulations/*` (API), `src/lib/security/validation.ts` (API payloads).

---

## 1. Registry Responsibility

`src/lib/simulation/registry.types.ts` + `registry.ts` are the **single source of truth** for every simulation:

- **Domains:** `SCIENTIFIC_DOMAINS` (the only domain enumeration) at `registry.types.ts:12`; `ScientificDomain` derived from it; `DOMAIN_LABELS` + `DOMAIN_ORDER` in `registry.ts`.
- **Interaction classification:** `INTERACTIVE_SIM_IDS` — the only place that decides which sims are canvas-backed interactive labs (17) vs conceptual labs (31 non-interactive). `isInteractiveSim(id)` exposes the membership.
- **Simulations:** `SIMULATION_REGISTRY` map keyed `domain:id` (48 entries, 8 per domain), each `SimulationDefinition` carries `id, name, description, domain, equation, parameters[]`, injected via local `register()`/`param()`/`paramExt()` helpers.
- **Parameters:** `SimulationParameter` interface (declared once at `registry.types.ts:30`): `key, label, type ('number' | 'integer'), min, max, step, default, required, unit?, description?`. Types are inferred from the step (integer step ≥ 1 → `integer`).

The registry never contains UI presentation (no Tailwind classes, icons, or hex colors). It contains scientific identity + user-facing names only.

---

## 2. Client Projection

`toClientSimulation(def)` (`registry.ts:747`) produces `ClientSimulation` for UI consumption with **full parameter metadata** — key, label, type, min, max, step, default, required, unit, description are all projected; nothing is dropped.

`components/simulations/config-payload.ts` is the single API/client aggregation: `SimulationDomainConfig` wire type + `buildSimulationConfigPayload()` mapping every domain to `{ name, slug, color, glowColor, accentHex, accentStyle, sensors, simulations }`. It imports presentation tokens from `domain-presentation.ts` and `getSimulationsByDomain()` from the registry — the client's displayed catalog is therefore **derived**, never hardcoded.

`components/simulations/constants.ts` is a zero-literal re-export shim (`interactiveSimIds`, `DOMAIN_ORDER`, presentation constants) preserving the historical import surface.

---

## 3. Runtime Parameter Ownership

- **Registry** owns the canonical defaults, bounds, and step for every parameter.
- **UI config state** (`localParams` in `simulation-runner.tsx`) is the slider view — initialized from the projected registry defaults when a sim becomes active.
- **Engine state** is the runtime truth: parameters are pushed into the engine via `engine.updateParameter(key, value)`.
- **NL proposals** (`nlParamOverrideRef`) seed a *future* engine instantiation instead of registry defaults; the engine-creation effect consumes the override once.
- **Slider → engine flow:** slider changes are batched through `scheduleEngineParameterUpdate` → `pendingParamUpdatesRef` → one `requestAnimationFrame` flush (`flushPendingEngineUpdates`) to avoid bursty per-tick updates.
- **Reset:** rebuilds from registry defaults via the shared payload builder (canonical bounds re-applied by `checkParameterBounds`/`buildParameterSchema`).
- **History restore:** restored values are re-validated against registry bounds and **clamped** to the canonical max when out of range (proven by tests).
- **Sim switch:** `resolveSlug` + per-sim engine creation re-initialize parameter state from the current (possibly NL-overridden) defaults.

---

## 4. Engine

`components/simulation-runner/simulation-engine.ts` — `SimulationEngine` class, the only component that renders the 17 interactive sims. Physics runs on a delta-time model (`ENGINE_TIMESTEP_MS` 16.667ms nominal, clamped 8–50ms; see P1 report §2). Each interactive sim is registered by id; anything not in `INTERACTIVE_SIM_IDS` is rendered by `ConceptualTelemetryHUD` instead.

`simulation-state.ts` classifies the interactive ids into:
- **`dynamic`** (6): real measured state emitted in `stateSnapshot` (`motion, bacteria, virus, immune, probability, graph`).
- **`parameterized_visualization`** (11): `visualizationState.animationPhase` render clock only (`relativity, gravity, heart, neural, blood, functions, wave, uncertainty, orbit, blackhole, stellar`).
- **`conceptual`** (31 non-interactive; any unknown id): `visualizationState: 'conceptual'`.

Only `DYNAMIC_SIM_IDS` may be written literally; `SIMULATION_STATE_TYPES`, the parameterized set, and `getSimulationStateType()` are **derived** from registry `INTERACTIVE_SIM_IDS` so the two cannot drift.

---

## 5. Telemetry

`TelemetrySnapshot` (`simulation.types.ts`): `timeStep, simulationTime, stateType, stateSnapshot` (+ per-sim measured fields). The engine syncs telemetry at ~10 Hz to the runner; the runner renders it through the memoized `TelemetryReadoutBadge`, confining re-renders to the badge/canvas layer. The conceptual HUD runs its own rAF loop (cancelled while paused).

---

## 6. API Boundaries

- **`GET /api/simulations/config`** → derived from `buildSimulationConfigPayload()`; the client type is the same `SimulationDomainConfig` (proven identical by tests).
- **`POST /api/simulations/interpret`** (assessment) → schema-validated (`simulationId` + domain must be registered; unknown ids rejected), persisted to history.
- **`GET /api/simulations/history`** → history rows filtered/limited via `history-params.ts` (`buildHistoryQuery`, `parseHistoryLimit` 1–100, default 15).
- **`POST /api/simulations/natural-language`** → NL interpretation pipeline (see §9).
- **`app/api/simulations/anatomy/*`** → anatomy-specific endpoints (explain/systems/action), separate module.

All routes import the canonical registry/types; route.ts files contain no simulation literals.

---

## 7. Assessment Boundary

Client sends `{ simulationId, domain, parameters, stateSnapshot, stateType, simulationTime, userQuestion }`. The interpret route:
1. Validates shape via `SimulationRunCreateSchema` (`src/lib/security/validation.ts`) — `domain` against the Title-Case derived enum (`SCIENTIFIC_TITLE_CASE_DOMAINS`, for legacy persisted casing), `stateType` against the union, finite `simulationTime` 0–86400.
2. Rejects unknown simulation ids / domains with 400.
3. Feeds `stateType` + `simulationTime` into the assessment prompt so the interpreter never hallucinates measured values for render-only sims.
4. Persists a `SimulationRun` row.

Note: `SimulationRun.domain` is persisted as Title-Case for legacy backward compatibility; the canonical set is derived, not a second literal.

---

## 8. History Persistence

`SimulationHistory` DB model rows are read/written exclusively by the history route + `src/lib/simulation/history-params.ts`. No persisted field names were changed during P2. The `SimulationConfig` DB model (`src/database/models/simulation-config.ts`) remains unused (DEFER — needs migration analysis before removal).

---

## 9. NL Pipeline

`POST /api/simulations/natural-language` → `NaturalLanguageInterpreter` (`nl-interpreter.service.ts`) →
- `buildRegistrySystemPrompt()` — prompt derived **only** from the registry: every registered sim id + name listed, plus the domain rules, so the model cannot propose unregistered sims.
- Zod validation via `LlmInterpretationOutputSchema` (rejects unknown ids).
- `fallback-interpreter.ts` keyword matcher for keyless environments; `deterministic-fallback.ts` produces a keyless local proposal consistent with the registry.
- Result types: `NlReadyResult | NlNeedsInputResult | NlUnsupportedResult`, resolved with `resolveNlProposal`.

`DOMAIN_ENUM` (`schemas.ts`) = `z.enum(SCIENTIFIC_DOMAINS)` — the single trusted-domain narrowing for NL input and LLM output.

---

## 10. Styling Boundary

- **Registry/model layer** (`src/lib/simulation/`): zero styling — no Tailwind classes, icons, or colors.
- **Presentation layer** `components/simulations/domain-presentation.ts`: the single `DOMAIN_STYLES` map annotated `as const satisfies Record<ScientificDomain, DomainPresentation>` — TypeScript **proves at compile time** the key set equals the canonical domain enumeration. Holds Tailwind gradient classes (`bgGradient`), `accentHex` (kept as the wire color used by payload/UI), and icons.
- Consumers (runner `withIcons()`, `sim-categories`, `experimental-labs`, `continue-experimenting`) import from this one module; Tailwind/icon concerns never enter the scientific model.

---

## 11. Dependency Direction

```
registry.types.ts (SCIENTIFIC_DOMAINS, SimulationDefinition, SimulationParameter)
        │
        ▼
registry.ts (INTERACTIVE_SIM_IDS, DOMAIN_LABELS, SIMULATION_REGISTRY, toClientSimulation)
        │
        ├──► schemas.ts (DOMAIN_ENUM) ──► nl-interpreter.service.ts ──► app/api/simulations/natural-language
        ├──► simulation-state.ts (DYNAMIC_SIM_IDS literal, derived classification)
        ├──► history-params.ts ──► app/api/simulations/history
        └──► config-payload.ts ──► app/api/simulations/config
                                   │
                                   ▼
components/simulations/simulation-config-client.ts (typed client cache)
                                   │
                                   ▼
components/simulation-runner/simulation-runner.tsx ──► simulation-engine.ts
components/simulations/domain-presentation.ts (presentation, consumes registry exports only)
```

Rule: presentation and runtime **read** the registry; nothing writes simulation definitions outside `registry.ts`. The client never hardcodes any sim id, domain, or parameter. The registry never imports from React components (one exception: `config-payload.ts` imports presentation constants from `components/` — an intentional, documented server compartment crossing for wire tokens).

---

## 12. Adding a Simulation

To add an interactive simulation:
1. Register it in `src/lib/simulation/registry.ts` (domain, id, name, description, equation, parameters), 8-per-domain balance permitting.
2. Add its engine implementation in `simulation-runner/simulation-engine.ts`.
3. If it emits measured state, add it to `DYNAMIC_SIM_IDS` in `simulation-state.ts` (or the classification derives automatically as `parameterized_visualization`).
4. If it belongs to a domain without icons/labels, extend `SCIENTIFIC_DOMAINS` (types all follow) + `DOMAIN_LABELS` + `DOMAIN_STYLES` (the `satisfies Record<...>` assertion forces this).
5. Config API, NL prompt, history filtering, UI lists all pick it up automatically.

**Nothing else.** No client lists, no duplicate configs, no new constants — the contract tests (`src/lib/simulation/__tests__/contracts.test.ts`) fail if the registry and the derived client projection ever diverge.