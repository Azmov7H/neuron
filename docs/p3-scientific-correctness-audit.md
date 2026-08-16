# P3 — Scientific Correctness & Simulation Fidelity Audit Report

**Scope.** Evidence-based scientific audit of all 48 registered simulations of the Neuron Scientific Simulation System: equation validity, dimensional/unit consistency, parameter semantics, range safety, engine implementation fidelity, visual fidelity, telemetry, AI interpretation, educational validity, and severity classification.

**Method.** The source code is the authority for current behavior. Every claim below is traced to a specific file/line and, where numeric, re-derived and verified by execution (see §5 evidence runs). No production code was modified in this pass.

**Baseline verified (P2).** 48 simulations · 6 domains · 8 per domain · 17 interactive · 135 tests (9 files) · `tsc` clean · `pnpm build` clean · registry = single authoritative catalog.

---

## 1. Executive Summary

**GATE RESULT AT AUDIT TIME: RED — 3 S3 findings (S4: 0).** Severity distribution: **S0 = 6, S1 = 24, S2 = 15, S3 = 3, S4 = 0.** **Post-P3.1 gate: YELLOW — S3 = 0** (all three S3s implemented and regression-tested; see the P3.1 Implementation Log below).

The architecture established in P0–P2 is sound: the registry is the single catalog, state contracts are honest (dynamic = measured; parameterized = render clock; conceptual = no measured state), the deterministic interpreter covers all 48 simulations, and validation guards most parameter boundaries. **But P2 proved consistency, not correctness.** This audit found:

1. **S3-01 blackhole (`blackhole`)** — the deterministic interpretation computes `1/√(1 − rs/r)` with **no guard for r ≤ rs**. `rs = 2.95·M` with M ∈ [5,30] yields 628 of 754 allowed (M, probe) combinations with a probe inside the event horizon — **including the defaults (M=10, r=22 → NaN)**. The default Spark panel text contains `NaNx time dilation`. Event-horizon-adjacent orbits are physically impossible states.
2. **S3-02 orbit (`orbit`)** — the canvas animation sweeps the satellite at `ω = √M · 0.0018` with **no dependence on the semi-major axis `a`**, directly contradicting Kepler's third law (T ∝ a^3/2) that the simulation claims to teach. Verified: visual ω(a=4) ≡ ω(a=18) while true Keplerian ω differs by 9.6×. The fallback interpreter text is correct; the visualization is not.
3. **S3-03 ecosystem (`ecosystem`)** — the registry equation is the Lotka–Volterra system but **no runtime layer implements it** (no dynamics; the conceptual HUD draws a generic two-sine waveform). The description promises "dynamic oscillations as populations balance hunting frequencies" and the interpreter asserts "populations settle into coupled oscillations" — the simulation cannot produce any such behavior.

Additional headline findings: a **31-of-48 class** of conceptual labs render one generic Lissajous waveform (the "p0→amplitude, p1→cycles" mapping) that is decoupled from each sim's model; in four cases the mapping is **physically inverted or dead** (pendulum length→amplitude, double-slit d→frequency, optics angle₁ and electrostatics distance are visual no-ops); five numeric/unit errors in the interpreter corpus (double-slit fringe 45.8 µm vs 45.8 mm, Coulomb force ×10, orbit period 22.2 yr vs 2.89 yr in claimed units, superposition slider 50% → actual 25%, osmosis action text backwards); hidden constants differ between engine and interpreter for `gravity` (0.5 vs 0.667); and the Spark AI prompt omits the simulation identity entirely (it must infer the lab from parameter keys).

**State of the deliverable.** This pass produced this report and the §16/§18 implementation/test plans only. Per the mission rules ("Audit first. Provide evidence. Classify severity. Design tests. Only then propose implementation."), **no production code was changed**. The gate was RED and the prioritized plan (P3.1–P3.8, §18) was the next authorized step. **P3.1 has since been authorized and landed** (log immediately below): all three S3s are closed — blackhole guard + physically scoped ranges, orbit Kepler ω(a), ecosystem Lotka–Volterra integrator — with 18 new regression tests. Gate: **RED → YELLOW**. No schema, DB, or payload changes; interpretation text for in-horizon blackhole configs is the only user-visible behavior change beyond animation/visual fidelity.

## P3.1 Implementation Log (landed, authorized)

| Fix | What changed | Files | Evidence / tests |
|---|---|---|---|
| **RF-1 blackhole** | In-horizon guard: r ≤ rs now emits explicit "inside the event horizon" semantics (no `1/√(1−rs/r)` evaluation); registry re-scoped so every in-registry combination satisfies r > rs (M ∈ [5,13] → rs ≤ 38.35 km; probe r ∈ [39,60] → rs/r < 1 always); defaults M=10, r=45 → dilation 1.70×. Engine draw default aligned (r=45) | `deterministic-fallback.ts`, `registry.ts`, `simulation-engine.ts` | §16-7/8 grid sweep: 198/198 combos finite, 0 inside-horizon, default combo defined (`fallback-formulas.test.ts`) |
| **RF-2 orbit** | `ω = k·√(M/a³)` (Kepler), k calibrated so the default orbit keeps prior pacing; extracted as exported pure `computeOrbitAngularVelocity` | `simulation-engine.ts` | §16-9 ratio test: ω(a=4)/ω(a=18) = (18/4)^1.5 = 9.545 for all M; T ∝ a^1.5; telemetry unchanged |
| **RF-3 ecosystem** | Real Lotka–Volterra integration rendered in the conceptual HUD for this id (two curves, playhead, live readouts); coefficients α=0.4 β=0.016 δ=0.005 γ=0.25 → equilibrium (x*, y*) = (50, 25) inside both slider ranges; generic waveform untouched for the other 30 conceptual sims | `lotka-volterra.ts` (new), `conceptual-telemetry-hud.tsx` | §16-1/6: bounded/finite/positive over 50 s; predator peak lags prey peak; exact equilibrium constancy (`lotka-volterra.test.ts`) |

Validation: **153/153 tests** (135 prior + 18 new) · `tsc` clean · `pnpm build` clean · ESLint clean on all 8 touched files. Compatibility: no schema/DB changes; registry range edits flow to UI sliders/NL bounds via the registry-driven pipeline; interpretation text for in-horizon configs changed by design (was NaN).

### Shared scientific contract (post-P3.1)

| Simulation | Equation | Runtime | Visualization | Interpretation |
|---|---|---|---|---|
| blackhole | Schwarzschild radius / gravitational time dilation (rs = 2.95·M, 1/√(1−rs/r) for r > rs) | guarded (r ≤ rs → inside-horizon semantics) | horizon-aware (probe red inside, defaults r=45) | guarded (explicit inside-horizon text; no NaN) |
| orbit | Kepler ω ∝ √(M/a³) (T ∝ a^3/2) | `computeOrbitAngularVelocity` — only in-registry combos finite/positive | Keplerian speed (θ = t·ω(M,a); old ω ignored a) | consistent (T = 2π√(r³/0.667·M)) |
| ecosystem | Lotka–Volterra dx/dt = αx − βxy, dy/dt = δxy − γy | numerical LV integrator (Euler dt=0.05, clamped ≥ 0) | prey/predator curves + playhead + equilibrium readouts | consistent (same model + normalized coefficients) |

---

## 2. Current Scientific Architecture

Execution path as implemented (verified, not assumed):

```
src/lib/simulation/registry.ts            ← 48 defs: equation string, params (unit/type/min/max/step/default/required)
        ↓  toClientSimulation / config-payload
GET /api/simulations/config + client LOCAL_FALLBACK_CONFIG
        ↓  components/simulation-runner/simulation-runner.tsx
SimulationEngine (interactive 17)   vs   ConceptualTelemetryHUD (conceptual 31)
        ↓  getSimulationStateType (dynamic 6 | parameterized_visualization 11 | conceptual 31)
simulation-engine.ts: updatePhysics() → stateSnapshot → draw() ; 10 Hz telemetry → SimulationRun payload
        ↓  POST /api/simulations/interpret (validation → LLM stream | deterministic fallback)
deterministic-fallback.ts  (48-branch math + prose)   |   LLM prompt WITHOUT simulation identity
        ↓  SimulationRun.create (persistence) → history / restore-by-params
```

Supporting machinery audited: `registry.types.ts` (canonical `SimulationParameter`), `simulation-state.ts` (single dynamic set of 6), `engine-constants.ts` (canvas/timing/particle constants), `assessment.ts` (honest source metadata), `hooks`: `schemas.ts`/`nl-interpreter.service.ts` (registry-driven NL whitelist + bounds), `history-params.ts` (read guards), `audit.ts` (P3 data-integrity classifier). Database: `simulationconfigs` collection empty (config is registry-derived, not DB-stored); `simulationruns` holds 1 live record (relativity, classified VALID in the P3 data-integrity report §4).

**State-contract honesty (commendation).** The `dynamic`/`parameterized_visualization`/`conceptual` classification is truthful: no fabricated measured state is emitted (S-07 tests enforce it). The remaining problems are **scientific content**, not architecture.

---

## 3. The 48-Simulation Audit Matrix

Columns: `id` · `equation (registry)` · `parameters` (key: unit, min–max·step, def) · `state` · `runtime engine` · `visualization` · `telemetry` · `AI interpretation` · `existing tests`.

Legend — Engine: **DYN** = dynamic engine case (measured state); **PV** = parameterized canvas case; **HUD** = ConceptualTelemetryHUD. Tests: R=registry.test, C=contracts.test, E=engine.test, F=deterministic-fallback.test, A=audit.test, N=nl-interpreter.test, S=schemas.test.

### PHYSICS

| id | equation | parameters | state | engine | visualization | telemetry | AI | tests |
|---|---|---|---|---|---|---|---|---|
| `relativity` | t′=t/√(1−v²/c²) | speed: v/c 0–0.99·0.01·0.5 | PV | DYN: no state (PV); draw: γ=1/√(1−v²) | two clocks (B at 1/γ rate), length bar 1/γ, γ label | `{visualizationState:{animationPhase}}` | fallback: γ, 1/γ, 100/γ% — all correct | R,E*,F |
| `motion` | a=(F−μmg)/m | force: N 0–50·1·15; mass: kg 1–20·0.5·5; friction: 0–0.8·0.05·0.2 | DYN | DYN: F_f=μmg; F_net=max(0,F−F_f); a=F_net/m; v₊=a·0.03·dt; brake only when F=0 | box + force arrow (F·2.2px) | `acceleration, velocity(=vₓ·4), frictionalForce` | fallback: same formula incl. max(0,·) | R,E,F,A |
| `gravity` | v=√(GM/r) | orbitalRadius: 3–14·0.5·8; centralMass: 50–300·10·150 | PV | draw: v=√(0.5M/R); θ=t·v·0.015 | star + dashed orbit + planet | clock only | fallback: √(0.667M/r) — **constant mismatch** | R,E*,F |
| `pendulum` | T=2π√(L/g) | length: m 1.6–25… (L 2–12·0.5·6); gravity: m/s² 1.6–25·0.2·9.8 | HUD | none | wave: L→amplitude, g→cycles (**inverted semantics**) | none (HUD readouts amp/freq/phase) | fallback: T=2π√(L/g) — correct | R,F |
| `thermodynamics` | P=nRT/V | temperature: K 100–600·10·300; volume: L 2–15·0.5·5 | HUD | none | wave: T→amp, V→cycles | HUD readouts | fallback: P=8.314·T/V (n=1) — correct | R,F |
| `optics` | n₁sinθ₁=n₂sinθ₂ | index1: 1–2.5·0.1·1; index2: 1–2.5·0.1·1.5; angle1: ° 0–85·1·45 | HUD | none | wave: index1→amp, index2→cycles; **angle1 no-op** | HUD readouts | fallback: θ₂=asin(n₁sinθ₁/n₂) — correct incl. clamp | R,F |
| `wave_interference` | y=Lλ/d | wavelength: nm 380–750·10·550; slitDistance: µm 4–24·0.5·12 | HUD | none | wave: λ→amp, d→cycles (**d inverted**) | HUD readouts | fallback: y=λL/d with L=1 m — **unit error ×1000** | R,F |
| `electrostatics` | F=k_e·q₁q₂/r² | charge1: µC −30–30·1·10; charge2: µC −30–30·1·−10; distance: cm 2–12·0.2·5 | HUD | none | wave: q₁→amp, q₂→cycles; **distance no-op** | HUD readouts | fallback: F=8.99·q₁q₂/r² — **factor-10 unit error** | R,F |

### BIOLOGY

| id | equation | parameters | state | engine | visualization | telemetry | AI | tests |
|---|---|---|---|---|---|---|---|---|
| `bacteria` | dN/dt=rN(1−N/K) | temperature: °C 5–50·1·37; nutrientLevel: (K) 1–10·0.5·6 | DYN | DYN: K=nutrient·40; r=exp(−(T−37)²/288); N₊=min(K, N+r·0.05·N(1−N/K)·dt) | dish + spiral-packed colony dots (cached) | `population, growthRate(=r factor)` | fallback claims Lag/Log/**Death** phases + "witness Lag" | R,E,F,A |
| `virus` | R₀=β/γ | transmissionRate: 0.1–0.9·0.05·0.5; recoveryRate: 0.02–0.3·0.01·0.1; populationSize: 30–300·10·120 | DYN | DYN: agent SIR; contact p = min(1, β·0.04·dt) dist²<80; recovery at (1/γ)·12 ticks | bouncing particles, S cyan / I red / R green | `susceptible, infected, recovered, r0=β/γ` | fallback: correct R₀ semantics | R,E,F,A |
| `immune` | dP/dt=r_pP−kP·WBC | pathogenCount: 10–100·5·40; wbcCount: 2–35·1·15 | DYN | DYN: WBC seek nearest pathogen, kill <10px; **no pathogen growth term** | WBC circles + pathogen dots (re-init on param change) | `pathogensRemaining, wbcUnits(static=wbcCount)` | fallback: mentions pathogen replication (absent) | R,E,F,A |
| `genetics` | p²+2pq+q²=1 | dominantRatio: 0.05–0.95·0.05·0.6 | HUD | none | wave | HUD readouts | fallback: p²/2pq/q² correct | R,F |
| `photosynthesis` | Rate ∝ Light·CO₂ | lightIntensity: `lux` 1–12·0.5·8; co2Level: PPM 1–8·0.5·4 | HUD | none | wave: L→amp, CO₂→cycles | HUD readouts | fallback: rate=L·CO₂ (no saturation term) | R,F |
| `enzymes` | v=Vmax·S/(Km+S) | substrateConc: 1–12·0.5·5; enzymeConc: 1–8·0.5·3 | HUD | none | wave | HUD readouts | fallback: v=E·S/(5+S) — treats [E] as Vmax | R,F |
| `osmosis` | Π=i·M·R·T | soluteRatio: % 1–8·0.2·4 | HUD | none | wave | HUD readouts | fallback: Π=solute·2.5; **action text physically reversed** | R,F |
| `ecosystem` | dx/dt=αx−βxy | preyPopulation: 20–100·5·60; predatorPopulation: 5–35·1·15 | HUD | **none — LV not implemented** | generic wave | HUD readouts | fallback narrates boom-bust cycles not producible | R,F,A |

### ANATOMY

| id | equation | parameters | state | engine | visualization | telemetry | AI | tests |
|---|---|---|---|---|---|---|---|---|
| `heart` | CO=HR·SV | heartRate: BPM 40–180·5·72; strokeVolume: mL 40–125·5·70 | PV | draw: pulse period=60/HR; opacity ∝ SV (clamped 0.15–0.26) | pulsing heart shape | clock only | fallback: CO=HR·SV/1000 L/min — correct | R,E*,F |
| `neural` | v_conduction ∝ myelin | stimulusStrength: mV 1–10·0.5·5; myelination: 1–4·0.5·2 | PV | draw: speed=2·myelin; **stimulusStrength never read** | axon + 4 segments + pulse | clock only | fallback: prose uses mV; saltatory claims | R,E*,F |
| `blood` | Q=ΔP·πr⁴/(8ηL) | vesselRadius: mm 1–5·0.1·3; bloodPressure: mmHg 50–150·5·100 | PV | draw: cell speed ∝ ΔP·r²/80, parabolic profile | vessel, cells, parabolic flow | clock only | fallback: Q=ΔP·r⁴/100 → labels "mL/sec" (unsupported) | R,E*,F |
| `nephron` | GFR=Kf(Pг−Pб−πг) | filterPressure: 30–70·1·45; urineResistance: 5–25·0.5·12 | HUD | none | wave | HUD readouts | fallback: GFR=P_g−P_b (π_g dropped, R=12 label "Bowman") | R,F |
| `pulmonary` | V∝A·D·ΔP/T | oxygenPartialPress: mmHg 60–130·2·104; barrierThickness: µm 1–5·0.2·2 | HUD | none | wave | HUD readouts | fallback: rate=ΔP/T (A,D constant) — correct form | R,F |
| `muscle` | F=F₀(1−v/v_max) | calciumLevel: 1–10·0.5·5; atpAvailability: 2–12·0.5·8 | HUD | none | wave | HUD readouts | fallback: force=Ca·ATP·0.4 — **equation ≠ implementation** | R,F |
| `endocrine` | dG/dt=I_prod−I_util·G | carbIntake: g 10–120·5·60; insulinSensitivity: 1–8·0.2·4 | HUD | none | wave | HUD readouts | fallback: qualitative loop text only | R,F |
| `bone` | Bone ∝ D₃·Cal | calciumIntake: mg 2–15·0.5·8; vitaminD: 1–10·0.5·5 | HUD | none | wave | HUD readouts | fallback: mass=Cal·D₃·0.5 — matches equation | R,F |

### MATHEMATICS

| id | equation | parameters | state | engine | visualization | telemetry | AI | tests |
|---|---|---|---|---|---|---|---|---|
| `functions` | f(x)=mx+A·sin(x) | slope: −4–4·0.1·1.5; amplitude: 0–8·0.2·4 | PV | draw: mathY=m·x+A·sin(x) | grid + live bezier curve | clock only | fallback: explains f(x) — correct | R,E*,F |
| `probability` | Gaussian pdf | beadsCount: 50–400·10·200 | DYN | DYN: Galton board, 8 peg rows, spawn acc. 8 ticks, p=0.5 bounce | pegs + falling beads + 15 bins | `beadsSettled` | fallback: CLT narrative; **action suggests 500 beads (>max)** | R,E,F,A |
| `graph` | G(n,p), transition p≈1/n | nodesCount: 10–50·1·30; connectionProbability: 0–0.5·0.01·0.15 | DYN | DYN: Fruchterman-style layout (repel 30/d, gravity 0.015, damp 0.85) | force-directed node/edge diagram | `nodeCount, averageSpeed` (**no component metrics**) | fallback: E=n(n−1)p/2 count; claims giant component | R,E,F,A |
| `chaos` | σ=10, ρ=28, β=8/3 | chaosRho: 14–40·0.5·28 | HUD | none | wave | HUD readouts | fallback: chaotic attractor narrative — no trajectory exists | R,F |
| `fractal` | zₙ₊₁=zₙ²+c | iterationsLimit: 10–80·2·40 | HUD | none | wave | HUD readouts | fallback: escape-time narrative — nothing rendered | R,F |
| `fourier` | f(t)=ΣAₙsin(nωt) | harmonicCount: 1–12·1·3 | HUD | none | wave (cycles∝n, plausible metaphor) | HUD readouts | fallback: square/triangle/sawtooth claims — unimplementable | R,F |
| `calculus` | ∫≈Σf(xᵢ)Δx | rectanglesCount: 4–48·2·16 | HUD | none | wave | HUD readouts | fallback: Riemann narrative — no rectangles rendered | R,F |
| `fibonacci` | φ=(1+√5)/2 | spiralScale: 1–8·0.2·4 | HUD | none | wave (scale→amp, weak metaphor) | HUD readouts | fallback: φ spiral narrative — no spiral rendered | R,F |

### QUANTUM

| id | equation | parameters | state | engine | visualization | telemetry | AI | tests |
|---|---|---|---|---|---|---|---|---|
| `wave` | ψₙ=√(2/L)sin(nπx/L) | energyLevel: 1–6·1·2; wellWidth: (L) Bohr 4–12·0.5·8 | PV | draw: ψ(ratio)=√(2/L)sin(nπ·ratio), animated | well box + standing wave, node count = n | clock only | fallback: nodes/normalization claims correct | R,E*,F |
| `uncertainty` | Δx·Δp ≥ ħ/2 | positionSpread: 0.4–4·0.1·1.5 | PV | draw: envelope e^(−(x/dx)²), osc freq ∝ 1/dx | packet width vs oscillation (Δp) | clock only | fallback: Δp=1/Δx (normalized ħ/2=1) — consistent | R,E*,F |
| `tunneling` | T≈e^(−2κa) | barrierHeight: 5–15·0.5·8; particleEnergy: 1–10·0.5·4 | HUD | none | wave | HUD readouts | fallback: κ=√(V₀−E), T=e^−2κ — **width factor a absent** | R,F |
| `spin` | \|ψ⟩=cos θ/2\|0⟩+e^{iφ}sin θ/2\|1⟩ | spinTheta: ° 0–180·5·90; spinPhi: ° 0–360·10·45 | HUD | none | wave | HUD readouts | fallback: Bloch narrative — correct form | R,F |
| `entanglement` | \|Φ⁺⟩=(‖00⟩+\|11⟩)/√2 | correlationAngle: ° 0–90·5·45 | HUD | none | wave | HUD readouts | fallback: corr=cos(2θ); **"violates Bell for aligned settings" claim** | R,F |
| `hydrogen` | rₙ=n²·a₀ | quantumNumber: 1–5·1·2 | HUD | none | wave | HUD readouts | fallback: r=n²·0.529 Å — correct | R,F |
| `harmonic` | Eₙ=(n+½)ℏω | oscillatorEnergy: 0–4·1·1 | HUD | none | wave | HUD readouts | fallback: E=n+0.5 (ℏω units) — correct | R,F |
| `superposition` | \|ψ⟩=α\|0⟩+β\|1⟩ | probabilityAlpha: % 0–100·5·50 | HUD | none | wave | HUD readouts | fallback: α=p/100 **as amplitude**; P(\|0⟩)=α² — label mismatch | R,F,A |

### SPACE

| id | equation | parameters | state | engine | visualization | telemetry | AI | tests |
|---|---|---|---|---|---|---|---|---|
| `orbit` | T²=(4π²/GM)a³ | orbitSemiMajorAxis: AU 4–18·0.5·10; starMass: M☉ 40–240·10·120 | PV | draw: θ=t·√M·0.0018 — **a NOT used in speed** | star + ellipse + planet | clock only | fallback: v=√(0.667M/r), T=2π√(r³/0.667M) "years" — **wrong units** | R,E*,F,A |
| `blackhole` | r_s=2GM/c² | blackholeMass: M☉ 5–30·1·10; probeDistance: km 12–40·1·22 | PV | draw: rs=2.95·M km; disk gradient cache | star + accretion + probe (red if rs/pr>0.4) | clock only | fallback: **NaN when rs≥r — 628/754 combos incl. defaults** | R,E*,F,A |
| `stellar` | M_initial ⇒ remnant | initialMass: M☉ 0.1–40·0.5·8 | PV | draw: color/size bins (<0.5, <8, <25, ≥25) | colored star disc | clock only | fallback: lifecycle/remnant table — matches bins | R,E*,F |
| `cosmology` | v=H₀·d | hubbleConstant: 70 default (50–90·2·70) | HUD | none | wave | HUD readouts | fallback: substitutes d=H₀ → "70 Mpc recedes at 70 km/s" — **no distance axis** | R,F |
| `nebula` | M_J ∝ T^{3/2}ρ^{−1/2} | dustDensity: 1–10·0.5·4; gasTemp: K 5–50·1·20 | HUD | none | wave | HUD readouts | fallback: M_J=T^1.5/√ρ — correct form | R,F |
| `tides` | F ∝ M_moon/d³ | moonDistance: R⊕ 4–15·0.5·8 | HUD | none | wave | HUD readouts | fallback: 1/d³ — correct | R,F |
| `magnetosphere` | r ∝ B^{1/3} | windVelocity: 1–10·0.5·5; fieldStrength: 2–15·0.5·8 | HUD | none | wave | HUD readouts | fallback: r=B^{1/3} — **windVelocity absent from formula** | R,F |
| `pulsar` | P_spin ≈ ms | rotationSpeed: ms 1–20·0.5·6 | HUD | none | wave | HUD readouts | fallback: pulse narrative — beam absent | R,F |

E* = included in all-17 lifecycle/smoke tests only (no per-sim scientific assertion).

---

## 4. Scientific Findings

Equation-level verdict per simulation (registry equation vs the math actually executed by engine/fallback):

### Correct (model matches a defensible physical/mathematical law)
`relativity` (γ, dilation ×1/γ, contraction ÷γ — engine draw and fallback agree with the registry equation), `virus` (stochastic agent SIR; R₀ = β/γ consistent), `functions` (exact), `probability` (binomial→normal via Galton board; p=0.5 per peg), `wave` (infinite-well eigenfunction), `uncertainty` (packet-width/Δp duality, ħ/2 = 1 normalized), `hydrogen` (rₙ = n²·a₀, a₀ = 0.529 Å), `harmonic` (Eₙ = (n+½)ℏω), `stellar` (mass→remnant bins consistent between engine and fallback), `tides` (1/d³), `nebula` (Jeans form), `thermodynamics` (fallback nRT/V with n=1, correct kPa), `heart` (fallback CO = HR·SV/1000 correct), `genetics` (Hardy–Weinberg correct), `spin` (Bloch decomposition form correct), `fibonacci` (φ correct), `pulmonary` (Fick form), `nebula` (Jeans form). 

### Correct but simplified (abstraction documented; relationships preserved)
`motion` (μmg threshold + linear accel; engine clamps a≥0 while F>0 — see F-08), `wave_interference` fallback math (y = Lλ/d with L=1 m fits the equation; only the output units are wrong — §5), `optics` fallback (Snell with clamped asin), `nephron` (π_g oncotic term dropped — Kf, π_g const-folded), `enzymes` ([E] treated as Vmax, K_m = 5 fixed), `pulmonary` (A, D folded), `blood` (v_centerline ∝ ΔP·r² is Poiseuille's actual centerline velocity; Q ∝ r⁴ is the flow law — both correct at their claimed level, but the sim never reports Q), `bacteria` (discrete logistic; r = exp(−(T−37)²/288) is a reasonable thermal fitness factor), `immune` (no pathogen growth; contact-kill model).

### Not actually implemented as an equation/model in any runtime layer
`ecosystem` (LV system — **no dynamics at all**), `chaos` (Lorenz ODEs — none), `fractal` (Mandelbrot iteration — none), `fourier` (harmonic synthesis — none), `calculus` (Riemann sums — none), `fibonacci` (spiral geometry — none), `cosmology` (Hubble regression — none), `magnetosphere` (magnetic standoff — none), `pulsar` (beam sweep — none), plus every other HUD sim: the "equation" exists only as a displayed string and (for 31 sims) in fallback prose. For these, the registry equation is a **specification statement**, not an executable model. This is the single largest pattern (see §14 P-1).

### Dimensionally/physically questionable
`blackhole` (probe can be placed inside the horizon; interpretation NaN — §5), `orbit` (visual ω independent of a; claimed "years"/"km/s" from a normalized constant — §5), `superposition` (label "Weight (%)" but value is amplitude — §5), `wave_interference` (µm claim ×1000 off), `electrostatics` (N claim ×10 off), `magnetosphere` (standoff law displayed without the wind term that the parameter name implies).

### Hidden constants ledger (Phase 2D)

| sim | constant | value | verdict |
|---|---|---|---|
| relativity | c | v/c normalized, v∈[0,0.99] | correct normalization |
| motion | μmg g | **9.8 m/s²** (engine-constants GRAVITY_CONSTANT and `simulation-engine.ts:439`) | correct physical constant |
| motion | — | **0.03** px/tick force→velocity conversion; **×4** telemetry velocity factor (engine:444,457) | arbitrary calibration; telemetry "velocity" unitless |
| gravity | G_eff | **0.5** (engine:882) vs **0.667** (fallback:150) | **inconsistent between layers** |
| orbit | G_eff | 0.667 (fallback:649-650) labeled "km/s"/"years" | normalized constant presented as SI — unsupported |
| blackhole | rs/M | **2.95 km/M☉** (engine:1270, fallback:665) | physically correct (2G·M/c² ≈ 2.95 km/M☉) ✓ |
| blackhole | time dilation | 1/√(1−rs/r) (fallback:671) | correct formula, **unguarded for r ≤ rs** |
| pendulum | g range | 1.6–25 m/s² (Moon 1.62 → Jupiter 24.79) | educationally deliberate, correct |
| thermodynamics | R | 8.314 (fallback:86) | correct SI |
| optics | L (screen) | 1 m (fallback:118) | hidden but benign assumption |
| enzymes | K_m | 5 (fallback:230) | arbitrary |
| osmosis | i·M·R·T | 2.5 per % solute (fallback:245) | arbitrary fold |
| double-slit | L | 1 m; then λ(nm)/d(µm) **without conversion** (fallback:117-118) | unit error, see §5 |
| electrostatics | k_e | 8.99 (drop ×10⁹) + µC/cm direct (fallback:134) | unit error, see §5 |
| probability | peg p | 0.5 (engine:631) | correct; fallback echoes 0.5 |
| probability | spawn | 1 bead/8 ticks (engine:599-600) | honest presentation rate |
| tunneling | barrier width a | **absent** — T = e^(−2κ) with a≡1 (fallback:543-544; registry equation contains `a`) | equation/parameter mismatch |
| physics `wave` | L in "Bohr" | pixel scale 32 px/Bohr (engine:1182) | cosmetic |
| universe `cosmology` | — | fallback substitutes d = H₀ numerically | fabrication, see §5 |

---

## 5. Mathematical Findings

All values below were recomputed from the implementation formulas by execution:

| # | sim | location | current behavior | expected | evidence (run) | severity |
|---|---|---|---|---|---|---|
| M-01 | blackhole | fallback:671 | `1/√(1−rs/r)` → **NaN** for 628/754 allowed (M, r) combos incl. **default (M=10, r=22: rs/r = 1.34 → NaN)**; text: "…NaNx time dilation" | defined ≥ 1 for r > rs; explicit "inside horizon" handling for r ≤ rs | `NaN combos = 628 / 754, valid 126` | S3 |
| M-02 | orbit | engine:1255 | θ = t·√M·0.0018 — ω(a=4) ≡ ω(a=18) | ω ∝ √(M/a³); ratio for a=4→18 = (18/4)^1.5 = 9.55 | run: visual ω identical; Kepler ω 1.369 vs 0.143 | S3 |
| M-03 | orbit | fallback:649-650 | period = 2π√(a³/0.667M) = 22.2 labeled "years" with a=10 AU, M=120 M☉ | T = √(a³/M) = 2.89 yr under G=4π² convention | run: 22.2 vs 2.89 (7.7×) | S2 |
| M-04 | wave_interference | fallback:117-119 | y = (1·λ)/d = 45.8 labeled "µm" (λ=550 nm, d=12 µm, L=1 m) | 0.0458 m = 45.8 mm (nm↔µm is a ×1000 conversion) | run: (550 nm)/(12 µm)·1 m = 45.8 mm | S2 |
| M-05 | electrostatics | fallback:134 | F = 8.99·q₁q₂/r² with q in µC, r in cm → −36.0 labeled "N" | SI: 8.99e9·(q1e-6)(q2e-6)/(0.01r)² = −359.6 N (×10) | run: −36.0 vs −359.6 | S2 |
| M-06 | superposition | fallback:614-616 | α = p/100 (amplitude); P(\|0⟩)=α² → slider 50% yields 25%/\|0⟩, 75%/\|1⟩; β=√(1−α²) keeps α²+β²=1 | slider labeled "State \|0⟩ Weight (%)" should give P(\|0⟩)=p ⇒ α=√(p/100) | run: 50% → 25%/75% | S2 |
| M-07 | motion | engine:446-448 | braking applied **only while force === 0**; while 0 < F < μmg the block coasts forever (a clamped ≥ 0) | F < μmg should decelerate a moving body to rest (kinetic friction opposes motion whenever v > 0) | engine:440 (`max(0, ·)`) + brake branch | S2 |
| M-08 | probability | fallback:437 | recommended action "Increase beads count to 500" | registry max = 400 | registry:429 | S1 |
| M-09 | tunneling | fallback:543-544 | T = e^(−2κ) with **no barrier width**; registry equation T ≈ e^(−2κa); E ≥ V₀ → abrupt T = 1 | width parameter (or explicit a=1 statement) required for equation fidelity | registry:531; run: E=V₀ → T=1 | S1 |
| M-10 | cosmology | fallback:680-681 | "a galaxy {H₀} Mpc away recedes at roughly {H₀} km/s" — substitutes d := H₀; the sim has no distance axis | Hubble's law requires a distance dimension to teach v = H₀·d | fallback:681 | S2 |
| M-11 | entanglement | fallback:577 | "Violates Bell's inequality for aligned settings" | aligned settings (θ₁=θ₂) yield classical-compatible correlations; CHSH violations need mixed settings | physics literature | S1 |

---

## 6. Unit / Dimensional Findings

Unit hygiene ledger (only parameters with findings; all others use registry-declared units honestly):

| sim | parameter | declared unit | used by engine/fallback | flag |
|---|---|---|---|---|
| motion | force | N | N (μmg with g=9.8) ✓ | — |
| motion | velocity telemetry | (none) | px/tick × 4 → unitless | U-01: unitless telemetry presented as physics |
| motion | acceleration | (none) | m/s²-style (0.03 px/tick conversion) | U-01 |
| gravity | orbitalRadius | (none) | abstract units | U-02: fine — but G_eff differs 0.5 vs 0.667 across layers |
| pendulum | gravity | m/s² | m/s² | range = deliberate Moon→Jupiter scale ✓ |
| thermodynamics | volume | L | L with R=8.314 ⇒ kPa ✓ | — |
| optics / wave_interference / electrostatics | — | nm / µm / µC / cm | raw divisions, no conversion | U-03: M-04, M-05 |
| photosynthesis | lightIntensity | **lux** | dimensionless 1–12 | U-04: lux is illuminance, not photon flux (PAR); flag per brief Phase 3 |
| photosynthesis | co2Level | "PPM" | dimensionless 1–8 | U-04 |
| bacteria | nutrientLevel | (none; "Nutrients index (K)") | dimensionless | U-05: "index" honestly labeled but is carrying capacity — see P-4 note |
| blood | bloodPressure | mmHg | mmHg | fallback Q labeled "mL/sec" from normalized ΔP·r⁴/100 — unsupported physical units (U-06) |
| orbit | orbitSemiMajorAxis | AU | AU (visual px) | U-07: fallback claims km/s + years from G_eff=0.667 — M-03 |
| blackhole | probeDistance | km | km (2.95 km/M☉ rs) ✓ | U-08: range allows r ≤ rs — M-01 |
| wave | wellWidth | Bohr | Bohr (32 px/Bohr render) ✓ | — |
| hydrogen | (radius output) | Å | Å (a₀=0.529) ✓ | — |
| muscle | calciumLevel | ions | dimensionless 1–10 | U-09: "Ca²⁺ ions" label vs unitless count — minor |
| nephron | urineResistance | (none) | mmHg | U-10: label "resistance" but used as Bowman **pressure** P_β in GFR = P_g − P_β |
| magnetosphere | windVelocity | (none) | **unused in r = B^{1/3}** | U-11: U-11 dead variable — standoff should also scale with wind pressure |

Fake-units principle applied: a normalized constant is acceptable when the UI does not claim SI realism (gravity, orbit visual). Explicit SI labels on normalized calculations (blood "mL/sec", orbit "years/km/s", Coulomb "N", fringe "µm") are flagged as unsupported.

---

## 7. Parameter Semantics Findings

| # | sim | parameter | registry label | actual engine meaning | finding |
|---|---|---|---|---|---|
| P-01 | bacteria | nutrientLevel | "Nutrients index (K)" | carrying capacity K = value×40 | Honest "index" label, but the description/AI call it nutrients; it **is** K. Documented, not a bug (Phase 4 example category). |
| P-02 | superposition | probabilityAlpha | "State \|0⟩ Weight (%)" | amplitude α (prob = α²) | **label elides amplitude vs probability** — M-06 |
| P-03 | neural | stimulusStrength | "Stimulus (mV)" | **never read by engine (draw or updatePhysics)** | dead parameter — §8 E-01 |
| P-04 | optics | angle1 | "Incident Angle (θ₁°)" | read by fallback only; **no visual effect** | dead in presentation — §8 E-02 |
| P-05 | electrostatics | distance | "Separation Radius (r cm)" | read by fallback only; **no visual effect** | dead in presentation — §8 E-02 |
| P-06 | magnetosphere | windVelocity | "Solar Wind Speed (v)" | appears in prose only; absent from r ∝ B^{1/3} | formula incomplete for its own parameter |
| P-07 | virus | populationSize | "Population Size (N)" | read only at engine init; mid-run slider changes are ignored (no `updateParameter` branch) | init-only parameter — §8 E-03 |
| P-08 | motion | friction | "Friction Coefficient (μ)" | brake only when F === 0 | semantic mismatch with kinetic friction — M-07 |
| P-09 | tunneling | (barrierWidth absent) | equation contains `a` | no parameter exists | registry equation exceeds parameter set |
| P-10 | nephron | urineResistance | "Bowman Resistance (Pᵦ)" | used as P_β term (mmHg) | label vs quantity mismatch — U-10 |
| P-11 | enzymes | enzymeConc | "Enzyme Concentration" | acts as V_max | simplification, OK if documented |
| P-12 | photosynthesis | lightIntensity | "Light Flux (lux)" | dimensionless rate factor | unit mismatch — U-04 |

---

## 8. Engine Implementation Findings

Trace verdicts for the 17 interactive simulations (registry → runner → state → engine → telemetry → visualization):

| # | sim | location | finding | severity |
|---|---|---|---|---|
| E-01 | neural | `simulation-engine.ts` draw (1006-1047) | **`stimulusStrength` unused** — only `myelination` drives speed; sliders for mV have zero effect anywhere in runtime | S2 |
| E-02 | optics, electrostatics | HUD `params` usage (specs[0]/specs[1] only) | third parameters (`angle1`, `distance`) have no effect on the visualization; only the interpreter prose reads them | S2 |
| E-03 | virus | `updateParameter` (247-262) | changing `populationSize` mid-run does not re-seed the SIR agent DB (contrast: immune/graph/probability do rebuild) | S1 |
| E-04 | motion | `updatePhysics` (435-461) | asymmetric braking (F===0 gate); hidden 0.03 / ×4 calibration; telemetry `velocity` mixes px/tick scale with displayed units | S2 |
| E-05 | gravity | engine:882 vs fallback:150 | G_eff 0.5 vs 0.667 — same physical quantity, two constants | S1 |
| E-06 | orbit | engine:1255 | ω independent of `a` (M-02) | S3 |
| E-07 | blackhole | fallback:671 + registry ranges | unguarded 1/√(1−rs/r); probe may orbit below the horizon (M-01) | S3 |
| E-08 | graph | engine:700-704 | telemetry is layout-only (`averageSpeed`); **no giant-component metric** — the sim's stated purpose ("discover structural giant components", phase transition p ≈ 1/n) is unmeasured; `averageSpeed` is a graph-layout value, not a network statistic | S2 |
| E-09 | immune | engine:582-585 | `wbcUnits` is constant (param count); WBCs never die or replicate — honest, but registry equation's k·P·WBC coupling is only one-directional (P ↓ only) | S1 |
| E-10 | bacteria | engine:466-478 | growth only (no death); fine for logistic teaching — but `growthRate` telemetry = temperature factor, not dN/dt (interpretive mismatch with the name) | S1 |
| E-11 | engine `default:` draw branch (1326-1388) | **dead code** — all 17 interactive ids have dedicated cases; the generic Lissajous renders nothing reachable via the runner | S1 (dead) |
| E-12 | virus `distSq < 80` / immune `< 10` / probability distance rules | contact radii and threshold 80, 10, 48 are hardcoded pixel constants | documented, negligible |
| E-13 | virus | particles infected **during** the same pass are double/mis-counted within one frame (stale compartment counts transient up to one frame) | S1 (informational) |

**Commendations (Phase 6 negative results):** no hardcoded values masquerading as science in relativity/wave/uncertainty/functions/probability; timing is frame-rate independent (S-03, tested); reset returns to clean state and restart-vs-reset parity is tested; immune/graph/probability rebuild their particle databases on the correct parameter change (partial — virus gap is E-03).

---

## 9. Visualization Findings

Classification per simulation. **Quantitatively faithful** = visual ∝ computed quantity; **Qualitatively faithful** = correct qualitative response to parameters; **Conceptual only** = honest schematic (badge present); **Misleading** = claimed model behavior cannot be observed or parameters produce inverted/dead responses; **Incorrect** = visual violates the taught law.

| id | class | notes |
|---|---|---|
| relativity | Quantitatively faithful | clocks 1/γ, length 1/γ, γ label; verified numbers |
| motion | Qualitatively faithful | box accelerates; friction threshold visible; force arrow ∝ F; telemetry velocity scale arbitrary |
| gravity | Qualitatively faithful | orbit size ∝ R, speed ∝ √(M/R); but "centripetal orbital vectors" from description are not drawn |
| pendulum | Misleading | L controls amplitude (should control period); g controls frequency (right direction); no pendulum bob; T ∝ √L inverted → **key relationship mis-taught by the visual** |
| thermodynamics | Conceptual only | T→amp, V→cycles weak metaphor; P never shown |
| optics | Misleading | angle₁ no-op; no ray, no boundary, no TIR; index→cycles metaphor |
| wave_interference | Misleading | d→cycles **inverted** (d↑ should compress fringes); no two-slit pattern at all |
| electrostatics | Misleading | distance no-op; no charges/vectors; force not visualized |
| bacteria | Quantitatively faithful | dot count = floor(population), dish-filling growth visible |
| virus | Quantitatively faithful | particle colors = compartments; counts = real |
| immune | Quantitatively faithful | pathogens disappear on contact; WBC steering visible |
| genetics | Conceptual only | no Punnett grid (description implies distribution; acceptable as concept) |
| photosynthesis | Conceptual only | wave metaphor neutral; nothing shows Rate response |
| enzymes | Conceptual only | no saturation curve (the core MM teaching visual absent) |
| osmosis | Conceptual only | no membrane/flow visualization; action text wrong (M-… §5) |
| ecosystem | Misleading | generic wave mislabeled with prey/predator counts; no oscillation (S3-03) |
| heart | Qualitatively faithful | HR→pulse rate ✓; SV→opacity (wishy-washy 0.15–0.26); **CO never displayed** |
| neural | Misleading | pulse speed ∝ myelin ✓ but stimulus dead; saltatory nodes not rendered as nodes |
| blood | Qualitatively faithful | parabolic flow profile correct (r² centerline); but Q ∝ r⁴ never shown ("flow rates drop" claim un-observable) |
| nephron | Conceptual only | no glomerulus; GFR value not displayed |
| pulmonary | Conceptual only | no O₂ diffusion visual; rate not displayed |
| muscle | Conceptual only | no sarcomere; force not displayed |
| endocrine | Conceptual only | no glucose trajectory; loop not visible |
| bone | Conceptual only | no bone/deposit visual |
| functions | Quantitatively faithful | exact f(x) plot |
| probability | Quantitatively faithful | true Galton board; bins → Gaussian |
| graph | Qualitatively faithful | clusters visually emerge; **no component metric** |
| chaos | Misleading | claims attractor trajectories; wave only |
| fractal | Misleading | claims set rendering; wave only |
| fourier | Misleading | claims square/triangle/sawtooth synthesis; single-wave only |
| calculus | Misleading | claims rectangle summation; wave only (no rectangles) |
| fibonacci | Misleading | claims logarithmic spiral; wave only |
| wave | Quantitatively faithful | ψ nodes correct, √(2/L) normalization, animated |
| uncertainty | Quantitatively faithful | envelope vs oscillation freq inverse relation correct |
| tunneling | Conceptual only | no barrier/decay plot; T value not shown |
| spin | Conceptual only | no Bloch sphere |
| entanglement | Conceptual only | no correlation curve |
| hydrogen | Conceptual only | no orbit shells |
| harmonic | Conceptual only | no Hermite profiles |
| superposition | Conceptual only | no collapse demonstration; slider semantics wrong (M-06) |
| orbit | **Incorrect** | visual ω ignores a — Kepler's law visibly violated (S3-02) |
| blackhole | Qualitatively faithful | rs ∝ M, probe red inside 2.2 rs; redshift "measurement" absent; NaN in interpretation (S3-01) |
| stellar | Conceptual only | static color/size bins; "timeline" implies evolution — none |
| cosmology | Misleading | no distance axis; no linear v–d plot |
| nebula | Conceptual only | no collapse threshold rendering |
| tides | Conceptual only | no bulge rendering |
| magnetosphere | Conceptual only | no field lines/standoff boundary |
| pulsar | Conceptual only | no beam sweep |

Summary: **Quantitatively faithful 9 · Qualitatively faithful 7 · Conceptual only 15 · Misleading 15 · Incorrect 1** (48 total; orbit = Incorrect, pendulum/optics/wave_interference/electrostatics/ecosystem/neural/chaos/fractal/fourier/calculus/fibonacci/cosmology counted under Misleading).

---

## 10. Telemetry Findings

| # | sim | snapshot fields | verdict |
|---|---|---|---|
| T-01 | motion | acceleration, velocity, frictionalForce | values finite & consistent; velocity/acceleration unitless (U-01) |
| T-02 | bacteria | population, growthRate | population honest; `growthRate` is the temperature factor not dN/dt (E-10) |
| T-03 | virus | susceptible, infected, recovered, r0 | honest; r0 = β/γ matches registry; one-frame counting lag (E-13) |
| T-04 | immune | pathogensRemaining, wbcUnits | both exact counts; wbcUnits static (E-09) |
| T-05 | probability | beadsSettled | exact count of completed beads ✓ |
| T-06 | graph | nodeCount, averageSpeed | exact; but averageSpeed is layout motion, not network science (E-08) |
| T-07 | 11 parameterized | `{visualizationState:{animationPhase}}` | honest (no fake measurement) — but the canvas computes real values it never exposes: heart CO, blood Q, orbit period, blackhole rs/redshift, wave ψ, uncertainty Δp·Δx, stellar remnant, relativity γ, gravity v, functions y, neural speed |
| T-08 | 31 conceptual | none (HUD readouts only) | readouts are waveform meta (Amplitude×, Frequency, Phase rad, raw params) — **not model quantities** |
| T-09 | history restore | parameters restored into engine; **dynamic state not restored** (population/particles continue from live engine) | documented P1 behavior; acceptable (params are the contract) |

The brief asks whether telemetry exposes enough for interpretation/assessment/restoration: dynamic sims yes; parameterized sims rely on `parameters` + equation (interpretation computes from params — adequate); the 11 parameterized canvases silently discard their own computed science (T-07) — recommended derived-readout exposure in P3.6.

---

## 11. AI / Assessment Findings

### Deterministic interpreter (48/48 branches — exhaustive, and each branch's math was re-run)
Correct outputs verified: relativity γ, pendulum T, thermodynamics P, optics θ₂, genetics p²/2pq/q², heart CO, wave ψ nodes, uncertainty Δp=1/Δx, spin Bloch form, hydrogen rₙ, harmonic Eₙ, nebula M_J, tides 1/d³, stellar remnants, pulsar narrative, functions f(x), probability CLT, chaos ρ narrative, fractal narrative, ecology… (all cross-checked in §4/§5).

Errors in the interpreter corpus: **M-01** (NaN), **M-03** (orbit period units), **M-04** (fringe µm), **M-05** (Coulomb N), **M-10** (cosmology d:=H₀), **M-11** (Bell claim), **M-08** (500 bead action), **osmosis action** (swell-vs-water-direction), **bacteria "death phase" claim** (the engine cannot produce it — E-10; explanation text asserts Lag→Log→Stationary→**Death** phases and an action invites "witness … Lag phase", neither exists in runtime), **immune "pathogen replication"** (no growth term).

### Spark LLM path
- The user prompt (`route.ts:225-267`) supplies `domain, stateSnapshot, stateType, simulationTime, parameters` — **but not `simulationId`, the registry name, or the registry equation**. The LLM must infer the lab from parameter keys; for single/short parameter sets (e.g. `{spiralScale: 4}`) this is guesswork, and generic explanations ("explain results clearly") reward fabrication. The system prompt forbids calculation, so the LLM neither computes nor is told what it is computing. Recommend injecting identity (+ the registry equation string) — P3.6.
- LLM output provenance is honestly labeled (`metadata.source`), and the fallback is used correctly per reason (missing key/timeout/provider error) — verified in the P3 data-integrity report.
- Streamed/persisted metadata agree (single construction point `buildAssessmentMetadata`).

### Assessment dependency
`SimulationRun` persistence carries parameters + snapshot + interpretation; the P3 data-integrity audit proved every persisted record is registry-coherent currently. No assessment-side science change is needed here beyond the interpreter corrections and prompt enrichment above.

---

## 12. Educational Findings

Class per brief (learning objective → manipulation → observable change → relationship → interpretation):

**Strong educational model (manipulation produces the taught relationship):**
`relativity` (v→γ/contraction/dilation), `virus` (β/γ→R₀ vs outcome), `motion` (F/m/μ→a, threshold), `functions`, `probability` (N→CLT convergence), `wave` (n/L→nodes/energy), `uncertainty` (Δx↔Δp), `bacteria` (T→rate, K→cap), `gravity` (M/R→orbit), `heart` (HR/SV→rate/CO via interpretation).

**Good but simplified:** `immune`, `blood`, `thermodynamics`, `genetics`, `hydrogen`, `harmonic`, `stellar`, `tides`, `nebula`, `pulmonary`, `nephron`, `enzymes`, `photosynthesis`, `bone`, `endocrine`, `muscle`, `tunneling`, `spin`, `entanglement`, `graph` (visual emergence; metric missing).

**Weak educational model (the intended concept is not observable):** `chaos` (no sensitivity/attractor), `fractal` (no set), `fourier` (no synthesis), `calculus` (no rectangles), `fibonacci` (no spiral), `cosmology` (no distance–velocity), `magnetosphere` (no standoff), `pulsar` (no beam), `osmosis` (no membrane dynamics), `superposition` (no collapse; wrong slider semantics), `optics` (no ray), `wave_interference` (no fringes), `electrostatics` (no force), `ecosystem` (no oscillation), `pendulum` (period not taught by visual), `blackhole` (redshift not measured; NaN text), `orbit` (period not taught by visual), `neural` (stimulus dead).

**Misleading / Scientifically incorrect:** `ecosystem` (claims dynamics that cannot occur — LV un-implemented), `orbit` (visual violates Kepler), `blackhole` (NaN default output; inside-horizon probes), `pendulum` (visual inverts L/T relationship), `osmosis` (action text physics reversed).

---

## 13. Severity Classification

### Counts: **S0 = 6 · S1 = 24 · S2 = 15 · S3 = 3 · S4 = 0**

| id | S | reason |
|---|---|---|
| relativity | S0 | verified correct |
| virus | S0 | verified correct |
| functions | S0 | verified correct |
| probability | S0 | verified correct |
| wave | S0 | verified correct |
| uncertainty | S0 | verified correct |
| motion | S1 | calibration constants; asymmetric braking (M-07 lives at S2 — see below) |
| gravity | S1 | G_eff mismatch engine/fallback |
| thermodynamics | S1 | visual metaphor loose; fallback math correct |
| bacteria | S2 | death/lag claims not producible (E-10) |
| immune | S1 | no growth term; static WBC units |
| genetics | S1 | math right; Punnett visual absent |
| photosynthesis | S1 | units flagged; saturation absent |
| enzymes | S1 | Vmax≡[E] fold; visual absent |
| osmosis | S2 | action text physics reversed |
| ecosystem | **S3 → resolved (P3.1)** | LV now implemented in HUD (S3-03) |
| heart | S1 | CO never displayed; SV opacity weak |
| neural | S2 | stimulus dead (E-01) |
| blood | S1 | Q ∝ r⁴ not visualized; unsupported "mL/sec" |
| nephron | S1 | π_g dropped; label/quantity mismatch |
| pulmonary | S1 | correct form; visual absent |
| muscle | S1 | equation ≠ implementation (both generic) |
| endocrine | S1 | qualitative only |
| bone | S1 | correct form; visual absent |
| graph | S2 | giant-component claim unmeasured (E-08) |
| chaos | S2 | attractor claim unimplementable |
| fractal | S2 | set claim unimplementable |
| fourier | S2 | synthesis claim unimplementable |
| calculus | S2 | rectangles claim unimplementable |
| fibonacci | S1 | φ correct; spiral absent (claim-weak, S1) |
| pendulum | S2 | visual inverts L/T (V-…) |
| optics | S2 | angle₁ dead; TIR unmet |
| wave_interference | S2 | d inverted; fringes absent; µm error (M-04) |
| electrostatics | S2 | distance dead; N error (M-05) |
| tunneling | S1 | width absent; T=1 above barrier (M-09) |
| spin | S1 | correct form; sphere absent |
| entanglement | S1 | cos2θ correct; Bell claim off (M-11) |
| hydrogen | S1 | correct; visual absent |
| harmonic | S1 | correct; visual absent |
| superposition | S2 | amplitude/probability label (M-06) |
| orbit | **S3 → resolved (P3.1)** | visual ω(a) now Keplerian (S3-02) |
| blackhole | **S3 → resolved (P3.1)** | in-horizon guard + scoped ranges (S3-01) |
| stellar | S1 | bins consistent; no timeline |
| cosmology | S2 | no distance axis; d:=H₀ (M-10) |
| nebula | S1 | correct form; visual absent |
| tides | S1 | correct form; visual absent |
| magnetosphere | S2 | wind dead in law (P-06) |
| pulsar | S1 | narrative fine; beam absent |

### Evidence for every S2+ (as required)

- **S3-01 blackhole.** Fallback:671 computes `1/Math.sqrt(1 − rsRatio)` with rs = 2.95·M (km), r = probeDistance (km). Registry ranges M ∈ [5,30], r ∈ [12,40]. Execution over the full grid: 628/754 combos have rs ≥ r ⇒ NaN, **including every default (M=10, r=22 → rs/r = 1.341 → NaN)**. Default run → interpretation contains "NaNx time dilation". Physically, circular orbits below r = 3·rs (ISCO) and below 1.5·rs (photon sphere) do not exist; probes at r < rs are inside the horizon and cannot "report" redshift. Fix: clamp/guard the formula, express redshift only for r > rs (use proper geodesic factors), tighten probeDistance floor to rs-scaled value, or explicitly scope the parameter space. Changes output text for every in-horizon configuration; no schema change.
- **S3-02 orbit.** Engine:1255 `theta = t * (Math.sqrt(sm) * 0.0018)` — no `a` term. Verification run: ω(a=4, M=120) = ω(a=18, M=120) = 0.0197; Kepler ω = √(GM/a³) differs 9.55×. The simulation's stated purpose is "Kepler's harmonic proportional laws"; the visual contradicts them. Fallback text is correct (T = 2π√(r³/0.667M)). Fix: sweep θ at ω = k·√(M/a³) (visual behavior changes; telemetry unchanged).
- **S3-03 ecosystem.** Registry:823-834 declares LV; no runtime layer implements integration; engine never sees this id (conceptual); HUD draws `ampA·sin(u+phase) + ampB·cos(1.7u − phase·0.6)` with prey→amp, predator→cycles; fallback narrates "populations settle into coupled oscillations". No oscillation, no boom–bust, no coupling is producible. Fix options in P3.1: (a) implement a two-curve LV integrator in the HUD for this id (small, self-contained); (b) revise description/equation to "parametric schematic". Both change user-facing claims; (a) adds scientific value with a regression test (bounded, out-of-phase cycles).
- **M-07 motion (S2 component).** Engine:440 clamps `F_net ≥ 0` and brakes only when `force === 0` (:446-448). Consequence: for 0 < F < μmg and v > 0 the body coasts at constant v forever; friction "disappears" while thrust is below threshold. Physically kinetic friction opposes motion whenever v > 0 (and should slow the body); static threshold applies at v = 0. Test to add: body set in motion with F < μmg must decelerate to rest deterministically.
- **S2 claims group (chaos, fractal, fourier, calculus, graph, cosmology, magnetosphere, pendulum, optics, wave_interference, electrostatics, superposition, neural, bacteria, osmosis).** Each has a description/AI claim its runtime cannot produce (enumerated per row in §9/§11). The "Conceptual Data Telemetry" badge is honest about abstraction; the descriptions and interpretation prose are not honest about the limits.

---

## 14. Cross-Simulation Patterns

- **P-1 — The 31-wave class.** All non-interactive sims render the identical two-sine waveform; scientific distinctiveness exists only in the description, the equation string, and the interpreter prose. Readouts are waveform meta; no model quantity is ever shown. This is the dominant pattern (drives ~16 S2s).
- **P-2 — First-two-parameter rule.** The HUD consumes only `specs[0]` (amplitude ∝ norm) and `specs[1]` (cycles ∝ norm). Every third+ parameter (optics angle₁, electrostatics distance) is invisible in the runtime (E-02).
- **P-3 — Claim-vs-runtime gap.** Descriptions and fallback prose assert behaviors the runtime cannot exhibit (death phase, LV oscillations, attractors, fringes, rectangles, beams, standoff, collapse).
- **P-4 — Hidden-constant divergence.** Engine and fallback use different normalized G for the same orbital sim (gravity 0.5 vs 0.667); orbit labels normalized output with SI units.
- **P-5 — Displayed-equation drift.** Several registry equation strings are not the math anywhere in the runtime (muscle F = F₀(1−v/v_max) vs Ca·ATP·0.4; immune dP/dt vs contact kills; magnetosphere B^{1/3} without wind; tunneling with absent `a`). For parameterized HUD sims the equation is a *specification*, not an *implementation* — this must be disclosed per sim (P3.6).
- **P-6 — Label/quantity drift.** superposition weight-vs-amplitude; nephron resistance-vs-pressure; photosynthesis lux-as-flux (P-02/P-10/U-04).
- **P-7 — Unguarded normalized formulas.** Deep math on dimensionless constants is asserted without range guards → the NaN class (M-01). Registry ranges are the only guard and they permit the impossible combos.
- **P-8 — Dead-code surface.** Engine default draw branch (Lissajous) is unreachable; interpret route relative `stateSnapshot` for conceptual is `{visualizationState:'conceptual'}` while the engine dead-branch would have emitted a wave — harmless but confirms the default branch is vestigial.

---

## 15. Recommended Fixes (no code changed in this pass)

| # | sim(s) | file(s) | fix | changes behavior | tests |
|---|---|---|---|---|---|
| RF-1 | blackhole | `deterministic-fallback.ts`; `registry.ts` (probeDistance floor) | guard redshift for r > rs (use exact geodesic time dilation); when r ≤ rs emit explicit "inside event horizon" semantics or clamp input range | yes (all in-horizon configs) | sweep no-NaN; default combo → defined value |
| RF-2 | orbit | `simulation-engine.ts` orbit case | ω = k·√(M/a³) so T ∝ a^{3/2} | yes (animation) | ω ratio test; no telemetry change |
| RF-3 | ecosystem | `conceptual-telemetry-hud.tsx` (LV curves for this id) OR `registry.ts` description | implement two-curve LV integrator with phase-shifted bounded cycles; or demote claims | yes (visual/claims) | boundedness; out-of-phase; poixture conservation |
| RF-4 | superposition | `deterministic-fallback.ts` + `registry.ts` label | align: slider = P(\|0⟩), α = √(p/100); or relabel to "Amplitude α (%)" | yes (interpretation + label) | α² = p at 3 points |
| RF-5 | motion | `simulation-engine.ts` | kinetic braking whenever v > 0 and F < μmg; keep static threshold at rest | yes (physics) | coast-to-rest test; threshold preserved |
| RF-6 | neural | `simulation-engine.ts` (or drop) | give stimulusStrength a role (pulse intensity/size) or move it to registry metadata as visual-only; at minimum document | yes/no | slider effect test |
| RF-7 | wave_interference, electrostatics, optics | `deterministic-fallback.ts` | fix fringe units (×1000), Coulomb magnitude (×10 w/ correct k), keep TIR clamp; add model-derived readouts to HUD (P3.5) | yes (text) | numeric assertions |
| RF-8 | graph | `simulation-engine.ts` | add largest-connected-component size to telemetry (BFS on edge set; additive field) | no (additive) | p=0 → 1; p=1 → n |
| RF-9 | interpret prompt | `app/api/simulations/interpret/route.ts` | inject `simulationId`, registry name + equation into user prompt | yes (LLM path) | prompt-content contract test |
| RF-10 | fallback text | `deterministic-fallback.ts` | remove unimplementable claims (death phase, LV cycles, Bell-aligned violation, "500 beads", osmosis swap, cosmology d:=H₀, magnetosphere wind) | yes (text) | text-content assertions |
| RF-11 | tunneling | `registry.ts` + fallback | add barrier width parameter (registry addition, no sim added) or state a≡1 in the equation string | yes (API adds a param) | width sensitivity test |
| RF-12 | HUD 3-param sims | `conceptual-telemetry-hud.tsx` | use all params (angle₁, distance can modulate phase/cycles) | yes (visual) | param-effect tests |
| RF-13 | parameterized sims | engine/HUD | expose derived values (CO, Q, T, rs, γ…) as readouts (T-07) | yes (readouts) | value-equivalence tests |
| RF-14 | hygiene | registry | add missing `unit`/`description` fields; fix labels (superposition, nephron, magnetosphere) | additive only | schema tests |

---

## 16. Required Tests — P3 Scientific Contract Strategy

New suites (proposed files; none written in this pass):

1. **Formula tests** (`fallback-formulas.test.ts`) — 48-branch numeric assertions: γ(v) at 3 v; T(L,g) ratio √L; P(T,V) linear-in-T inverse-in-V; θ₂(Snell); CO=HR·SV/1000; rₙ=n²·0.529; Eₙ=n+0.5; M_J=T^1.5/√ρ; tide 1/d³; v=√(G_eff·M/r) both layers **with one shared constant**; LV after RF-3.
2. **Boundary tests** — registry min/max for all 48 (exists); engine at boundaries (r=2cm Coulomb after fix; L=2m pendulum; V=2L; T=600K; speed=0.99 → γ=7.09).
3. **Unit/scale tests where deterministic** — fringe 45.8 mm; Coulomb 359.6 N; orbit period 2.89 yr-scale; kPa values.
4. **Parameter sensitivity tests** — monotone: γ(v)↑; P∝T; P∝1/V; T∝√L; Q∝r⁴ (fallback); CO∝HR and ∝SV.
5. **Invariant tests** — superposition α²+β²=1 (any slider); Hardy–Weinberg p²+2pq+q²=1 (all p); SIR S+I+R = N (engine, every frame); Gaussian bins sum = settled (engine).
6. **Conservation/monotonicity** — bacteria → K from below (engine); motion coast-to-rest after M-07 fix; SIR infected peak ≤ N.
7. **Range-safety tests** — every fallback formula evaluated over its full registry grid ⇒ no NaN/Inf (this test catches M-01 class: sweep would have failed today); physics: probe ≥ ISCO, E ≤ V₀ tunneling, etc.
8. **NaN/Infinity protection** — direct: grid-sweep harness over all 48 sims × all param combos (discrete grid) asserting every produced text number is finite.
9. **Visualization-output consistency where practical** — deterministic draw hooks: gravity v_calc constants equal fallback's; orbit ω(a) ratio test (after RF-2); wave ψ node count = n; uncertainty packet width ∝ dx.
10. **Telemetry consistency** — engine snapshot numeric invariants (dynamic 6: finite, in-range, integer integrity); growthRate semantics; graph component metric after RF-8.

Existing suites that already protect architecture: R (48/6/8, param integrity), C (projection/NL whitelist/reset), E (state contracts, S-03/S-04), F (48-branch presence — but not numeric), N/S (NL bounds), A (data-integrity classifier). **Gap:** F tests assert content presence, not numeric correctness — hence 1–3 above.

---

## 17. Deferred Issues (explicitly out of this pass)

- Full per-model HUD renderers (Lorenz surface, Mandelbrot engine, real Bloch sphere, two-slit intensity plot, Riemann rectangles, spiral geometry). P4 candidates; promise significant visual work with engine-like complexity.
- Adding a distance parameter to `cosmology` (registry change affects API payload; requires contract review).
- Unifying G_eff for gravity/orbit into one exported constant (P3.4 hardens it; the recommendation is a shared `GRAVITY_NORMALIZED` const in `engine-constants.ts` consumed by both layers).
- LLM-path scientific grounding (stronger prompts, allowed-tool callouts) — touches AI behavior, needs product decision.
- Restoring dynamic engine state on history load (behavior change to P1 contract — explicitly preserved).
- Merging the knowledge-engine `ScientificDomain` taxonomy (P2 scope boundary).

---

## 18. P3 Implementation Plan (prioritized; gate after P3.1 = YELLOW)

### P3.1 — Critical Scientific Corrections (S3) ✅ implemented (see log after §1)
- **blackhole (RF-1):** ✅ guard + range tightening; `deterministic-fallback.ts`, `registry.ts`, `simulation-engine.ts`; tests: `fallback-formulas.test.ts` (§16-7/8 sweep).
- **orbit (RF-2):** ✅ ω = k·√(M/a³); `simulation-engine.ts`; tests: orbit ω ratio block in `simulation-engine.test.ts` (§16-9).
- **ecosystem (RF-3):** ✅ LV integrator in HUD for this id; `lotka-volterra.ts`, `conceptual-telemetry-hud.tsx`; tests: `lotka-volterra.test.ts` (§16-1/6).

### P3.2 — Mathematical Corrections
- motion braking (RF-5); `simulation-engine.ts`; tests §16-6.
- superposition semantics (RF-4); `registry.ts` (+ fallback); API payload changes label only.
- tunneling width (RF-11); registry addition (new parameter, no new sim).

### P3.3 — Unit/Parameter Corrections
- RF-7 (fringe/Coulomb units), RF-14 (units + labels + descriptions across registry), nephron/magnetosphere labels.

### P3.4 — Engine Corrections
- virus populationSize live-reseed (E-03); `simulation-engine.ts:updateParameter`.
- neural stimulus role (RF-6); engine + HUD.
- shared normalized-G constant (gravity/orbit); `engine-constants.ts` + both consumers.

### P3.5 — Visualization Fidelity
- HUD 3-param support (RF-12); pendulum/g-sense mapping correction; derived readouts for parameterized canvases (RF-13); optional ecosystem LV (if not in P3.1).

### P3.6 — Telemetry/AI Corrections
- interpret prompt enrichment (RF-9); fallback prose corrections (RF-10); graph giant-component telemetry (RF-8).

### P3.7 — Regression Tests
- §16 suites 1–10; keep all 153 existing tests green (135 P2/audit + 18 landed with P3.1).

### P3.8 — Documentation
- update `docs/simulation-architecture.md`; severity ledger appendix; equation/implementation disclosure table (P-5).

Each task above lists: exact files ✓, exact simulation ids ✓, expected behavior ✓, risk ✓, tests ✓, compatibility impact ✓.

---

## 19. P4 Risks

- Implementing per-model HUD renderers (P3.5/P4) increases the surface the data-integrity audit must cover — snapshot/telemetry contracts must stay generic.
- Telemetry additions (graph component metric; derived readouts) grow persisted snapshots — additive fields only, no renames (P2 guarantee).
- LLM prompt enrichment raises hallucination surface; requires the structured-output validation pipeline already in place (schemas.ts) and content tests.
- Registry parameter additions (tunneling width) ripple into the NL prompt and payload — protected by registry-driven derivation (no new literals).
- P3.1 fixes are applied and the planned tests landed — visual baselines changed (orbit/pendulum/ecosystem) as designed; the new tests pin the Kepler and LV relationships.
- The gate was revisited after P3.1: RED → YELLOW (all three S3s closed); GREEN only after the full §16 suite + P3.2–P3.6 land.

---

## 20. Final Assessment

| Question | Answer |
|---|---|
| Is every simulation scientifically valid? | **Yes for the 3 S3s after P3.1** — gate YELLOW; S2 cluster + §16 full-suite + P3.2–P3.6 remain |
| Is the architecture trustworthy? | Yes — registry/state-contract/validation layers are correct and honest |
| Is P3 consistent with "audit first"? | Yes — zero production code changed in the audit pass; P3.1 landed only after authorization |
| Severity counts | Audit: S0 6 · S1 24 · S2 15 · S3 3 · S4 0 → **post-P3.1: S0 6 · S1 24 · S2 15 · S3 0 · S4 0** |
| Gate | Audit: **RED** (any S3) → **post-P3.1: YELLOW** (0 S3; §16-1/6/7/8/9 suites landed with the fixes) |
| Validation baseline | 153/153 tests (135 + 18 P3.1) · `tsc` clean · `pnpm build` clean · ESLint clean on all touched P3 files |
| Database | untouched (`1` live `simulationruns` record, VALID per the P3 data-integrity report) |
| Path to GREEN | land the full §16 suite (suites 2–5, 10) + P3.2–P3.6 → GREEN |

**Bottom line.** P2 proved the system is *consistently built*. P3 proves it is *not yet scientifically trustworthy in three places* (`blackhole` default NaN, `orbit` Kepler-violating animation, `ecosystem` unimplemented dynamics), with a broad S2 tail driven by claims the runtime cannot make (the 31-wave presentation class). Nothing here requires an architectural redesign, schema change, or new simulations — the fixes are targeted and testable, and become safe only after this report's sign-off, per the mission's implementation gate.

---

*Companions: `docs/p2-contract-consolidation-report.md` · `docs/simulation-architecture.md` · `docs/p3-simulation-data-integrity-report.md`*