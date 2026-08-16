# NEURON — Complete Simulation Technical Assessment

**Date:** Aug 15, 2026 · **Method:** Full-repo traversal, 3 parallel deep audits, direct verification of critical claims. All claims cited `file:line`. **VERIFIED** = directly observed; **INFERRED** = reasoned from code without runtime probe. No files were modified.

> **Working-tree note (VERIFIED):** The repository has substantial **uncommitted** changes: deletion of `src/modules/simulations/**` (9 files), `src/modules/spark/chat-application.service.ts`, `src/modules/spark/spark.prompt.ts`, `src/lib/security/promptsafety.ts`; new untracked `src/lib/simulation/`, `components/simulation-runner/natural-language-input.tsx`, `app/api/simulations/natural-language/route.ts`, and `docs/ai-simulation-input-plan.md`. Zero dangling references to the deleted paths remain (grep `modules/simulations` = 0 hits). The current tree passes `tsc --noEmit` and a production `pnpm build`. The assessment below reflects this **current uncommitted state**.

---

## 1. REPOSITORY DISCOVERY

### Pages / routes
| Path | Role |
|---|---|
| `app/(platform)/dashboard/simulations/page.tsx` | Lab index (server component) |
| `app/(platform)/dashboard/simulations/[slug]/page.tsx` | Lab workspace shell (server component; `page.tsx:9-16` renders `<SimulationRunner slug={slug}/>`) |

### Lab / runner components — `components/simulation-runner/`
- `simulation-runner.tsx` — **1,035-line monolithic client component** — owns all Lab behavior
- `simulation-engine.ts` — 1,177-line canvas engine (2D, 17 simulators)
- `engine-constants.ts` — engine constants
- `conceptual-telemetry-hud.tsx` — SVG waveform for 31 conceptual sims
- `natural-language-input.tsx` — NL config input (new)
- `simulation.types.ts` — shared types
- `sim-controls.tsx`, `sim-header.tsx`, `spark-insight.tsx` — **dead code** (no importers; only definition sites exist)

### Hub components — `components/simulations/`
`constants.ts`, `simulation-config-client.ts`, `sim-categories.tsx`, `experimental-labs.tsx`, `continue-experimenting.tsx`, `simulations-hero.tsx`

### Simulation library — `src/lib/simulation/`
`registry.ts` (767 lines, canonical 48-sim catalog), `registry.types.ts`, `schemas.ts`, `nl-interpreter.service.ts`, `fallback-interpreter.ts`

### API routes — `app/api/simulations/`
| Route | Status (VERIFIED) | Consumers |
|---|---|---|
| `history/route.ts` (62L) | USED | `simulation-runner.tsx:396`, `continue-experimenting.tsx:44` |
| `interpret/route.ts` (1,115L) | USED | `simulation-runner.tsx:443` |
| `natural-language/route.ts` (33L) | USED | `natural-language-input.tsx:103` |
| `config/` | **EMPTY (0 files)** | `simulation-config-client.ts:21` → 404 |
| `anatomy/action/`, `anatomy/explain/`, `anatomy/systems/` | **EMPTY stubs** | none |

`glob app/api/simulations/**/*` returns exactly the 3 `route.ts` files.

### DB models — `src/database/models/`
`simulation-run.ts` (used by history + interpret), `simulation-history.ts` (used **only** by `src/modules/cognitive-engine/cognitive-profile.service.ts:319`), `simulation-config.ts` (**orphaned**, imported nowhere), `spark-session.ts`.

### AI integration
`app/api/spark/{chat,context,history,sessions}/route.ts`; `src/modules/spark/*` (9 files, alive); `src/modules/spark-ai/spark-ai.service.ts` (backward-compat stub returning a canned mock, `:29`); `src/lib/ai/` (`llm.ts` is an unintegrated placeholder: `generateCompletion` returns `'Placeholder AI response'` at `:74`, `generateEmbedding` zeros at `:83`; providers under `src/lib/ai/providers/`).

### Other
- **Tests:** zero test files, zero test frameworks, no `test` script (`package.json:5-10`). Docs confirm: `docs/ai-simulation-input-plan.md:701-703`.
- **State:** no zustand store for simulations (only `components/matrix/matrix-store.ts:2`, unrelated); plain `useState`/`useRef` in the runner.
- **Server actions:** none for simulations (only `app/actions/auth.ts:1`).
- **Docs:** `docs/ai-simulation-input-plan.md` (untracked, 863 lines) — design doc for the implemented NL feature; stale on at least one point (describes a hardcoded `LOCAL_FALLBACK_CONFIG` at `:38` that has since been replaced by a registry-derived builder).

---

## 2. CURRENT ARCHITECTURE

```
User
 ↓  /dashboard/simulations/[slug]  (server page, no data logic — page.tsx:9-16)
 ↓  <SimulationRunner slug>        (client monolith, simulation-runner.tsx)
 ↓  Selection sidebar → activeDomain + activeSimId (runner :902-956)
 ↓  Engine-creation effect (:304-378)
 ↓  SimulationEngine (canvas, 17 sims)  OR  ConceptualTelemetryHUD (SVG, 31 sims)
 ↓  updatePhysics (6 cases) / draw (17 cases)
 ↓  stateSnapshot → onStateSync throttled 100ms → telemetrySnap state (:134, engine :244-251)
 ↓  HUD readout overlay (runner :583-608)
 ↓  Assessment: POST /api/simulations/interpret (:443)
 ↓    → OpenRouter stream OR generateLocalSimulationFallback (route :863-865, :16-817)
 ↓    → SSE tokens → aiStreamText (:458-485); [METADATA_EVENT] → aiResult (:469-482)
 ↓    → SimulationRun.create persist (route :924-932)
 ↓  History: GET /api/simulations/history → historyRuns → loadHistoryItem (:386-414, :499-513)
```

**Layer responsibilities, files, coupling, problems:**

- **Server page shell** — responsibility: render the runner. Coupling: none (no registry lookup, no data). Problem: unknown slugs are **not** 404 — resolution is client-side with graceful fallback to `physics/relativity` (runner `:216-264`; no `notFound()`/`generateStaticParams` anywhere — grep = 0 hits).
- **Runner** — responsibility: everything else (selection, config, run/pause/reset, drawers, history, assessment, canvas lifecycle). Coupling: imports duplicate client `constants.ts` (`:11`) instead of registry; fetches a non-existent config API (`:207`). Problem: 1,035-line component re-rendered wholesale at ≤10 Hz from telemetry.
- **Engine** — responsibility: simulation math, drawing, telemetry emission, param store. Coupling: deliberately decoupled (engine `:1-6`). Problems: frame-count integration (not wall-clock delta); only 6 of 17 sims have `updatePhysics`; `stateSnapshot` empty for the other 11; continues `draw()` + telemetry emission while "paused".
- **HUD** — responsibility: instantaneous state readout. Feeds on throttled engine snapshot. Problem: `timeStep` is a frame counter, not a time unit — "Frame N" shown without explanation; first emit arrives ~100 ms after mount (engine `:245` `0 - 0 > 100` is false).
- **Assessment layer** — responsibility: structured educational interpretation + persistence. Problem: heavyweight (1,115-line route), unbounded cost surface (no rate limit), and a **fabricating fallback** (see §13, §19).
- **Config layer** — responsibility: deliver domain configuration. Problem: `/api/simulations/config` doesn't exist; every consumer 404s and the DB `SimulationConfig` model is orphaned.

---

## 3. SIMULATION LAB ASSESSMENT

**Coherent core flow (VERIFIED):** entering → sidebar selection → sliders → run/pause → canvas/HUD → AI drawer assessment → history modal. The *core* interactive loop works and is the best-built part of the system.

**Broken / inconsistent transitions:**

1. **Hub components permanently lie.** `ExperimentalLabs` shows pulse skeletons *forever* (config fetch resolves `null`; `experimental-labs.tsx:24` early-returns); `SimCategories` shows "Loading domain configurations…" forever (`sim-categories.tsx:24,60`); `ContinueExperimenting` shows raw `simulationId` instead of names (`continue-experimenting.tsx:52-57,123`). Root cause: missing `/api/simulations/config` + catch-to-null client (`simulation-config-client.ts:36-40`). **VERIFIED.**
2. **Reset inconsistency.** Interactive reset: only `engine.resetTime()` — sliders are *not* restored (`runner:642`). Conceptual reset: rewind + `handleResetParams` (`:646-647`). Same button, different semantics. **VERIFIED.**
3. **History restore can be invisible.** If the AI drawer is in Natural-Language mode, `loadHistoryItem` opens the drawer but the restored content only renders under `nlMode === 'traditional'` (`:766`). **VERIFIED** from render gating.
4. **History restore doesn't reset simulation time** (`:499-513`) — the sim resumes mid-run with old params applied.
5. **Reset leaves AI content on screen** — toolbar reset never clears `aiResult`/`aiStreamText` (only sim-switch clears it, `:338-340,365-369`).
6. **Assessment of conceptual/unsupported sims** — `stateSnapshot` is `{}` for conceptual sims (no engine, `runner:439`) and for 11 interactive sims (no physics case) — the AI is asked to interpret empty state (server falls back to generic defaults, route `:912`).
7. **Error recovery:** assessment failure shows a proper labeled error with retry (good, `:486-492`); but there is **no error boundary** on the runner; unknown slug silently loads a different experiment (relativity).
8. **Responsive:** desktop-first; drawers fixed `w-60`/`w-80` (`:726,:872`); sliders `grid-cols-1 md:grid-cols-2` (`:693`); the left sidebar closes on selection so mobile is *usable* but no dedicated mobile rail.
9. **Loading gate:** entire workspace blocks behind "Loading laboratories scope…" until config resolves (`:543-550`) — acceptable, but tied to the failing fetch.

**UX verdict:** the hero path (pick → configure → run → assess → history) is coherent; the periphery (hub cards, dead header/controls components, inconsistent reset, invisible restore) degrades it measurably.

---

## 4. SIMULATION ENGINE ASSESSMENT

**Architecture:** one `SimulationEngine` class (`simulation-engine.ts`) with a constructor-copied param map, a single rAF loop, a `switch(this.simId)` for physics and drawing, and one callback (`onStateSync`).

**Execution loop (VERIFIED, `:233-254`):**
```ts
private tick = (timestamp: number) => {
  if (this.isRunning) {
    this.timeStep++;
    this.updatePhysics();
  }
  this.draw();                                  // runs even when paused
  if (timestamp - this.lastSyncTime > TELEMETRY_SYNC_INTERVAL_MS) {
    this.onStateSync({ timeStep: this.timeStep, stateSnapshot: { ...this.stateSnapshot } });
    this.lastSyncTime = timestamp;
  }                                             // sync runs even when paused
  this.animId = requestAnimationFrame(this.tick);
}
```

**Timestep handling — frame-count, not delta-time (VERIFIED):** physics advances once per rAF call; integrals use frame-count coefficients: `boxVel += acc * 0.03` (`:270`), `currentPop + growthConstant * 0.05 * …` (`:296`), `p.timer++` (`:327`), wrap-animations `(t/60) % pulsePeriod` (`:763`), `theta = t * …` (`:670,:1043`). **`MIN_DELTA_TIME_MS`/`MAX_DELTA_TIME_MS` exist but are never imported** (`engine-constants.ts:36-39`; grep = definitions only). → On a 120 Hz display every sim runs ~2× faster than on 60 Hz.

**Physics coverage (VERIFIED):** `updatePhysics()` has **6 cases** — `motion, bacteria, virus, immune, probability, graph`. The other 11 interactive sims are **draw-only animations advanced by `timeStep`**. `graph`'s edges are a cosmetic hash, not the network: `seedVal = Math.sin(i * 12.98 + j * 78.2) * 43758.54…` (`:946-947`).

**Stochastic initialization (VERIFIED):** `Math.random()` at `:183-186, 192-195, 205-208, 223-224, 336, 419, 446` — every re-run of `immune/virus/probability/graph` differs; recorded `R0`, `beadsSettled`, `pathogensRemaining` are run-to-run noise.

**Reset (VERIFIED, `:142-148`):** `resetTime()` zeroes `timeStep/boxX/boxVel/axonProgress` and re-inits **only `immune, virus, probability, graph`**. For `bacteria` the population lives in `stateSnapshot.population` (`:295`) and is **not** reset — reset does not restore bacteria's initial conditions. `stop()` exists (`:134-140`) and is **never called** — pause is `engine.isRunning = false` only, leaving `draw()` and telemetry running.

**Race conditions / leaks:** pending-param batch is now cleared even when no engine exists (runner `:167-192`, comment `:169-173`); engine-creation effect cancels stale RAF/batch (`:310-314`); `destroy()` cancels rAF (`engine :150-155`) and is called on switch + unmount. **No leak found.** Background canvas is pre-rendered and blitted (`:525-528`) — good design.

**Hardcoded values / hidden assumptions:** per-sim physics constants inline in switch cases; difficulty heuristic for persisted metadata derives from `parameters.speed/energyLevel/initialMass` (route `:21-26`) — separate from registry defaults; `draw()` default case (§5) is unreachable.

---

## 5. SIMULATION DOMAIN MATRIX

Registry data (VERIFIED): **48 sims, 8 per domain × 6 domains** (`registry.ts`, `DOMAIN_ORDER :49-51`). **17 interactive** = `INTERACTIVE_SIM_IDS` (`registry.ts:15-22` **and** `constants.ts:5-12`, identical, duplicated); **31 conceptual**. Every parameter is `required=true` in practice (`param()` defaults, `registry.ts:64-75`).

| Domain | Interactive sims (canvas) | Conceptual sims (SVG HUD) | Engine physics | Assessment data |
|---|---|---|---|---|
| physics | relativity, motion, gravity, wave (4) | pendulum, thermodynamics, optics, wave_interference, electrostatics (5) | motion only | 3/4 interactive have `{}` snapshot |
| biology | bacteria, virus, immune (3) | genetics, photosynthesis, enzymes, osmosis, ecosystem (5) | bacteria, virus, immune | OK for the 3 interactive |
| anatomy | heart, neural, blood (3) | nephron, pulmonary, muscle, endocrine, bone (5) | none | 3/3 interactive have `{}` snapshot |
| mathematics | functions, probability, graph (3) | chaos, fractal, fourier, calculus, fibonacci (5) | probability, graph | 1/3 interactive has `{}` snapshot |
| quantum | uncertainty (1) | wave, tunneling, spin, entanglement, hydrogen, harmonic, superposition (7) | none | 1/1 interactive has `{}` snapshot |
| space | orbit, blackhole, stellar (3) | cosmology, nebula, tides, magnetosphere, pulsar (5) | none | 3/3 interactive have `{}` snapshot |

**Engine draw coverage:** all 17 interactive sims have explicit `case` branches (`:532-1105`). The `draw()` **default case** (`:1107-1169`, lissajous wave "for 31 new simulations") is **unreachable — dead code** (canvas engine only created for `!isConceptual`, runner `:335`).

**Classification:**
- **ACTIVE:** motion, bacteria, virus, immune, probability, graph (have physics + real snapshot), plus 11 draw-only sims (visuals work, no state).
- **PARTIALLY_IMPLEMENTED:** the 11 draw-only interactive sims (no `updatePhysics`, `{}` snapshot → generic AI output); all 31 conceptual sims (single generic waveform regardless of experiment, HUD `:85-98`).
- **BROKEN:** hub features (§3.1); interactive reset for `bacteria`; history-restore in NL mode.
- **UNUSED:** `SimulationConfig` model (`simulation-config.ts` — 0 importers); `SimulationHistory` model outside cognitive-profile; `isInteractiveSim` in `registry.ts` (grep = 0 consumers; the runner uses the `constants.ts` copy); `stop()`; draw default case; `DOMAIN_ICONS_MAP` (engine-constants `:116-123`); `llm.ts`; `spark-ai.service.ts` mock.
- **OBSOLETE:** deleted `src/modules/simulations/**` (no references, source of the registry/engine split).
- **DUPLICATED:** `INTERACTIVE_SIM_IDS`/`isInteractiveSim`/`DOMAIN_ORDER` (2 copies), `DOMAIN_STYLES` (2 copies with **different shapes and values**: SciOS tokens vs `text-blue-400` — `constants.ts:25-32` vs `registry.ts:40-47`), `ScientificDomain` (2 files), param-spec types (3 shapes), domain icon maps (2).

---

## 6. DATA FLOW & CONTRACTS

**Registry → client projection is lossy (VERIFIED):** `SimulationParameter {key,label,description?,unit?,type,min,max,step,default,required}` (`registry.types.ts:11-22`) → `toClientSimulation` keeps only `{key,label,min,max,step}` (`registry.ts:759-765`) — **units, descriptions, types, required flags never reach the UI**. Sliders have no units (also because the API-driven config that would supply them doesn't exist).

**Frontend/backend mismatch at the config boundary (VERIFIED):** `fetchSimulationConfig`'s `SimulationDomainConfig` type (`simulation-config-client.ts:1-14`: `domainKey`, no `glowClass`) mismatches the runner's interface (`runner:75-82`: `icon?`, `colorClass`, `glowClass`, no `domainKey`); cast at `runner:211`. `glowClass`/`colorClass` are assigned (`:49-50`) but **never read**. If the API ever returns real data, this breaks silently.

**Interpret contract mismatch (VERIFIED):** server `parsedInterpretation` includes `metadata` (route `:915-921`, delivered via `[METADATA_EVENT]` `:935-943`); client `aiResult` type omits `metadata` (`runner:89-94`) — extra field silently ignored. History restore path works because `item.aiInterpretation` carries the full stored object (`:506`).

**Results persistence contract (VERIFIED):** parameters/stateSnapshot stored as **`Map of Mixed`** (`simulation-run.ts:51-62`) — no server-side schema beyond the one Zod check on `/interpret`. The same values are re-sent on sliders (`runner:502` `Object.entries`).

**Source of truth inventory (VERIFIED):**
| Data | Source of truth | Duplicated |
|---|---|---|
| Sim catalog / params | `src/lib/simulation/registry.ts` | `components/simulations/constants.ts` reduplicates ids+domains+styles |
| Interactive flag | `components/simulations/constants.ts` (runner path) | registry copy unused |
| Domain visuals | 3 places (`constants.ts`, `registry.ts`, `runner:32-39` + engine-constants `:116-123`) | 4-ish |
| Param values at runtime | `engine.parameters` (engine) vs `localParams` (React) | diverging — on reset interactive sliders ≠ engine |
| Experiment config | `/api/simulations/config` (doesn't exist) → `LOCAL_FALLBACK_CONFIG` | DB model exists, orphaned |
| History | `SimulationRun` (Mongo) | `SimulationHistory` model partly duplicates user-level aggregates |
| Physics | per-case constants in `simulation-engine.ts` | — |

---

## 7. STATE MANAGEMENT

**Inventory (runner, VERIFIED):** 18 `useState` (`:102-137`), 5 `useRef` (`:110-150`), 6 `useEffect` (`:194-414`), 1 memo (`:157-163`).

**Lifecycle representation (VERIFIED):**
| State | Represented | How | Correct? |
|---|---|---|---|
| configuring | `isLoadingConfig` (`:103`) | config-gate | Partial — also blocks interactive canvas, gate reads a failing fetch |
| ready | no explicit | derived (`activeSim`) | implicit |
| running | `isRunning` (`:113`) | effect → `engine.isRunning` (`:380-384`) | Yes, but see pause problem |
| paused | same `isRunning=false` | — | **No** — engine still `draw()`s and emits; HUD re-renders at 10 Hz while paused (§13) |
| completed | none | — | Not modeled (sims are endless loops — arguably fine for a "lab") |
| reset | none | fire-and-forget `resetTime()` (`:639-654`) | **No** — sliders keep stale values (interactive), bacteria not reset, AI drawer not cleared |

**Problems found (VERIFIED):**
- **`telemetrySnap` is engine-derived state stored in React state**, re-rendering the entire monolith at up to 10 Hz — including while paused.
- **Duplicated param truth:** `localParams` (sliders) vs `engine.parameters` (engine). They re-sync on history restore (`:500-505`) and on NL apply, but **diverge on interactive reset**.
- **Stale flash on mode switch:** `telemetrySnap` is hidden for conceptual (`:601` frame hidden), but on conceptual→interactive the stale `{timeStep:0}`-ish value flashes ≤100 ms until first emit (engine `:245`).
- **`historyCacheRef` never invalidated** (`:141`) — switching back to a sim shows an old cached history without revalidation.
- **No URL state:** params, domain, and sim are not in the URL (grep `useSearchParams|useRouter` in sim dirs = 0) — hard refresh loses experiment state; no shareable experiments.

---

## 8. UI / UX AUDIT

**Information architecture:** the workspace correctly tells you *where you are* (slug → active sim name/equation in HUD), *what you control* (sliders), *what's happening* (HUD + canvas), and *what to do next* (assessment drawer CTA). Weak spots: hub pages show loading skeletons forever (§3.1); "Frame N" mislabels a frame counter; no completion semantics.

**Controls (VERIFIED):**
- Sliders: consistent styling, labeled with param key; **no units, no `<label>`/`aria-*` connection** (`:702-710`, NL component `:68-76`).
- Icon-only buttons without `aria-label`: drawer close X (`:886-891`, `:734-739`), send (`:845-851`), "Defaults" (`:686-691`), History (`:967-976`).
- `sim-header.tsx` volume/sparkles buttons: **inert (no onClick)** — but it's dead code anyway.
- Reset button inconsistency (§3.2); run/pause button works; no visual "disabled" states (guarded, not disabled).
- `userQuestion` text input has **no client maxLength** while the server rejects >500 chars → whole assessment 400s (validation `:23`; input `runner:837-843`).

**Visual system:** consistent shadcn/Radix + Tailwind tokens, dark-first, tw-animate-css; HUD overlays match the lab aesthetic; domain colors duplicated across systems but visually consistent since runner uses `DOMAIN_ICON_MAP` (runner `:32-39`).

**Accessibility (VERIFIED red flags):** canvas has no `aria-label`/fallback text and no keyboard alternative; sliders unlabeled; several icon buttons unlabeled (above); `prefers-reduced-motion` kills **CSS** animations only (`globals.css:486-494`) — the **rAF canvas loop and HUD phase loop ignore it** (no `matchMedia` anywhere in runner/engine/HUD; hero neural canvas runs regardless, `simulations-hero.tsx:11-96`). Positive: error uses `role="alert"` (`:785`), HUD SVG has `role="img"`+`aria-label` (HUD `:126-127`), history modal close labeled (`:997`).

**Responsive:** functional on mobile (sidebar closes on select; drawers fixed-width overlay), but drawers consume the full viewport on small screens; HUD overlay + canvas scale via `clientWidth`/`clientHeight` (engine `:513`) so canvas adapts.

---

## 9. VISUALIZATION ASSESSMENT

- **Interactive:** authoritative for the 6 physics sims (draw reads `stateSnapshot`), **illustrative/animated only for 11 draw-only sims** (no data backing the visuals beyond parameters + frame counter), cosmetic for `graph`.
- **Conceptual:** a single generic waveform whose shape comes from the first two *slider params* (HUD `:85-98`) — **one visualization for 31 distinct experiments**; equation text overlaid, but no per-sim model.
- **No axes/legends/units** on any canvas visualization; scaling is logical-pixel fixed (`CANVAS_LOGICAL_WIDTH`).
- **Lifecycle:** engine `draw()` every rAF; HUD `setPhase` at 60 fps (React state) with a ~191-iteration path rebuild per frame (HUD `:103-106`), memoized subtree.
- **Reset:** `resetTime()` resets positions for some sims; visualization state partially stale (`bacteria`).
- **Performance:** `graph` `O(n²/2)` lines (`:944-955`); `bacteria` up to `nutrient*40` ≈ 400 ellipses/frame (`:695-704`); `blackhole` per-frame `createRadialGradient` (`:1062`); background pre-rendered (good).

---

## 10. RESULTS SYSTEM

- **Calculations:** server-side (AI provider or the deterministic `generateLocalSimulationFallback`).
- **Storage:** `SimulationRun` docs; `aiInterpretation` per run.
- **Reach UI:** SSE → `aiStreamText` (raw, progressively) + `[METADATA_EVENT]` → `aiResult` (structured) (`runner:458-485`).
- **Authoritative? No.** Request payload = `{...eng.parameters}` and `{...eng.stateSnapshot}` (runner `:438-439`): empty `{}` snapshot for 11 interactive + all conceptual sims → the AI interprets nothing in those cases (server defaults: "Parameters calibrated correctly." route `:912`).
- **Stale results:** reset doesn't clear them (§3.5); sim switch does.
- **Duplicated calculations:** the fallback generator re-implements 48 sims' worth of deterministic scientific text server-side, *separate* from the registry and the engine — a third model of the simulation domain.
- **Mismatch:** history restore re-renders raw `[EXPLANATION]`-style markup into `aiStreamText` (`:507-509`, `:796-800`) — inconsistent presentation vs live streaming.

---

## 11. FRONTEND ARCHITECTURE

- **Monolith runner** (1,035 lines) owns selection, config fetch, engine lifecycle, drawers, history, streaming parse. Excessive but functional; **no memoized subcomponents** — every telemetry tick re-renders 48 sidebar buttons + all sliders.
- **Dead components:** `SimControls`/`SimHeader`/`SparkInsight` (no importers; `SimControls` "Reset Defaults" has no handler, `sim-controls.tsx:57`).
- **Duplicated clients:** `simulation-config-client.ts` parallel-copies fetch+cache logic; `nl-interpreter` parallel-copies params from the registry server-side.
- **Boundary hygiene:** single `"use server"` file in the app (auth); simulations are API-route-only. Client uses credentialed cookies (good, `runner:437`).
- **Type duplication:** `SubSimulation` (runner `:60-73`) is a third hand-written param contract; `ScientificDomain` twice; `SimulationParameterSpec` nearly-identical to `SimulationParameter` (`registry.types.ts:39-50`).

---

## 12. BACKEND / API / DATABASE

| Endpoint | Auth/CSRF | Rate limit | Validation | Status |
|---|---|---|---|---|
| `POST /simulations/interpret` | JWT + CSRF (double) | **NONE** | Zod (params ±1000, snapshot `z.any` record) | Used; costly AI surface |
| `GET /simulations/history` | JWT | **NONE** | **`limit` unbounded** (`parseInt` pass-through, `history/route.ts:22`); unvalidated strings | Used; ETag/304 built but **no client sends `If-None-Match`** → dead caching |
| `POST /simulations/natural-language` | JWT + CSRF | 100/min (`:32`; dev-bypassed — middleware `:146`) | Zod (text ≤500) | Used |
| `GET /simulations/config` | — | — | — | **404** (empty dir) |
| `anatomy/*` | — | — | — | Empty stubs |

- **Ownership:** history scoped by `userId` (`history/route.ts:25-27`); spark sessions check ownership (spark service 403s) — good.
- **DB:** `connection.ts` singleton promise-cache + 5-retry exponential backoff; `maxPoolSize`; no auto-reconnect beyond Mongo internal retry (acceptable).
- **Models:** simulation-run used; simulation-history for gamification only; simulation-config orphaned. No central model index (models register via import side effects) — works, but implicit.
- **Error handling:** `withErrorHandling` + `ApiResponseHandler` consistent patterns; SSE close guarded.
- **No server actions for simulations** — consistent API-route strategy.

**Backend verdict:** three working endpoints with decent validation/auth; two of them unprotected by rate limiting; one route is a 404 that the UI treats as "everything works"; one whole model orphaned.

---

## 13. AI INTEGRATION

**Provider layer (VERIFIED):** `LLMProviderFactory` → default `openrouter` (`provider.factory.ts:15-25`); `OpenRouterProvider` streaming (`openrouter.provider.ts`); model `google/gemma-4-26b-a4b-it:free` (`env.ts:48`); temperature 0.5 for interpret, 0.7 default; keys server-only, startup guard if `ENABLE_SPARK_AI` without key (`env.ts:96-98`).

**Simulation assessment pipeline (VERIFIED):** one 1,115-line route doing auth → Zod → prompt build (inline, `route:990-1036`) → stream with 6 s AbortController (`:984-988`) → section parser ± `[METADATA_EVENT]` → persist `SimulationRun` → close.

**The fabrication problem (VERIFIED — the single most important finding):** `generateLocalSimulationFallback` (`route:16-817`) is a deterministic, per-48-sim text generator that triggers on **no API key** (`:977-981`), **6 s timeout** (`:987`), or **any provider error** (`:953,:1101`). It:
- streams word-by-word with fake 15 ms pacing (`:960-967`) to mimic AI streaming;
- puts `"aiModel": "gemma-4-26b-a4b-it"` in its METADATA (`:814`) — indistinguishable from a real model call;
- **persists these fabricated "assessments" to `SimulationRun`** (`:924-932`) with the same metadata stamp (`:919`), including the "absolute fallback" (`:969-975`).

Thus in any environment without a working OpenRouter key, **every assessment a user sees and every history item recorded is generated locally and labeled as AI output**. This is a truthfulness/production-readiness problem (not a code-crash problem). Note the *client* catch block does **not** fabricate anything — it shows a proper error state (`runner:486-492`); the previous "Local telemetry calibrated/60 FPS" fabrication was removed and the exact phrase exists nowhere in code.

**Prompt injection surface (VERIFIED/INFERRED):** `stateSnapshot` (zod-validated as `z.record(z.string(), z.any())`, `validation.ts:24`) is interpolated raw into the prompt (`route:997`); `userQuestion` only strips `<>` (`:862`). The deleted `promptsafety.ts` delimiter-wrapping defense has no replacement. The NL route, by contrast, has a **strong structured pipeline**: schema parse → registry-ID whitelist → per-sim schema → bounds clamp → required-check (`nl-interpreter.service.ts:194-278`) — untrusted output never reaches the engine directly.

**Ready for future AI features?** Partially: provider abstraction + streaming + structured output + whitelist validation are solid foundations; but the fabricating fallback, missing rate limits, empty-snapshot assessments, and weak prompt-injection defense would undermine any new AI feature built on the same skeleton.

---

## 14. PERFORMANCE

| # | Issue | Severity | Evidence |
|---|---|---|---|
| 1 | **Whole-runner re-render at ≤10 Hz, including while paused** | **High** | `setTelemetrySnap` from engine `:244-251` (sync outside `isRunning` guard); runner re-renders 1,035-line tree (48 sidebar buttons, sliders) with no memoization |
| 2 | **Engine keeps `draw()`ing while paused** | Medium | engine `:242` |
| 3 | HUD setState every rAF ⇒ HUD subtree re-render ~60 fps + 191-pt path rebuild | Medium | HUD `:71`, `:103-106` (memoized, contained) |
| 4 | `graph` O(n²) lines/frame; `bacteria` ~400 ellipses/frame; blackhole per-frame gradient allocation | Low-Med | engine `:944-955, :695-704, :1062` |
| 5 | Assessment streaming re-renders per SSE chunk | Low | acceptable; network-throttled |
| 6 | Config fetch 404 each mount (cached promise) | Low | `simulation-config-client.ts:21-40` |
| 7 | Unbounded `limit` on history API | Low-Med (backend) | `history/route.ts:22` |

No gross leaks; no unbounded arrays; good pre-rendered background. The realistic user impact is GPU/CPU burn on low-end devices and jank during telemetry-driven renders.

---

## 15. SECURITY

**Solid:** JWT middleware auth (header + cookie), double CSRF (edge middleware + route wrapper) with httpOnly cookie and a fetch-monkey-patch provider (`components/security/csrf-fetch-provider.tsx`, mounted `layout.tsx:96`), user-scoped queries, server-side-only secrets, zod bounds on params (±1000), rate limiting exists as a reusable mechanism (100/min) — but:

1. **No rate limiting on `/interpret`** (authenticated users can burn AI provider quota/CPU) — HIGH.
2. **`stateSnapshot` is `z.any` content interpolated raw into the AI prompt** — indirect prompt-injection vector (mitigated only by `<`/`>` stripping on userQuestion; `promptsafety.ts` deleted, no replacement) — MEDIUM.
3. **History `limit` unbounded** (`limit=1e9` passes to `.limit()`) — LOW/MED (authenticated, no data leak; resource only).
4. **Fabricated AI output persisted with false model attribution** — not a security vulnerability, but a trust/integrity risk (users can't distinguish real analysis) — integrity concern.

No injection risk into DB (Mongoose + typed/sanitized input); no sensitive data exposed client-side (no `NEXT_PUBLIC` keys).

---

## 16. CODE QUALITY & TECHNICAL DEBT

- **Dead code (VERIFIED):** `SimControls`, `SimHeader`, `SparkInsight`; engine `stop()`; draw default case (`:1107-1169`); `DOMAIN_ICONS_MAP`; `registry.isInteractiveSim` (unused copy); `SimulationConfig` model; `SimulationHistory` (outside cognitive-profile); ETag/304 server path (no client uses `If-None-Match`); `llm.ts` template; `spark-ai.service.ts` canned mock.
- **Duplication (VERIFIED):** interactive ids + domain styles + order in 2 modules (styles disagree in shape/values); `ScientificDomain` in 2 type files; param contracts in 3 shapes with lossy projection; icon maps in 2 places (one unused).
- **Quality signals (VERIFIED):** **zero** TODO/FIXME/HACK, `@ts-ignore`, `@ts-expect-error`, or `: any` in all audited simulation code; `tsconfig` strict; **but** `tsconfig.check.json:31` excludes `src/backend, src/components, src/domains, src/engine, src/hooks`, `src/types/simulation*.ts` from type-checking.
- **Error handling:** inconsistent — interpret/fallback catches broadly; history/visualization paths are silent (`catch {}` at `runner:477`, silently swallowing parse failures).
- **Docs drift:** `docs/ai-simulation-input-plan.md:38` describes a hardcoded fallback config that no longer exists.
- **Monolith:** runner + interpret route as mega-files (1,035 / 1,115 lines) — maintainability ceiling.

---

## 17. TESTING & RELIABILITY

**Zero tests. Zero framework. No `test` script** (VERIFIED, §1). `scripts/test-governance.ts` is a manual integrational script, not a unit test.

**Critical untested paths:** engine physics correctness; frame-rate dependence; param→engine flush; pause/resume; reset semantics (bacteria); SSE parse (`[METADATA_EVENT]`); fallback fabrication behavior; NL pipeline (whitelist, bounds clamp); history ownership; CSRF double-enforcement; rate limiting.

**Minimum bar for production-readiness:** a test runner (Vitest) + (1) engine determinism/frame tests, (2) registry/param contract tests, (3) NL interpreter tests, (4) interpret section-parser + fallback flagging tests, (5) history route validation tests. Playwright E2E for one interactive + one conceptual happy path.

---

## 18. PRODUCTION READINESS

| Category | Score | Reasoning |
|---|---|---|
| Correctness | **2** | 6/17 interactive sims compute anything; frame-rate-dependent timing; bacteria reset wrong; fabricated fallback labeled as AI |
| Stability | **2** | No crashes found; but 10 Hz full-tree re-render + unbounded limit + SSE parsing raced with timeouts are fragility points |
| Maintainability | **2** | Monoliths, 3-way duplication of core contracts, dead code, orphaned models |
| Performance | **2** | Pause runs full-draw loop; paused re-renders; per-frame allocations; O(n²) |
| Security | **3** | Good auth/CSRF/bounds; missing rate limits + prompt-interpolation hole |
| Accessibility | **1** | Unlabeled interactive controls, canvas without fallback, reduced-motion ignored for rAF loops, unknown-slug silent fallback |
| Responsiveness | **2** | Usable mobile; fixed-width drawers; hub skeletons forever |
| Error Recovery | **3** | Good SSE/timeout guards; proper client error surface; history/parse failures silently swallowed |
| Observability | **2** | Logger + monitors exist; no telemetry on fallback rates/latency/AI spend |
| Testing | **0** | None |
| Scalability | **2** | Per-user history OK; no rate limits on expensive endpoints; in-memory rate-limit fallback |
| **Overall** | **~21/55** | Poor, trending "needs major work" — see §21J |

---

## 19. PROBLEM SEVERITY REGISTER

| ID | Category | Sev | Location | Evidence | Root Cause | Impact | Direction |
|---|---|---|---|---|---|---|---|
| S-01 | Truthfulness | **CRITICAL** | `interpret/route.ts:16-817, 814, 919, 924-932, 969-975` | Deterministic generator runs on no-key/timeout/error, stamps `aiModel: gemma-4-26b-a4b-it`, persists to history | Fallback designed to "never show an error" | Every assessment in keyless envs is fabricated and recorded as AI output; users/history untrustworthy | Fallback → honest fallback: label `isFallback: true`, distinct `aiModel: "local-deterministic"`, UI badge; run count+visibility in history |
| S-02 | Security/Abuse | **HIGH** | interpret/route.ts:1115; history/route.ts:62 | No `withRateLimit` on either; interpret = AI calls per request | Rate limiting only added where first needed | Auth'd user can burn AI quota / Mongo load | Add `withRateLimit` to interpret (lower limit) + clamp `limit` 1–100 on history |
| S-03 | Correctness | **HIGH** | engine `:233-254,:270` + engine-constants.ts:36-39 | Frame-count integration; delta-time constants unused | Physics written per-frame without clock | Speed varies with display refresh (60 vs 120 Hz) | Delta-time integration using MIN/MAX_DELTA_TIME_MS |
| S-04 | Performance | **HIGH** | engine `:244-251`; runner `:134` | `onStateSync` outside `isRunning`; telemetry→React state re-renders monolith | Pause implemented as a flag, not a stop | High CPU wasted at "pause"; sub-optimal rendering | Pause: skip draw+sync when not running (keep rAF or fully stop); memo the sidebar/sliders |
| S-05 | UX Integrity | **HIGH** | experimental-labs.tsx:24; sim-categories.tsx:24,60; simulation-config-client.ts:36-40 | Config endpoint absent → `null` → permanent skeletons | `/api/simulations/config` never implemented | Two hub components permanently lie "loading" | Implement config route (registry-backed) or delete components; at minimum stop the loading lie |
| S-06 | Reset semantics | **HIGH** | engine `:142-148` vs `stateSnapshot.population` `:295`; runner `:639-654` | `bacteria` population not reset; interactive reset skips sliders; AI drawer not cleared | `resetTime` re-inits only 4 sub-sims | Reset ≠ fresh experiment; state leakage across experiments | Reset re-inits all sub-sim state + restores default params in runner + clears AI panel |
| S-07 | Assessment data | **HIGH** | runner `:438-439`; engine physics cases `:256-509` | `{}` snapshot for 11 interactive + 31 conceptual sims | Only 6 sims run `updatePhysics` | AI output generic/unmeaningful for most sims | Add `updatePhysics`/snapshot for all interactive; for conceptual send parameters + sim metadata, not empty state |
| S-08 | State | **MED** | historyCacheRef (`:141`, set `:398-404`, never cleared) | Per-sim cache never invalidated | Cache added for perf | Stale history shown after new runs | TTL or invalidate on new run |
| S-09 | UX | **MED** | runner `:766`, `:499-513` | Restore invisible in NL mode; restores without time reset; raw markup in stream surface | Mode-gated rendering | User confusion: "history did nothing" | Unify drawer modes on restore; re-render as clean prose |
| S-10 | Contracts | **MED** | constants.ts vs registry.ts (§6); `runner:211` cast; types ×3 | Dual definition of every core fact | Parallel implementation w/o consolidation | Drift risk (ids/styles/params) | Registry = single source; delete client constants |
| S-11 | Security/Injection | **MED** | route `:997`; validation.ts:24; promptsafety.ts deleted | `z.any` snapshot interpolated raw; only `<>` stripping | Prompt hardening removed w/o replacement | Indirect prompt injection into AI output | Sanitize/JSON-escape user+state fields; re-introduce delimiters; treat snapshot as untrusted |
| S-12 | A11y | **MED** | runner `:886-891,845-851,686-691,967-976`, sliders `:702-710`; engine canvas | Unlabeled icon buttons; unlabeled sliders; canvas no fallback | Fast iteration, no a11y pass | Keyboard/SR users can't operate the lab | `aria-label`s, label→slider pairing, canvas fallback text |
| S-13 | Performance | **MED** | engine `:944-955,:695-704,:1062` | O(n²) graph; ~400 ellipses; per-frame gradient | Straightforward draw code | Weak-device jank | Batch/throttle draw; cache gradient |
| S-14 | Dead code | **MED** | sim-controls/sim-header/spark-insight; engine `:1107-1169`; llm.ts; spark-ai mock | No importers/no handlers | Leftovers from refactors | Maintenance noise; inert UI buttons if resurrected | Delete or reintegrate |
| S-15 | Routing | **MED** | runner `:216-264`; `[slug]/page.tsx` | Unknown slug → silent relativity | Client-side resolution | Wrong experiment shown with no error | `notFound()` on unknown slug |
| S-16 | Reduced motion | **LOW** | globals.css:486-494; engine/HUD rAF | CSS-only reduced-motion | Design tokens covered CSS only | Vestibular risk for canvas/HUD | JS `matchMedia('(prefers-reduced-motion)')` → freeze/step mode |
| S-17 | Input | **LOW** | runner `:837-843` vs validation.ts:23 | No client maxLength (500) | Input spec drift | Silent 400s | maxLength + inline counter |
| S-18 | Observability | **LOW** | everywhere | No fallback-rate/latency/cost counters | None added | Can't see fabrication rate or spend | Simple counters+logs at interpret/fallback |
| S-19 | DB | **LOW** | simulation-config.ts (orphan); SimulationHistory vs SimulationRun | Two models, one unused by sim APIs | Incremental building | Confusion; dead schema | Decide: wire config route or drop model; keep gamification model separately documented |
| S-20 | Testing | **HIGH** | repo-wide zero tests | §17 | Framework never installed | Any change can regress silently | Vitest + the §17 minimum suite |

---

## 20. TECHNICAL DEBT MAP

| Category | Debt level | Causes |
|---|---|---|
| Architecture | **High** | Monolith runner + monolith interpret route; three parallel "truths" of domain data (engine switch, registry, fallback generator) |
| State management | **High** | 10 Hz full-tree re-renders; duplicated param truth; no URL state; stale history cache; no lifecycle states |
| Simulation engines | **High** | Frame-count timing; 11/17 draw-only; 31/31 conceptual are one generic waveform; stochastic init; reset gaps |
| Types | **Medium** | 3 param contracts; domain type ×2; lossy projection drops units/required/description |
| UI | **Medium** | Dead components; permanent skeletons; inert buttons |
| UX | **Medium** | Reset/restore inconsistencies; no 404; missing units; accessibility gaps |
| Visualization | **Medium** | One waveform for 31 sims; no axes/legends; O(n²) graphs; no reduced-motion support |
| Backend | **Medium** | Missing config route; no rate limits; ETag dead path; empty anatomy stubs |
| Database | **Low** | Orphaned config model; dual history models; `Map of Mixed` looseness |
| Performance | **Medium** | Pause-work, re-renders, per-frame allocations |
| Security | **Medium** | Rate-limit gaps; prompt-interpolation hole; otherwise sound |
| Testing | **Critical** | Zero tests |

---

## 21. FINAL HEALTH REPORT

**A. Executive Summary.** The Neuron Simulation Lab is a **visually rich, structurally promising, but functionally incomplete system**. The core loop — pick a sim, drag sliders, watch a canvas, ask Spark AI, revisit history — genuinely works and is well built at the edges (decoupled engine, throttled telemetry, CSRF/auth hygiene, strict NL validation pipeline, clean error surface). But the system rests on several strained pillars: physics that counts frames instead of seconds; a **fallback path that fabricates and persists "AI" assessments**; **three parallel sources of truth** for the domain model; **zero tests**; hub pages that permanently pretend to load; and an AI assessment layer that in most cases interprets an **empty state snapshot**. It is not production-ready by any measure that involves user trust.

**B. Architecture Health — 2/5.** Decoupled engine + route layer is right; the monolith runner and route, the triplicated domain data, and the client-side-everything resolution (incl. no 404) drag it down. `simulation-runner.tsx` and `interpret/route.ts` at 1,035/1,115 lines set a hard ceiling on maintainability.

**C. Simulation Engine Health — 2/5.** The engine class is cleanly structured and leak-free; but only 6/17 simulators compute anything, timing is frame-bound (constants for delta-time exist unused), initialization is unseeded random, reset is partial, and pause wastes the loop. The conceptual HUD is a single generic waveform for 31 distinct experiments.

**D. Lab Health — 2/5.** The hero journey works; reset semantics, history-restore visibility, stall-prone hub cards, and the loading gate over a 404-fetch make the surrounding experience unreliable.

**E. UX/UI Health — 2/5.** Consistent styling, clear spatial design; undermined by unlabeled controls, no keyboard/canvas accessibility, no units, no reduced-motion support for animation, and the dead/inert components a user could stumble onto.

**F. Performance Health — 2/5.** Pause still renders; the whole runner re-renders at 10 Hz; conceptual HUD at 60 fps; O(n²) sub-visualizations; no user-visible jank on modern desktops, but nothing is load-budgeted.

**G. Security Health — 3/5.** Genuinely good auth/CSRF/storage discipline; lost points to missing rate limits on the two expensive endpoints and the prompt-interpolation surface for untrusted snapshot/user text. No invented vulnerabilities found.

**H. Code Quality Health — 3/5.** Clean strict TS, no suppressors/TODOs in sim code, consistent error helpers; heavy duplication, dead code, orphaned models, and drifted docs discount it.

**I. Testing Health — 0/5.** Nothing to assess beyond the absence.

**J. Production Readiness — ~38/100 → Poor/Needs Major Work.** Summing §18 category scores (21 across 11 categories weighted to the 100-point scale with Testing/Correctness/Truthfulness weighting the overall picture): the system runs, builds, and demos well (it would score "good" as a prototype), but fabricated AI attribution, frame-rate-dependent physics, a permanently-lying hub, unstoppable loops, and zero tests make it unsafe to continue feature development on without first stabilizing identity (S-01), economics (S-02), and the basics of correctness/testing (S-03, S-20).

---

## 22. PRIORITY ROADMAP

**P0 — Must Fix Before Further Development**
1. **S-01 Stop fabricating AI assessments** — honest fallback with distinct model attribution, visible badge in UI + history, and metric counters. *Why:* everything downstream (history, UX, trust, future AI features) inherits the lie.
2. **S-02 Rate-limit `/interpret` (and clamp `history` limit)** — the only paid underlying resource must be guarded. *Why:* unbounded authenticated AI calls are a production and cost risk.
3. **S-20 Establish a test harness** with the §17 minimum suite (engine determinism, NL pipeline, interpret parser, registry contracts). *Why:* without it, P1 changes (especially timing) are unverifiable.
4. **S-06 Reset semantics** — full state re-init, slider restoration, AI panel clear, consistent interactive/conceptual behavior. *Why:* reset is the core reliability promise of a lab; currently it leaks state.
5. **S-05 Hub integrity** — implement the registry-backed `/api/simulations/config` (or delete the loading lies). *Why:* two of the three public hub sections visibly lie to users at all times.

**P1 — Important Stabilization**
6. **S-03 Delta-time physics** using the existing constants — the single biggest correctness fix for all 6 computed simulators.
7. **S-04 Pause stops work** (skip draw/sync when paused; stop rAF when not running); memoize sidebar/sliders so telemetry updates stop re-rendering the world.
8. **S-07 Real snapshot coverage** — add `updatePhysics`/state emission for the 11 draw-only interactive sims; send sim metadata + parameters for conceptual assessments.
9. **S-10 Contracts** — registry becomes the single source of truth; delete the `constants.ts` duplication and the unused registry exports; fix the config type cast; restore units/required to the client projection.
10. **S-09, S-11, S-08** — history-restore drawer unification; re-introduce prompt hardening (delimiters + no-bypass role rules) for `stateSnapshot`/`userQuestion`; history cache invalidation.
11. **S-12 Accessibility pass** — labels for sliders/icon buttons, canvas fallback text, keyboard focus order.
12. **S-15 Unknown-slug 404.**

**P2 — Architectural / UX Improvements**
13. **Split the runner monolith** into LabsList / TelemetryPanel / AssessmentDrawer / Controls modules (a refactor, not a rewrite — keep behavior).
14. **URL state sync** for domain/sim/params (sharable, refresh-safe experiments).
15. **S-14 Dead-code removal** (SimControls/SimHeader/SparkInsight, draw default case, llm.ts template, spark-ai mock, orphaned config model decision) + ETag client wiring or removal.
16. **S-05b Anatomy stubs** — implement or delete the empty anatomical API dirs.
17. **Segregate/flag `SimulationHistory` vs `SimulationRun`** semantics.

**P3 — Optimization & Polish**
18. **S-13, S-16** — graph/bacteria/blackhole draw optimization; `prefers-reduced-motion` for rAF loops.
19. **S-17, S-18** — client maxLength + inline counter; fallback-rate/latency/AI-cost observability.
20. **S-08b** — proper numeric results layer (real metrics per sim, units, axes) if the product requires quantitative output.

---

*One-line answer to the central question:* the system is a **functional, good-looking prototype** whose interaction core is solid, but whose correctness (frame-rate-bound physics), integrity (fabricated, unlabelled AI fallback persisted to history), economy (unlimited AI calls), and guarantees (zero tests, lying hub pages, leaky reset) must be repaired — P0/P1 above — **before any further feature development**, and none of it requires a rewrite.