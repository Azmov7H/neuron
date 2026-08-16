// @vitest-environment jsdom
/**
 * SimulationEngine contract tests.
 * Canvas rendering is stubbed — these tests verify state transitions
 * (initialization, parameter application, reset, pause/run, deterministic
 * physics) rather than pixel output.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SimulationEngine, computeOrbitAngularVelocity } from '../simulation-engine';
import { INTERACTIVE_SIM_IDS } from '@/lib/simulation/registry';
import { SIMULATION_STATE_TYPES, getSimulationStateType } from '../simulation-state';
import type { TelemetrySnapshot } from '../simulation.types';

// jsdom does not implement requestAnimationFrame; the engine only needs it to
// schedule the next frame, which tests cancel again via stop().
if (typeof globalThis.requestAnimationFrame === 'undefined') {
  (globalThis as unknown as { requestAnimationFrame: (cb: FrameRequestCallback) => number }).requestAnimationFrame = (
    cb: FrameRequestCallback
  ): number => setTimeout(() => cb(performance.now()), 16) as unknown as number;
  (globalThis as unknown as { cancelAnimationFrame: (id: number) => void }).cancelAnimationFrame = (
    id: number
  ): void => clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
}

function makeContext2DStub(): CanvasRenderingContext2D {
  const gradient = { addColorStop: vi.fn() };
  return {
    save: vi.fn(),
    restore: vi.fn(),
    scale: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    drawImage: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    bezierCurveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    clearRect: vi.fn(),
    fillText: vi.fn(),
    strokeText: vi.fn(),
    setLineDash: vi.fn(),
    ellipse: vi.fn(),
    closePath: vi.fn(),
    clip: vi.fn(),
    setTransform: vi.fn(),
    resetTransform: vi.fn(),
    createRadialGradient: vi.fn(() => gradient),
    createLinearGradient: vi.fn(() => gradient),
    createPattern: vi.fn(() => null),
    measureText: vi.fn(() => ({ width: 0 })),
  } as unknown as CanvasRenderingContext2D;
}

function makeCanvasStub(): HTMLCanvasElement {
  return {
    clientWidth: 760,
    clientHeight: 480,
    width: 0,
    height: 0,
    getContext: vi.fn(() => makeContext2DStub()),
  } as unknown as HTMLCanvasElement;
}

// The engine lazily creates its own background canvas via
// document.createElement('canvas') — route those to the same stub so
// getContext never returns null under jsdom.
const originalCreateElement = document.createElement.bind(document);
document.createElement = ((tag: string, options?: ElementCreationOptions) =>
  tag.toLowerCase() === 'canvas'
    ? (makeCanvasStub() as unknown as HTMLElement)
    : originalCreateElement(tag, options)) as typeof document.createElement;

function makeEngine(simId: string, domain: string, params: Record<string, number> = {}) {
  return new SimulationEngine(makeCanvasStub(), domain, simId, params, () => {});
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('SimulationEngine — initial state', () => {
  it('starts with zero time, the provided parameters, and empty state', () => {
    const engine = makeEngine('relativity', 'physics', { speed: 0.9 });
    expect(engine.timeStep).toBe(0);
    expect(engine.isRunning).toBe(true);
    expect(engine.parameters).toEqual({ speed: 0.9 });
    expect(engine.stateSnapshot).toEqual({});
  });

  it('applies parameter updates to engine state', () => {
    const engine = makeEngine('motion', 'physics', { force: 15, mass: 5, friction: 0.2 });
    engine.updateParameter('force', 30);
    expect(engine.parameters.force).toBe(30);
    expect(engine.parameters.mass).toBe(5);
  });
});

describe('SimulationEngine — deterministic transitions', () => {
  it('computes deterministic motion physics (F=ma with friction)', () => {
    const engine = makeEngine('motion', 'physics', { force: 15, mass: 5, friction: 0.2 });
    engine.start(); // one synchronous frame
    const snap = engine.stateSnapshot as { acceleration: number; velocity: number };
    // F_net = 15 - 0.2*5*9.8 = 5.2 N → a = 1.04; boxVel += a*0.03*dt (dt = 1).
    // Telemetry reports the actual box velocity (MEAS-04), not a scaled copy.
    expect(snap.acceleration).toBeCloseTo(1.04, 9);
    expect(snap.velocity).toBeCloseTo(0.0312, 9);
    engine.stop();
  });

  it('grows the bacteria colony deterministically from its initial population', () => {
    const engine = makeEngine('bacteria', 'biology', { temperature: 37, nutrientLevel: 6 });
    engine.start();
    const population = engine.stateSnapshot.population as number;
    // capacity = 6*40 = 240; growthConstant = 1 at 37°C; nextPop starts from 5
    expect(population).toBeGreaterThan(5);
    expect(population).toBeLessThan(5.3);
    engine.stop();
  });
});

describe('SimulationEngine — reset semantics', () => {
  it('returns time, state, and position to the clean initial state', () => {
    const engine = makeEngine('motion', 'physics', { force: 15, mass: 5, friction: 0.2 });
    engine.start();
    engine.stop();
    expect(engine.timeStep).toBe(1);

    engine.resetTime();
    expect(engine.timeStep).toBe(0);
    expect(engine.stateSnapshot).toEqual({});

    // After reset, one frame reproduces exactly the fresh-run physics.
    engine.isRunning = true;
    engine.start();
    engine.stop();
    expect(engine.timeStep).toBe(1);
    const snap = engine.stateSnapshot as { acceleration: number; velocity: number };
    expect(snap.acceleration).toBeCloseTo(1.04, 9);
    expect(snap.velocity).toBeCloseTo(0.0312, 9);
  });

  it('restores the bacteria population to its initial value (not the grown run)', () => {
    const engine = makeEngine('bacteria', 'biology', { temperature: 37, nutrientLevel: 6 });
    engine.start();
    engine.stop();
    const grown = engine.stateSnapshot.population as number;
    expect(grown).toBeGreaterThan(5);

    engine.resetTime();
    expect(engine.stateSnapshot).toEqual({});

    engine.isRunning = true;
    engine.start();
    engine.stop();
    const afterReset = engine.stateSnapshot.population as number;
    // A fresh run restarts from the initial population 5, so one frame after
    // reset must equal one frame after construction — not the grown value.
    expect(afterReset).toBeCloseTo(grown, 9);
  });

  it('applies updated parameters then resets to the clean configuration', () => {
    const engine = makeEngine('motion', 'physics', { force: 15, mass: 5, friction: 0.2 });
    engine.start();
    engine.stop();

    engine.updateParameter('force', 30);
    engine.isRunning = true;
    engine.start();
    engine.stop();
    expect((engine.stateSnapshot as { acceleration: number }).acceleration).toBeCloseTo(
      (30 - 0.2 * 5 * 9.8) / 5,
      9
    );

    engine.updateParameter('force', 15);
    engine.resetTime();
    engine.isRunning = true;
    engine.start();
    engine.stop();
    expect((engine.stateSnapshot as { acceleration: number }).acceleration).toBeCloseTo(1.04, 9);
  });
});

describe('SimulationEngine — pause/run behavior', () => {
  it('does not advance physics or time while paused', () => {
    const engine = makeEngine('motion', 'physics', { force: 15, mass: 5, friction: 0.2 });
    engine.isRunning = false;
    engine.start(); // frames run, physics is gated
    expect(engine.timeStep).toBe(0);
    expect(engine.stateSnapshot).toEqual({});
    engine.stop();

    engine.isRunning = true;
    engine.start();
    engine.stop();
    expect(engine.timeStep).toBe(1);
    expect((engine.stateSnapshot as { acceleration: number }).acceleration).toBeCloseTo(1.04, 9);
  });
});

describe('SimulationEngine — all interactive sims smoke test', () => {
  it('constructs, ticks, updates, and resets every interactive sim without throwing', () => {
    const domains: Record<string, string> = {
      relativity: 'physics', motion: 'physics', gravity: 'physics',
      bacteria: 'biology', virus: 'biology', immune: 'biology',
      heart: 'anatomy', neural: 'anatomy', blood: 'anatomy',
      functions: 'mathematics', probability: 'mathematics', graph: 'mathematics',
      wave: 'quantum', uncertainty: 'quantum',
      orbit: 'space', blackhole: 'space', stellar: 'space',
    };
    for (const simId of INTERACTIVE_SIM_IDS) {
      expect(() => {
        const engine = makeEngine(simId, domains[simId]);
        engine.start();
        engine.stop();
        engine.updateParameter('dummy', 1);
        engine.resetTime();
        engine.isRunning = true;
        engine.start();
        engine.stop();
        engine.destroy();
      }, `sim "${simId}" failed the lifecycle smoke test`).not.toThrow();
    }
  });
});

// ────────────────────────────────────────────────────────────────────────────
// P1 S-03: Delta-time physics — frame-rate independent simulation clock
// ────────────────────────────────────────────────────────────────────────────

function runPattern(simId: string, domain: string, frames: number, dtMs: number, params: Record<string, number> = {}) {
  const engine = new SimulationEngine(makeCanvasStub(), domain, simId, params, () => {});
  engine.advanceFrame(0); // establish a timestamp baseline (nominal first frame)
  let t = 0;
  for (let f = 0; f < frames; f++) {
    t += dtMs;
    engine.advanceFrame(t);
  }
  return engine;
}

describe('SimulationEngine — delta-time timing (S-03)', () => {
  it('produces equivalent simulation time at 60Hz and 120Hz over the same wall-clock span', () => {
    const at60 = runPattern('motion', 'physics', 240, 1000 / 60, { force: 15, mass: 5, friction: 0.2 });
    const at120 = runPattern('motion', 'physics', 480, 1000 / 120, { force: 15, mass: 5, friction: 0.2 });
    // 240 × 16⅔ ms == 480 × 8⅓ ms == 4 s of simulated time, plus the nominal
    // priming frame consumed once per engine (1/60 s)
    const expected = 4 + 1 / 60;
    expect(at60.simulationTime).toBeCloseTo(expected, 5);
    expect(at120.simulationTime).toBeCloseTo(expected, 5);
    expect(at120.simulationTime).toBeCloseTo(at60.simulationTime, 5);
    // Physics parity: identical deterministic endpoint for motion
    const s60 = at60.stateSnapshot as { velocity: number };
    const s120 = at120.stateSnapshot as { velocity: number };
    expect(s120.velocity).toBeCloseTo(s60.velocity, 5);
  });

  it('grows the bacteria colony at the same rate at 60Hz and 120Hz', () => {
    const at60 = runPattern('bacteria', 'biology', 240, 1000 / 60, { temperature: 37, nutrientLevel: 6 });
    const at120 = runPattern('bacteria', 'biology', 480, 1000 / 120, { temperature: 37, nutrientLevel: 6 });
    const p60 = at60.stateSnapshot.population as number;
    const p120 = at120.stateSnapshot.population as number;
    expect(p120).toBeCloseTo(p60, 2);
  });

  it('keeps irregular frame deltas stable (same total time = same final clock)', () => {
    const irregular = new SimulationEngine(makeCanvasStub(), 'physics', 'motion', { force: 15, mass: 5, friction: 0.2 }, () => {});
    irregular.advanceFrame(0);
    let t = 0;
    const pattern = [10, 25, 15, 30, 8];
    for (let i = 0; i < 80; i++) {
      t += pattern[i % pattern.length];
      irregular.advanceFrame(t);
    }
    // 80 × 17.6 ms = 1408 ms total (sum of pattern = 88 × 16) + nominal priming frame
    expect(irregular.simulationTime).toBeCloseTo(1.408 + 1 / 60, 4);
  });

  it('clamps minimum and maximum frame deltas', () => {
    const engine = new SimulationEngine(makeCanvasStub(), 'physics', 'motion', {}, () => {});
    engine.advanceFrame(0); // baseline
    engine.advanceFrame(3000); // 3 s gap → capped at 50 ms
    expect(engine.simulationTime).toBeCloseTo(16.67 / 1000 + 50 / 1000, 4);
    const before = engine.simulationTime;
    engine.advanceFrame(3001); // 1 ms gap → floored at 8 ms
    expect(engine.simulationTime).toBeCloseTo(before + 8 / 1000, 4);
  });

  it('normalizes the first frame to one nominal engine timestep', () => {
    const fresh = new SimulationEngine(makeCanvasStub(), 'physics', 'motion', {}, () => {});
    fresh.advanceFrame(1000); // arbitrary first timestamp
    expect(fresh.simulationTime).toBeCloseTo((1000 / 60) / 1000, 6);
    expect(fresh.timeStep).toBe(1);
    expect(fresh.frameCount).toBe(1);
  });

  it('starts with zeroed timing fields and the correct state contract', () => {
    const engine = makeEngine('relativity', 'physics', { speed: 0.5 });
    expect(engine.simulationTime).toBe(0);
    expect(engine.frameCount).toBe(0);
    expect(engine.deltaTime).toBe(0);
    expect(engine.timeStep).toBe(0);
    expect(engine.stateType).toBe('parameterized_visualization');
    expect(getSimulationStateType('relativity')).toBe('parameterized_visualization');
    expect(getSimulationStateType('unknown-slug')).toBe('conceptual');
  });
});

describe('SimulationEngine — pause/resume loop lifecycle (S-04)', () => {
  it('completely suspends physics, state, and telemetry while paused', () => {
    const snaps: TelemetrySnapshot[] = [];
    const engine = new SimulationEngine(makeCanvasStub(), 'physics', 'motion', { force: 15, mass: 5, friction: 0.2 }, (s) => snaps.push(s));
    let t = 0;
    for (let f = 0; f < 200; f++) { t += 1000 / 60; engine.advanceFrame(t); }
    expect(engine.timeStep).toBe(200);
    expect(snaps.length).toBeGreaterThan(0);

    const frozenTime = engine.simulationTime;
    const frozenState = { ...engine.stateSnapshot };
    const snapsAtPause = snaps.length;

    engine.pause();
    for (let f = 0; f < 300; f++) {
      t += 1000 / 60;
      engine.advanceFrame(t); // no-ops: paused engines never advance
    }
    expect(engine.timeStep).toBe(200);
    expect(engine.simulationTime).toBe(frozenTime);
    expect(engine.stateSnapshot).toEqual(frozenState);
    expect(snaps.length).toBe(snapsAtPause);
    engine.destroy();
  });

  it('resumes at the frozen time without absorbing the paused duration and without duplicate loops', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame');
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    const engine = new SimulationEngine(makeCanvasStub(), 'physics', 'motion', { force: 15, mass: 5, friction: 0.2 }, () => {});
    engine.start();
    expect(rafSpy).toHaveBeenCalledTimes(1);
    engine.start(); // already scheduled → no duplicate loop
    expect(rafSpy).toHaveBeenCalledTimes(1);

    engine.pause();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    const pausedTime = engine.simulationTime;

    engine.resume();
    engine.resume(); // second resume: loop already scheduled → no duplicate
    expect(rafSpy).toHaveBeenCalledTimes(2);

    // First resumed frame uses the safe nominal delta (no paused-time jump).
    engine.advanceFrame(5000);
    expect(engine.simulationTime).toBeCloseTo(pausedTime + (1000 / 60) / 1000, 6);

    engine.destroy();
  });

  it('never schedules a next frame while paused and cancels immediately', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame');
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    const engine = makeEngine('motion', 'physics', { force: 15, mass: 5, friction: 0.2 });
    engine.start();
    const scheduled = rafSpy.mock.calls.length;
    engine.pause();
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    engine.advanceFrame(100); // paused → no-op, no scheduling
    expect(rafSpy.mock.calls.length).toBe(scheduled);
    engine.destroy();
  });
});

describe('SimulationEngine — state contracts (S-07)', () => {
  const domains: Record<string, string> = {
    relativity: 'physics', motion: 'physics', gravity: 'physics',
    bacteria: 'biology', virus: 'biology', immune: 'biology',
    heart: 'anatomy', neural: 'anatomy', blood: 'anatomy',
    functions: 'mathematics', probability: 'mathematics', graph: 'mathematics',
    wave: 'quantum', uncertainty: 'quantum',
    orbit: 'space', blackhole: 'space', stellar: 'space',
  };
  const dynamics = ['motion', 'bacteria', 'virus', 'immune', 'probability', 'graph'];

  it('classifies every interactive sim with a valid state contract', () => {
    for (const simId of INTERACTIVE_SIM_IDS) {
      const engine = new SimulationEngine(makeCanvasStub(), domains[simId], simId, {}, () => {});
      engine.advanceFrame(1000);
      engine.advanceFrame(1017);
      expect(engine.stateType).toBe(SIMULATION_STATE_TYPES[simId]);
      expect(['dynamic', 'parameterized_visualization', 'conceptual']).toContain(engine.stateType);
      engine.destroy();
    }
  });

  it('emits real measured state for dynamic sims — never an empty snapshot', () => {
    for (const simId of dynamics) {
      const engine = new SimulationEngine(makeCanvasStub(), domains[simId], simId, {}, () => {});
      engine.advanceFrame(1000);
      engine.advanceFrame(1017);
      engine.advanceFrame(1034);
      const snap = engine.stateSnapshot;
      expect(Object.keys(snap).length, `dynamic sim "${simId}" must expose state`).toBeGreaterThan(0);
      for (const [key, value] of Object.entries(snap)) {
        expect(Number.isFinite(value as number), `"${simId}.${key}" must be finite`).toBe(true);
      }
      expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
      engine.destroy();
    }
  });

  it('emits explicit visualizationState for parameterized sims — no fabricated measurements', () => {
    for (const simId of INTERACTIVE_SIM_IDS) {
      if (dynamics.includes(simId)) continue;
      const engine = new SimulationEngine(makeCanvasStub(), domains[simId], simId, {}, () => {});
      engine.advanceFrame(1000);
      engine.advanceFrame(1017);
      const snap = engine.stateSnapshot as { visualizationState?: { animationPhase: number } };
      expect(snap.visualizationState, `parameterized sim "${simId}" must signal presentation state`).toBeDefined();
      expect(Number.isFinite(snap.visualizationState?.animationPhase)).toBe(true);
      expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
      engine.destroy();
    }
  });

  it('emits animationPhase advancing with simulationTime for parameterized sims', () => {
    const engine = new SimulationEngine(makeCanvasStub(), 'physics', 'relativity', { speed: 0.5 }, () => {});
    engine.advanceFrame(1000);
    const first = (engine.stateSnapshot as { visualizationState: { animationPhase: number } }).visualizationState.animationPhase;
    engine.advanceFrame(3017); // clamped 50 ms step
    const second = (engine.stateSnapshot as { visualizationState: { animationPhase: number } }).visualizationState.animationPhase;
    expect(second).toBeGreaterThan(first);
    engine.destroy();
  });

  it('reports real network metrics for the graph sim (nodeCount, averageSpeed)', () => {
    const engine = new SimulationEngine(makeCanvasStub(), 'mathematics', 'graph', { nodesCount: 12, connectionProbability: 0.2 }, () => {});
    engine.advanceFrame(1000);
    engine.advanceFrame(1017);
    const snap = engine.stateSnapshot as { nodeCount: number; averageSpeed: number };
    expect(snap.nodeCount).toBe(12);
    expect(snap.averageSpeed).toBeGreaterThan(0);
    engine.destroy();
  });
});

describe('SimulationEngine — reset/timing compatibility (S-03 reset contract)', () => {
  it('clears the full timing model back to the clean initial state', () => {
    const engine = new SimulationEngine(makeCanvasStub(), 'physics', 'motion', { force: 15, mass: 5, friction: 0.2 }, () => {});
    let t = 0;
    for (let f = 0; f < 300; f++) { t += 1000 / 60; engine.advanceFrame(t); }
    expect(engine.simulationTime).toBeGreaterThan(0);
    expect(engine.timeStep).toBeGreaterThan(0);

    engine.resetTime();
    expect(engine.simulationTime).toBe(0);
    expect(engine.frameCount).toBe(0);
    expect(engine.timeStep).toBe(0);
    expect(engine.deltaTime).toBe(0);
    expect(engine.previousTimestamp).toBeNull();
    expect(engine.stateSnapshot).toEqual({});
  });

  it('produces reset→execution parity with a fresh engine (timing and physics)', () => {
    const decorated = new SimulationEngine(makeCanvasStub(), 'physics', 'motion', { force: 15, mass: 5, friction: 0.2 }, () => {});
    let t = 0;
    for (let f = 0; f < 200; f++) { t += 1000 / 60; decorated.advanceFrame(t); }
    decorated.resetTime();
    expect(decorated.previousTimestamp).toBeNull();

    decorated.advanceFrame(1000); // first post-reset frame = nominal timestep
    const fresh = new SimulationEngine(makeCanvasStub(), 'physics', 'motion', { force: 15, mass: 5, friction: 0.2 }, () => {});
    fresh.advanceFrame(1000);

    expect(decorated.simulationTime).toBeCloseTo(fresh.simulationTime, 9);
    expect(decorated.stateSnapshot).toEqual(fresh.stateSnapshot);
    expect(decorated.timeStep).toBe(1);
    expect(fresh.timeStep).toBe(1);
  });
});

describe('orbit angular velocity (P3.1 — RF-2 Kepler ω(a))', () => {
  it('follows the Kepler proportionality ω ∝ √(M/a³)', () => {
    const m = 120;
    const omega = (a: number) => computeOrbitAngularVelocity(a, m);
    // ω(a1)/ω(a2) = (a2/a1)^(3/2) independent of M and the normalisation constant
    expect(omega(4) / omega(18)).toBeCloseTo(Math.pow(18 / 4, 1.5), 6);
  });

  it('is positive, finite, and decreasing in semi-major axis for any mass', () => {
    for (const m of [40, 120, 240]) {
      for (const a of [4, 5, 8, 10, 14, 18]) {
        const w = computeOrbitAngularVelocity(a, m);
        expect(Number.isFinite(w)).toBe(true);
        expect(w).toBeGreaterThan(0);
      }
      expect(computeOrbitAngularVelocity(4, m)).toBeGreaterThan(computeOrbitAngularVelocity(18, m));
    }
  });

  it('matches the Kepler period ratio across the registry mass range', () => {
    const period = (a: number, m: number) => (2 * Math.PI) / computeOrbitAngularVelocity(a, m);
    for (const m of [40, 240]) {
      // T ∝ a^(3/2): outer orbit at a=18 takes (18/4)^(3/2) ≈ 9.55× longer
      expect(period(18, m) / period(4, m)).toBeCloseTo(Math.pow(18 / 4, 1.5), 6);
    }
  });

  it('scales with mass as ω(2M)/ω(M) = √2 for fixed semi-major axis', () => {
    for (const a of [4, 10, 18]) {
      const omegaBase = computeOrbitAngularVelocity(a, 40);
      const omegaDouble = computeOrbitAngularVelocity(a, 80);
      expect(omegaDouble / omegaBase).toBeCloseTo(Math.sqrt(2), 6);
    }
  });
});

describe('SimulationEngine — motion friction to rest (RC-04 / MEAS-04)', () => {
  it('decelerates a moving box to exactly zero when force drops below the friction threshold', () => {
    const engine = new SimulationEngine(
      makeCanvasStub(), 'physics', 'motion',
      { force: 30, mass: 5, friction: 0.2 }, () => {}
    );
    engine.advanceFrame(0); // priming frame: F_net = 30 - 9.8 = 20.2 N → box moves
    expect((engine.stateSnapshot as { velocity: number }).velocity).toBeGreaterThan(0);

    engine.updateParameter('force', 5); // 5 < 0.2·5·9.8 = 9.8 → friction must win
    let sawMoving = false;
    for (let f = 0; f < 80; f++) {
      engine.advanceFrame(1000 + f * 16.7);
      const v = (engine.stateSnapshot as { velocity: number }).velocity;
      expect(v, 'velocity must never go negative').toBeGreaterThanOrEqual(0);
      if (v > 0) sawMoving = true;
    }
    expect(sawMoving).toBe(true); // it genuinely moved while slowing down
    const snap = engine.stateSnapshot as { acceleration: number; velocity: number };
    expect(snap.velocity).toBe(0); // parked at rest — no negative glide
    expect(snap.acceleration).toBe(0); // stationary under sub-threshold force: no creep
    engine.destroy();
  });

  it('reports the actual box velocity that drives position (no scale multiplier)', () => {
    const engine = new SimulationEngine(
      makeCanvasStub(), 'physics', 'motion',
      { force: 15, mass: 5, friction: 0.2 }, () => {}
    );
    engine.advanceFrame(0); // prime: dt = 1 exactly
    engine.advanceFrame(1000 / 60); // one stepped frame: dt = 1 exactly
    const snap = engine.stateSnapshot as { velocity: number };
    // boxVel after two frames: 2 × (1.04 × 0.03 × dt=1) — telemetry must equal this
    expect(snap.velocity).toBeCloseTo(2 * 1.04 * 0.03, 9);
    engine.destroy();
  });
});

describe('SimulationEngine — external frame drive loop takeover (RC-07)', () => {
  it('cancels a scheduled live loop before stepping, then re-arms exactly once', () => {
    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame');
    const cancelSpy = vi.spyOn(globalThis, 'cancelAnimationFrame');

    const engine = new SimulationEngine(
      makeCanvasStub(), 'physics', 'motion',
      { force: 15, mass: 5, friction: 0.2 }, () => {}
    );
    engine.start(); // one synchronous frame + one pending rAF
    expect(rafSpy).toHaveBeenCalledTimes(1);
    expect(engine.timeStep).toBe(1);

    engine.advanceFrame(16.7); // external driver takes over the pending loop
    expect(cancelSpy).toHaveBeenCalledTimes(1);
    expect(rafSpy).toHaveBeenCalledTimes(2); // only the stepped frame's re-arm
    expect(engine.timeStep).toBe(2); // prime + stepped — no double advance

    engine.advanceFrame(33.4);
    expect(cancelSpy).toHaveBeenCalledTimes(2);
    expect(rafSpy).toHaveBeenCalledTimes(3);
    expect(engine.timeStep).toBe(3);
    engine.destroy();
  });
});

describe('SimulationEngine — telemetry snapshot sanitization (EDGE-06 / ASSESS-02)', () => {
  it('recursively strips NaN and Infinity while passing other values through', () => {
    const sanitize = (SimulationEngine as unknown as {
      sanitizeSnapshot: (snapshot: Record<string, unknown>) => Record<string, unknown>;
    }).sanitizeSnapshot;

    const dirty = {
      acceleration: Number.POSITIVE_INFINITY,
      velocity: Number.NaN,
      label: 'moving',
      nested: { population: 12, ratio: Number.NEGATIVE_INFINITY, ok: 3.5 },
      list: [1, 2],
    };
    const clean = sanitize(dirty);
    expect(clean).toEqual({
      label: 'moving',
      nested: { population: 12, ok: 3.5 },
      list: [1, 2],
    });
    expect(JSON.parse(JSON.stringify(clean))).toEqual(clean);
  });
});