/**
 * Simulation Engine — Decoupled Pure JS/TS Scientific Simulation Engine
 * Extracted from simulation-runner.tsx for separation of concerns.
 * Handles canvas rendering, physics computation, and telemetry sync
 * for all 17 interactive scientific simulations.
 */

import type { SimulationStateType, TelemetrySnapshot } from "./simulation.types";
import {
  AXON_PROGRESS_MAX_OFFSET,
  AXON_SIGNAL_BASE_SPEED,
  CANVAS_BG_COLOR,
  DEFAULT_POPULATIONS,
  ENGINE_TICKS_PER_SECOND,
  ENGINE_TIMESTEP_MS,
  GRAVITY_CONSTANT,
  GRID_CELL_SIZE,
  GRID_COLOR,
  GRID_LINE_WIDTH,
  MAX_DELTA_TIME_MS,
  MIN_DELTA_TIME_MS,
  MOTION_BOX_START_X,
  MOTION_VELOCITY_DAMPING,
  ORBIT_RENDER_SPEED,
  TELEMETRY_SYNC_INTERVAL_MS,
} from "./engine-constants";
import { getSimulationStateType } from "./simulation-state";
import { sanitizeSnapshot } from "@/lib/simulation/snapshot-sanitize";

/**
 * Kepler orbital angular velocity for the orbit simulation (RF-2).
 * ω = ORBIT_RENDER_SPEED · √(M/a³) — normalised rendering constant (see
 * engine-constants.ts) calibrated so the default orbit (a = 10, M = 120)
 * keeps the visual pacing it had before the fix. Visual behaviour only;
 * telemetry is unchanged.
 */
export function computeOrbitAngularVelocity(semiMajorAxis: number, starMass: number): number {
  return Math.sqrt(starMass / Math.pow(semiMajorAxis, 3)) * ORBIT_RENDER_SPEED;
}

export class SimulationEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public domain: string;
  public simId: string;
  public parameters: Record<string, number> = {};
  public stateSnapshot: Record<string, unknown> = {};
  public isRunning: boolean = true;
  /** State contract classification (S-07). */
  public readonly stateType: SimulationStateType;

  // ── Delta-time timing model (S-03) ────────────────────────────────────────
  // `frameCount`/`timeStep` count executed physics frames; `simulationTime`
  // is the physical clock in seconds built from clamped per-frame deltas.
  // `timeStep` is retained as an alias of `frameCount` for callers that only
  // need the frame counter.
  public frameCount: number = 0;
  public simulationTime: number = 0;
  /** Clamped frame delta in ms of the last executed physics step. */
  public deltaTime: number = 0;
  /** Timestamp (ms) of the last rendered frame. */
  public renderTimestamp: number = 0;
  /** Simulation clock value (s) at the moment of the last telemetry sync. */
  public telemetrySyncTime: number = 0;
  /** Wall-clock (ms) baseline of the last executed frame; null = no baseline. */
  public previousTimestamp: number | null = null;
  public get timeStep(): number {
    return this.frameCount;
  }

  // High-DPI logical dimensions (separate from canvas pixel buffer)
  private logicalW: number = 760;
  private logicalH: number = 480;
  
  private animId: number | null = null;
  private onStateSync: (snap: TelemetrySnapshot) => void;
  private lastSyncTime: number = 0;
  private backgroundCanvas: HTMLCanvasElement | null = null;

  /**
   * Recursively strips non-finite numbers from a telemetry snapshot so NaN or
   * Infinity can never reach React state or the AI/assessment pipeline (P3
   * runtime audit, EDGE-06). Non-number values (strings, contracts, nested
   * objects) pass through untouched. Implementation lives in the shared lib
   * module so the server-side interpret ingestion can use the exact same
   * boundary sanitizer (ASSESS-02).
   */
  private static sanitizeSnapshot(snapshot: Record<string, unknown>): Record<string, unknown> {
    return sanitizeSnapshot(snapshot);
  }

  // Frame-rate independent spawn accumulator (probability board)
  private spawnAccum: number = 0;

  // S-13: precomputed deterministic graph edge pairs — the edge set depends
  // only on (nodesCount, connectionProbability), not on per-frame time.
  private graphEdges: Array<[number, number]> = [];

  // S-13: cached bacterial colony render — the dot layout is a pure function
  // of the integer population, so it is rasterized once per change.
  private colonyCache:
    | { popFloor: number; w: number; h: number; canvas: HTMLCanvasElement | null }
    | null = null;

  // S-13: cached black hole accretion gradient — depends only on mass.
  private diskGradientCache: { mass: number; gradient: CanvasGradient | null } | null = null;

  // Particle databases and mathematical coordinates (Survives React re-renders)
  private sirParticles: Array<{ x: number; y: number; vx: number; vy: number; state: 'S' | 'I' | 'R'; timer: number }> = [];
  private wbcList: Array<{ x: number; y: number; vx: number; vy: number }> = [];
  private pathogenList: Array<{ x: number; y: number; vx: number; vy: number; active: boolean }> = [];
  private beadsList: Array<{ x: number; y: number; vx: number; vy: number; settled: boolean; bin?: number }> = [];
  private bins: number[] = Array(15).fill(0);
  private nodesList: Array<{ x: number; y: number; vx: number; vy: number }> = [];
  
  // Custom positions
  private boxX: number = MOTION_BOX_START_X;
  private boxVel: number = 0;
  private axonProgress: number = 0;

  constructor(
    canvas: HTMLCanvasElement, 
    domain: string, 
    simId: string, 
    params: Record<string, number>,
    onStateSync: (snap: TelemetrySnapshot) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.domain = domain;
    this.simId = simId;
    this.parameters = { ...params };
    this.onStateSync = onStateSync;
    this.stateType = getSimulationStateType(simId);

    // Initialize logical dimensions from the CSS-rendered container size
    this.logicalW = canvas.clientWidth || 760;
    this.logicalH = canvas.clientHeight || 480;
    this.applyDprResize();
    
    this.initSubSimData();
  }

  // SIM-BUG-001: Apply physical pixel buffer scaling for Retina/High-DPI displays
  private applyDprResize() {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const lw = this.canvas.clientWidth || this.logicalW;
    const lh = this.canvas.clientHeight || this.logicalH;
    const targetW = Math.round(lw * dpr);
    const targetH = Math.round(lh * dpr);
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
      this.logicalW = lw;
      this.logicalH = lh;
      this.backgroundCanvas = null;
      // Clamp existing particles into new bounds
      this.clampParticlesToBounds(lw, lh);
    }
  }

  private ensureBackground() {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const bgWidth = Math.round(this.logicalW * dpr);
    const bgHeight = Math.round(this.logicalH * dpr);

    if (!this.backgroundCanvas || this.backgroundCanvas.width !== bgWidth || this.backgroundCanvas.height !== bgHeight) {
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = bgWidth;
      bgCanvas.height = bgHeight;
      const bgCtx = bgCanvas.getContext('2d', { alpha: false })!;
      bgCtx.save();
      bgCtx.scale(dpr, dpr);
      bgCtx.fillStyle = CANVAS_BG_COLOR;
      bgCtx.fillRect(0, 0, this.logicalW, this.logicalH);

      bgCtx.strokeStyle = GRID_COLOR;
      bgCtx.lineWidth = GRID_LINE_WIDTH;
      const gridSize = GRID_CELL_SIZE;
      for (let x = 0; x < this.logicalW; x += gridSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(x, 0);
        bgCtx.lineTo(x, this.logicalH);
        bgCtx.stroke();
      }
      for (let y = 0; y < this.logicalH; y += gridSize) {
        bgCtx.beginPath();
        bgCtx.moveTo(0, y);
        bgCtx.lineTo(this.logicalW, y);
        bgCtx.stroke();
      }
      bgCtx.restore();
      this.backgroundCanvas = bgCanvas;
    }
  }

  // Gracefully keep all live particles within the new logical canvas bounds on resize
  private clampParticlesToBounds(lw: number, lh: number) {
    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    this.sirParticles.forEach(p => { p.x = clamp(p.x, 20, lw - 20); p.y = clamp(p.y, 20, lh - 20); });
    this.wbcList.forEach(p => { p.x = clamp(p.x, 20, lw - 20); p.y = clamp(p.y, 20, lh - 20); });
    this.pathogenList.forEach(p => { p.x = clamp(p.x, 20, lw - 20); p.y = clamp(p.y, 20, lh - 20); });
    this.nodesList.forEach(p => { p.x = clamp(p.x, 20, lw - 20); p.y = clamp(p.y, 20, lh - 20); });
  }

  // SIM-BUG-007: Respect externally-set isRunning state instead of force-overriding to true
  public start() {
    if (!this.animId && this.isRunning) {
      this.frame(0);
    }
  }

  public stop() {
    this.isRunning = false;
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  // S-04: Pause must halt the animation loop so no physics, render, or
  // telemetry work happens while paused. The timestamp baseline is dropped
  // so resume cannot absorb the paused wall-clock duration.
  public pause() {
    this.stop();
    this.previousTimestamp = null;
  }

  // S-04: Resume restarts exactly one loop. The first resumed frame uses the
  // nominal timestep (safe first-frame delta), so a long pause never produces
  // a giant physics step.
  public resume() {
    this.isRunning = true;
    this.previousTimestamp = null;
    if (!this.animId) {
      this.animId = requestAnimationFrame(this.frame);
    }
  }

  /**
   * Executes a single synchronous frame step (test hook and deterministic
   * driver). No-ops while paused — paused engines never advance time, mutate
   * state, or emit telemetry (S-04).
   */
  public advanceFrame(timestampMs: number) {
    if (!this.isRunning) return;
    // RC-07: if the live loop is currently scheduled, take over its handle so
    // an external driver cannot double-schedule frames (frame() re-arms one
    // rAF below), which would silently double physics speed and telemetry.
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.frame(timestampMs);
  }

  public resetTime() {
    // Reset timing model to the clean initial state (S-03 reset contract):
    // zero clock, zero frames, no baseline, and a safe first-frame delta.
    this.frameCount = 0;
    this.simulationTime = 0;
    this.deltaTime = 0;
    this.renderTimestamp = 0;
    this.telemetrySyncTime = 0;
    this.lastSyncTime = 0;
    this.previousTimestamp = null;
    this.spawnAccum = 0;

    this.boxX = MOTION_BOX_START_X;
    this.boxVel = 0;
    this.axonProgress = 0;
    // Reset simulation-specific state: simulations that derive their next
    // frame from stateSnapshot (e.g. bacteria population) must restart from
    // their clean initial value instead of continuing the pre-reset run.
    this.stateSnapshot = {};
    this.initSubSimData();
  }

  public destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    // Drop cached render artifacts tied to this engine lifetime.
    this.colonyCache = null;
    this.diskGradientCache = null;
    this.graphEdges = [];
  }

  public updateParameter(key: string, value: number) {
    this.parameters[key] = value;
    
    // Dynamic resets for specific parameter boundaries
    if (this.simId === 'immune' && (key === 'pathogenCount' || key === 'wbcCount')) {
      this.initSubSimData();
    } else if (this.simId === 'graph' && key === 'nodesCount') {
      this.initSubSimData();
    } else if (this.simId === 'graph' && key === 'connectionProbability') {
      // Rebuild the deterministic edge set when the link probability changes.
      this.rebuildGraphEdges();
    } else if (this.simId === 'probability' && key === 'beadsCount') {
      this.beadsList = [];
      this.bins.fill(0);
    }
  }

  private initSubSimData() {
    const w = this.logicalW;
    const h = this.logicalH;

    if (this.simId === 'immune') {
      this.wbcList = [];
      this.pathogenList = [];
      const wc = this.parameters.wbcCount || DEFAULT_POPULATIONS.WBC_COUNT;
      const pc = this.parameters.pathogenCount || DEFAULT_POPULATIONS.PATHOGEN_COUNT;

      for (let i = 0; i < wc; i++) {
        this.wbcList.push({
          x: Math.random() * (w - 100) + 50,
          y: Math.random() * (h - 100) + 50,
          vx: (Math.random() - 0.5) * 1.8,
          vy: (Math.random() - 0.5) * 1.8
        });
      }

      for (let i = 0; i < pc; i++) {
        this.pathogenList.push({
          x: Math.random() * (w - 100) + 50,
          y: Math.random() * (h - 100) + 50,
          vx: (Math.random() - 0.5) * 2.8,
          vy: (Math.random() - 0.5) * 2.8,
          active: true
        });
      }
    } else if (this.simId === 'virus') {
      // SIM-BUG-005: Respect populationSize parameter for configurable particle density
      const pop = Math.round(this.parameters.populationSize ?? DEFAULT_POPULATIONS.SIR_PARTICLES);
      this.sirParticles = [];
      for (let i = 0; i < pop; i++) {
        this.sirParticles.push({
          x: Math.random() * (w - 40) + 20,
          y: Math.random() * (h - 60) + 40,
          vx: (Math.random() - 0.5) * 2.2,
          vy: (Math.random() - 0.5) * 2.2,
          state: i < 3 ? 'I' : 'S',
          timer: 0
        });
      }
    } else if (this.simId === 'probability') {
      this.beadsList = [];
      this.bins.fill(0);
    } else if (this.simId === 'graph') {
      this.nodesList = [];
      this.graphEdges = [];
      const nodes = this.parameters.nodesCount || 30;
      const cx = w / 2;
      const cy = h / 2;
      for (let i = 0; i < nodes; i++) {
        this.nodesList.push({
          x: cx + Math.cos(i * (Math.PI * 2 / nodes)) * 95 + (Math.random() - 0.5) * 15,
          y: cy + Math.sin(i * (Math.PI * 2 / nodes)) * 95 + (Math.random() - 0.5) * 15,
          vx: 0,
          vy: 0
        });
      }
      this.rebuildGraphEdges();
    }
  }

  /**
   * S-13: The Erdős-Rényi edge set is purely deterministic in (n, p). It is
   * precomputed whenever nodes/connectivity change, so per-frame rendering no
   * longer re-hashes every O(n²) pair with trig math.
   */
  private rebuildGraphEdges() {
    const nodes = Math.round(this.parameters.nodesCount ?? DEFAULT_POPULATIONS.NETWORK_NODES);
    const p = this.parameters.connectionProbability ?? 0.15;
    const edges: Array<[number, number]> = [];
    for (let i = 0; i < nodes; i++) {
      for (let j = i + 1; j < nodes; j++) {
        const seedVal = Math.sin(i * 12.98 + j * 78.2) * 43758.54;
        const randVal = seedVal - Math.floor(seedVal);
        if (randVal < p) edges.push([i, j]);
      }
    }
    this.graphEdges = edges;
  }

  /**
   * S-13: Rasterizes the bacterial colony dots onto an offscreen (transparent)
   * canvas. Keyed by integer population and logical canvas size so per-frame
   * rendering is a single drawImage. Lifecycle-safe: the canvas is owned by
   * this cache, replaced on invalidation, and dropped in destroy().
   */
  private renderColonyCache(popFloor: number, dishX: number, dishY: number, dishR: number, w: number, h: number): {
    popFloor: number;
    w: number;
    h: number;
    canvas: HTMLCanvasElement | null;
  } {
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    const cctx = canvas.getContext('2d');
    if (!cctx) return { popFloor, w, h, canvas: null };

    cctx.save();
    cctx.scale(dpr, dpr);
    cctx.fillStyle = "rgba(52, 211, 153, 0.65)";
    for (let i = 0; i < popFloor; i++) {
      const angle = (i * 137.5) * (Math.PI / 180);
      const rFactor = Math.sqrt(i) * 7.5;
      if (rFactor < dishR - 10) {
        const bx = dishX + Math.cos(angle) * rFactor;
        const by = dishY + Math.sin(angle) * rFactor;
        cctx.beginPath();
        cctx.ellipse(bx, by, 5, 2.5, angle, 0, Math.PI * 2);
        cctx.fill();
      }
    }
    cctx.restore();
    return { popFloor, w, h, canvas };
  }

  // Unified RequestAnimationFrame loop
  // S-03/S-04: physics, render, and telemetry are driven by clamped frame
  // deltas; the loop suspends completely while paused.
  private frame = (timestamp: number) => {
    if (!this.isRunning) {
      this.stop();
      return;
    }

    this.frameCount++;
    this.renderTimestamp = timestamp;

    // First-frame normalization: with no baseline, consume exactly one
    // nominal engine timestep (identical to a steady 60Hz frame), so a fresh
    // frame or a resume never advances physics by a wall-clock accident.
    const rawDelta = this.previousTimestamp === null
      ? ENGINE_TIMESTEP_MS
      : Math.max(0, timestamp - this.previousTimestamp);
    this.deltaTime = Math.min(MAX_DELTA_TIME_MS, Math.max(MIN_DELTA_TIME_MS, rawDelta));
    this.simulationTime += this.deltaTime / 1000;
    this.previousTimestamp = timestamp;

    // Perform math simulation computations
    this.updatePhysics();

    // Core render execution
    this.draw();

    // Throttled UI Sync Callback — rate controlled by TELEMETRY_SYNC_INTERVAL_MS
    if (timestamp - this.lastSyncTime > TELEMETRY_SYNC_INTERVAL_MS) {
      this.telemetrySyncTime = this.simulationTime;
      this.onStateSync({
        timeStep: this.frameCount,
        simulationTime: this.simulationTime,
        stateType: this.stateType,
        // P3 runtime audit (EDGE-06): never let a non-finite value reach
        // React or the AI pipeline — drop stale/corrupt numbers instead of
        // propagating NaN/Infinity (which JSON would silently turn into null).
        stateSnapshot: SimulationEngine.sanitizeSnapshot({ ...this.stateSnapshot })
      });
      this.lastSyncTime = timestamp;
    }

    this.animId = requestAnimationFrame(this.frame);
  }

  private updatePhysics() {
    // Engine time scale: 1.0 = exactly one 60Hz frame. Physics constants stay
    // calibrated per "1/60 s engine tick" and are scaled by the clamped delta,
    // making evolution frame-rate independent (S-03).
    const dt = (this.deltaTime / 1000) * ENGINE_TICKS_PER_SECOND;
    const w = this.logicalW;
    const h = this.logicalH;

    switch (this.simId) {
      case 'motion': {
        const force = this.parameters.force ?? 15;
        const mass = this.parameters.mass ?? 5;
        const friction = this.parameters.friction ?? 0.2;
        const F_friction = friction * mass * GRAVITY_CONSTANT;
        // RC-04: friction continuously opposes motion. With an applied force
        // below the static-friction threshold a moving box must decelerate to
        // rest (not glide forever), while a stationary box under a
        // sub-threshold force stays still — no spontaneous negative motion.
        let acc: number;
        if (this.boxVel > 0) {
          acc = (force - F_friction) / mass;
        } else if (this.boxVel < 0) {
          acc = (force + F_friction) / mass;
        } else {
          acc = force > F_friction ? (force - F_friction) / mass : 0;
        }

        this.boxX += this.boxVel * dt;
        this.boxVel += acc * MOTION_VELOCITY_DAMPING * dt;
        if (this.boxVel < 0) this.boxVel = 0;

        const blockW = 50 + mass * 1.5;
        if (this.boxX > w) {
          this.boxX = -blockW;
        }

        this.stateSnapshot = {
          acceleration: acc,
          // MEAS-04: the reported velocity is the box's actual velocity (the
          // same scale that drives position), so telemetry and the drawn
          // motion can never diverge.
          velocity: this.boxVel,
          frictionalForce: F_friction
        };
        break;
      }

      case 'bacteria': {
        const temp = this.parameters.temperature ?? 37;
        const nutrient = this.parameters.nutrientLevel ?? 6;
        const growthConstant = Math.max(0, Math.exp(-Math.pow(temp - 37, 2) / (2 * Math.pow(12, 2))));
        const capacity = nutrient * 40;

        const currentPop = (this.stateSnapshot.population as number | undefined) ?? 5;
        const nextPop = Math.min(
          capacity,
          currentPop + growthConstant * 0.05 * currentPop * (1 - currentPop / capacity) * dt
        );
        
        this.stateSnapshot = {
          population: nextPop,
          growthRate: growthConstant
        };
        break;
      }

      case 'virus': {
        const trans = this.parameters.transmissionRate ?? 0.5;
        const rec = this.parameters.recoveryRate ?? 0.1;

        const boxW = 400;
        const boxH = 190;
        const bx = (w - boxW) / 2;
        const by = 80;

        let infected = 0;
        let recovered = 0;
        let susceptible = 0;

        this.sirParticles.forEach((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;

          if (p.x < bx || p.x > bx + boxW) { p.vx *= -1; p.x = Math.max(bx, Math.min(bx + boxW, p.x)); }
          if (p.y < by || p.y > by + boxH) { p.vy *= -1; p.y = Math.max(by, Math.min(by + boxH, p.y)); }

          if (p.state === 'I') {
            infected++;
            p.timer += dt;

            if (p.timer > (1 / rec) * 12) {
              p.state = 'R';
            }

            this.sirParticles.forEach((other) => {
              if (other.state === 'S') {
                const distSq = Math.pow(p.x - other.x, 2) + Math.pow(p.y - other.y, 2);
                if (distSq < 80 && Math.random() < Math.min(1, trans * 0.04 * dt)) {
                  other.state = 'I';
                  other.timer = 0;
                }
              }
            });
          } else if (p.state === 'S') {
            susceptible++;
          } else {
            recovered++;
          }
        });

        this.stateSnapshot = {
          susceptible,
          infected,
          recovered,
          r0: trans / rec
        };
        break;
      }

      case 'immune': {
        let pathLeft = 0;

        this.pathogenList.forEach((pat: { x: number; y: number; vx: number; vy: number; active: boolean }) => {
          if (!pat.active) return;
          pathLeft++;

          pat.x += pat.vx * dt;
          pat.y += pat.vy * dt;

          if (pat.x < 15 || pat.x > w - 15) pat.vx *= -1;
          if (pat.y < 15 || pat.y > h - 15) pat.vy *= -1;
        });

        this.wbcList.forEach((wbc: { x: number; y: number; vx: number; vy: number }) => {
          let target: { x: number; y: number; active: boolean } | null = null;
          let minDist = 99999;

          for (const pat of this.pathogenList) {
            if (!pat.active) continue;
            const d = Math.pow(wbc.x - pat.x, 2) + Math.pow(wbc.y - pat.y, 2);
            if (d < minDist) {
              minDist = d;
              target = pat;
            }
          }

          if (target) {
            const dx = target.x - wbc.x;
            const dy = target.y - wbc.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              // Steering blend decay is shaped as pow(bias, dt) so the
              // convergence rate is frame-rate independent.
              wbc.vx = (wbc.vx + (dx / dist) * 0.15 * dt) * Math.pow(0.95, dt);
              wbc.vy = (wbc.vy + (dy / dist) * 0.15 * dt) * Math.pow(0.95, dt);
            }

            wbc.x += wbc.vx * dt;
            wbc.y += wbc.vy * dt;

            if (dist < 10) {
              target.active = false;
            }
          }
        });

        this.stateSnapshot = {
          pathogensRemaining: pathLeft,
          wbcUnits: this.wbcList.length
        };
        break;
      }

      case 'probability': {
        const N = this.parameters.beadsCount ?? DEFAULT_POPULATIONS.GALTON_BEADS;
        const cx = w / 2;
        const startY = 70;
        const spacing = 18;
        const rows = 8;

        // Spawn one bead per 8 engine ticks (accumulator makes the drop rate
        // frame-rate independent instead of gating on the raw frame counter).
        if (this.beadsList.length < N) {
          this.spawnAccum += dt;
          while (this.spawnAccum >= 8 && this.beadsList.length < N) {
            this.spawnAccum -= 8;
            this.beadsList.push({
              x: cx + (Math.random() - 0.5) * 4,
              y: startY - 20,
              vx: 0,
              vy: 1.5,
              settled: false
            });
          }
        }

        this.beadsList.forEach((b) => {
          if (b.settled) return;

          b.y += b.vy * dt;
          b.x += b.vx * dt;
          b.vx *= Math.pow(0.95, dt);

          // peg row collisions
          for (let r = 0; r < rows; r++) {
            const py = startY + r * spacing;
            const pins = r + 1;
            const startX = cx - (r * spacing) / 2;

            for (let p = 0; p < pins; p++) {
              const px = startX + p * spacing;
              const distSq = Math.pow(b.x - px, 2) + Math.pow(b.y - py, 2);
              if (distSq < 48 && b.y < py + 2) {
                b.y = py - 2;
                b.vy = 1.0;
                b.vx = Math.random() > 0.5 ? 1.6 : -1.6;
              }
            }
          }

          const bottomY = startY + rows * spacing + 15;
          if (b.y >= bottomY) {
            b.settled = true;
            const binIdx = Math.max(0, Math.min(this.bins.length - 1, Math.floor((b.x - (cx - 75)) / 10)));
            this.bins[binIdx]++;
            b.bin = binIdx;
          }
        });

        this.stateSnapshot = {
          beadsSettled: this.beadsList.filter(b => b.settled).length
        };
        break;
      }

      case 'graph': {
        // SIM-BUG-003: O(n²/2) Symmetric Repulsion Forces — halves distance calculations per frame
        const nodeCount = this.parameters.nodesCount ?? DEFAULT_POPULATIONS.NETWORK_NODES;
        const cx = w / 2;
        const cy = h / 2;

        for (let i = 0; i < nodeCount; i++) {
          const n1 = this.nodesList[i];
          if (!n1) continue;

          for (let j = i + 1; j < nodeCount; j++) {
            const n2 = this.nodesList[j];
            if (!n2) continue;

            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 100) {
              // Apply Newton's 3rd Law — equal and opposite — one sqrt per pair
              const fx = (dx / dist) * (30 / dist) * dt;
              const fy = (dy / dist) * (30 / dist) * dt;
              n1.vx += fx;
              n1.vy += fy;
              n2.vx -= fx;
              n2.vy -= fy;
            }
          }

          // Gravity towards center and velocity integration
          const dcx = cx - n1.x;
          const dcy = cy - n1.y;
          n1.vx += dcx * 0.015 * dt;
          n1.vy += dcy * 0.015 * dt;

          n1.x += n1.vx * dt;
          n1.y += n1.vy * dt;
          n1.vx *= Math.pow(0.85, dt);
          n1.vy *= Math.pow(0.85, dt);
        }

        // Real measured layout metrics (S-07): computed live from the node
        // database each physics step — no derived fake "science".
        let averageSpeed = 0;
        const activeNodes = Math.min(nodeCount, this.nodesList.length);
        for (let i = 0; i < activeNodes; i++) {
          averageSpeed += Math.hypot(this.nodesList[i].vx, this.nodesList[i].vy);
        }
        averageSpeed /= Math.max(1, activeNodes);
        this.stateSnapshot = {
          nodeCount: activeNodes,
          averageSpeed
        };
        break;
      }

      default: {
        // S-07 state contract: parameterized visualizations carry no measured
        // scientific state. The snapshot communicates the render clock, and
        // `stateType` tells assessment to treat everything as presentation.
        if (this.stateType === 'parameterized_visualization') {
          this.stateSnapshot = {
            visualizationState: { animationPhase: this.simulationTime }
          };
        }
        break;
      }
    }
  }

  private draw() {
    // SIM-BUG-001: Apply Retina/High-DPI DPR resize and logical scaling
    this.applyDprResize();
    const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

    const ctx = this.ctx;
    const w = this.logicalW;  // Logical width (CSS pixels)
    const h = this.logicalH;  // Logical height (CSS pixels)
    // S-03: the render master clock is the physical simulation clock (in
    // 60Hz-equivalent ticks), so animation speed no longer depends on the
    // display refresh rate.
    const t = this.simulationTime * ENGINE_TICKS_PER_SECOND;

    // Scale context so all draw calls use logical pixel coordinates
    ctx.save();
    ctx.scale(dpr, dpr);

    this.ensureBackground();
    if (this.backgroundCanvas) {
      ctx.drawImage(this.backgroundCanvas, 0, 0, w, h);
    }

    ctx.save();

    switch (this.simId) {
      case 'relativity': {
        const v = this.parameters.speed ?? 0.5;
        const gamma = 1 / Math.sqrt(1 - v * v);
        
        // Clock A
        ctx.beginPath();
        ctx.arc(140, 160, 45, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(59, 130, 246, 0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        const angleA = (t * 0.04) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(140, 160);
        ctx.lineTo(140 + Math.cos(angleA) * 35, 160 + Math.sin(angleA) * 35);
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.font = "bold 9px monospace";
        ctx.fillText("FRAME A (STATIONARY)", 85, 225);
        ctx.fillText("Clock rate: 1.00 ticks", 88, 238);

        // Clock B (Dilated)
        const bx = w - 140;
        ctx.beginPath();
        ctx.arc(bx, 160, 45, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(167, 139, 250, 0.25)";
        ctx.lineWidth = 2;
        ctx.stroke();

        const angleB = (t * 0.04 * (1 / gamma)) % (Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(bx, 160);
        ctx.lineTo(bx + Math.cos(angleB) * 35, 160 + Math.sin(angleB) * 35);
        ctx.strokeStyle = "#a78bfa";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("FRAME B (RELATIVISTIC)", bx - 55, 225);
        ctx.fillText(`v/c = ${v.toFixed(2)}c`, bx - 22, 238);
        ctx.fillText(`Dilation: ${gamma.toFixed(3)}x`, bx - 35, 251);

        // Length contraction visual
        const baseLength = 200;
        const conLength = baseLength / gamma;
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(150, 70);
        ctx.lineTo(150 + baseLength, 70);
        ctx.stroke();

        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(150, 70);
        ctx.lineTo(150 + conLength, 70);
        ctx.stroke();

        ctx.fillStyle = "#60a5fa";
        ctx.fillText(`Lorentz length: ${(conLength/baseLength*100).toFixed(1)}%`, 210, 55);
        break;
      }

      case 'motion': {
        const force = this.parameters.force ?? 15;
        const mass = this.parameters.mass ?? 5;

        const blockW = 50 + mass * 1.5;
        const blockH = 30;
        const groundY = 200;

        // Ground track line
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w, groundY);
        ctx.stroke();

        // Sliding block
        ctx.fillStyle = "rgba(245, 158, 11, 0.05)";
        ctx.fillRect(this.boxX, groundY - blockH, blockW, blockH);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.strokeRect(this.boxX, groundY - blockH, blockW, blockH);

        // Vector Force Vector
        if (force > 0) {
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(this.boxX + blockW, groundY - blockH/2);
          ctx.lineTo(this.boxX + blockW + force * 2.2, groundY - blockH/2);
          ctx.stroke();
          
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.moveTo(this.boxX + blockW + force * 2.2, groundY - blockH/2);
          ctx.lineTo(this.boxX + blockW + force * 2.2 - 6, groundY - blockH/2 - 4);
          ctx.lineTo(this.boxX + blockW + force * 2.2 - 6, groundY - blockH/2 + 4);
          ctx.fill();
        }
        break;
      }

      case 'gravity': {
        const radius = (this.parameters.orbitalRadius ?? 8) * 16;
        const mass = this.parameters.centralMass ?? 150;
        const cx = w / 2;
        const cy = h / 2;

        // Central Mass Stellar base
        const stellarR = 15 + mass * 0.04;
        ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
        ctx.beginPath();
        ctx.arc(cx, cy, stellarR * 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(cx, cy, stellarR, 0, Math.PI * 2);
        ctx.fill();

        // Orbit path
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        const v_calc = Math.sqrt((0.5 * mass) / radius);
        const theta = t * (v_calc * 0.015);
        const px = cx + Math.cos(theta) * radius;
        const py = cy + Math.sin(theta) * radius;

        // Planet
        ctx.fillStyle = "#3b82f6";
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'bacteria': {
        const currentPop = (this.stateSnapshot.population as number | undefined) ?? 5;
        const dishX = w / 2;
        const dishY = h / 2;
        const dishR = 110;

        ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(dishX, dishY, dishR, 0, Math.PI * 2);
        ctx.stroke();

        // S-13: the colony dot layout is a pure deterministic function of
        // floor(population) and the dish geometry — rasterize it once per
        // population change instead of issuing an ellipse path per bacterium
        // every frame.
        const popFloor = Math.floor(currentPop);
        if (!this.colonyCache || this.colonyCache.popFloor !== popFloor || this.colonyCache.w !== w || this.colonyCache.h !== h) {
          this.colonyCache = this.renderColonyCache(popFloor, dishX, dishY, dishR, w, h);
        }
        if (this.colonyCache?.canvas) {
          ctx.drawImage(this.colonyCache.canvas, 0, 0, w, h);
        }
        break;
      }

      case 'virus': {
        const boxW = 400;
        const boxH = 190;
        const bx = (w - boxW) / 2;
        const by = 80;

        ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
        ctx.strokeRect(bx, by, boxW, boxH);

        this.sirParticles.forEach((p) => {
          if (p.state === 'S') {
            ctx.fillStyle = "#22d3ee";
          } else if (p.state === 'I') {
            ctx.fillStyle = "#f43f5e";
          } else {
            ctx.fillStyle = "#34d399";
          }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.state === 'I' ? 4.5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'immune': {
        this.pathogenList.forEach((pat: { x: number; y: number; vx: number; vy: number; active: boolean }) => {
          if (!pat.active) return;
          ctx.fillStyle = "#f43f5e";
          ctx.beginPath();
          ctx.arc(pat.x, pat.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        });

        this.wbcList.forEach((wbc) => {
          ctx.fillStyle = "rgba(52, 211, 153, 0.35)";
          ctx.strokeStyle = "#34d399";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(wbc.x, wbc.y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = "#047857";
          ctx.beginPath();
          ctx.arc(wbc.x, wbc.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'heart': {
        const bpm = this.parameters.heartRate ?? 72;
        const sv = this.parameters.strokeVolume ?? 70;
        const pulsePeriod = 60 / bpm;
        const pulseTime = (t / 60) % pulsePeriod;

        let scale = 1.0;
        if (pulseTime < 0.15) {
          scale = 0.85 + (pulseTime / 0.15) * 0.15;
        } else if (pulseTime < 0.4) {
          scale = 1.0 + Math.sin((pulseTime - 0.15) / 0.25 * Math.PI) * 0.15;
        }

        const hx = w / 2;
        const hy = h / 2;

        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.bezierCurveTo(-45, -75, -75, -25, 0, 45);
        ctx.bezierCurveTo(75, -25, 45, -75, 0, -35);
        const fillOpacity = Math.min(0.35, Math.max(0.15, 0.15 + (sv - 70) * 0.002));
        ctx.fillStyle = `rgba(244, 63, 94, ${fillOpacity})`;
        ctx.fill();
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.restore();
        break;
      }

      case 'neural': {
        const myelin = this.parameters.myelination ?? 2;
        const sx = 80;
        const ex = w - 80;
        const ny = h / 2;

        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(sx, ny);
        ctx.lineTo(ex, ny);
        ctx.stroke();

        const segments = 4;
        const segW = (ex - sx) / segments;

        ctx.fillStyle = "rgba(245, 158, 11, 0.15)";
        ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
        ctx.lineWidth = 1.5;
        for (let i = 0; i < segments; i++) {
          ctx.fillRect(sx + i * segW + 6, ny - 9, segW - 12, 18);
          ctx.strokeRect(sx + i * segW + 6, ny - 9, segW - 12, 18);
        }

        const speed = AXON_SIGNAL_BASE_SPEED * myelin;
        // S-03: advance the pulse by the delta-scaled tick count so signal
        // conduction speed is frame-rate independent.
        this.axonProgress =
          (this.axonProgress + speed * ((this.deltaTime / 1000) * ENGINE_TICKS_PER_SECOND)) %
          (ex - sx + AXON_PROGRESS_MAX_OFFSET);
        const signalX = sx + this.axonProgress;

        if (signalX < ex) {
          ctx.fillStyle = "#f59e0b";
          ctx.shadowColor = "#f59e0b";
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(signalX, ny, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        break;
      }

      case 'blood': {
        const r = this.parameters.vesselRadius ?? 3;
        const bp = this.parameters.bloodPressure ?? 100;
        const cy = h / 2;
        const vy = r * 15;

        ctx.fillStyle = "rgba(244, 63, 94, 0.03)";
        ctx.fillRect(0, cy - vy, w, vy * 2);

        ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, cy - vy);
        ctx.lineTo(w, cy - vy);
        ctx.moveTo(0, cy + vy);
        ctx.lineTo(w, cy + vy);
        ctx.stroke();

        const speed = (bp * r * r) / 80;
        ctx.fillStyle = "rgba(244, 63, 94, 0.6)";
        for (let i = 0; i < 20; i++) {
          const ratio = ((i * 7) % 200 - 100) / 100;
          const py = cy + ratio * (vy - 5);
          const localV = speed * (1 - ratio * ratio);
          const px = (i * 45 + t * localV) % (w + 20) - 10;
          
          ctx.beginPath();
          ctx.ellipse(px, py, 4.5, 3, 0.1, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'functions': {
        const slope = this.parameters.slope ?? 1.5;
        const amp = this.parameters.amplitude ?? 4;
        const cx = w / 2;
        const cy = h / 2;

        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.moveTo(40, cy);
        ctx.lineTo(w - 40, cy);
        ctx.moveTo(cx, 40);
        ctx.lineTo(cx, h - 40);
        ctx.stroke();

        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let sx = 40; sx < w - 40; sx++) {
          const mathX = (sx - cx) / 25;
          const mathY = slope * mathX + amp * Math.sin(mathX);
          const sy = cy - mathY * 18;

          if (sx === 40) {
            ctx.moveTo(sx, sy);
          } else if (sy > 30 && sy < h - 30) {
            ctx.lineTo(sx, sy);
          }
        }
        ctx.stroke();
        break;
      }

      case 'probability': {
        const cx = w / 2;
        const startY = 70;
        const spacing = 18;
        const rows = 8;

        ctx.fillStyle = "rgba(255,255,255,0.25)";
        for (let r = 0; r < rows; r++) {
          const py = startY + r * spacing;
          const startX = cx - (r * spacing) / 2;
          for (let p = 0; p <= r; p++) {
            ctx.beginPath();
            ctx.arc(startX + p * spacing, py, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        this.beadsList.forEach((b) => {
          if (b.settled) return;
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        // Bins
        const bottomY = startY + rows * spacing + 15;
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
        for (let i = 0; i < this.bins.length; i++) {
          const bx = cx - 75 + i * 10;
          const barH = this.bins[i] * 3;
          ctx.strokeRect(bx, bottomY, 10, 50);

          ctx.fillStyle = "rgba(251, 191, 36, 0.4)";
          ctx.fillRect(bx + 1, bottomY + 50 - barH, 8, barH);
        }
        break;
      }

      case 'graph': {
        ctx.strokeStyle = "rgba(251, 191, 36, 0.12)";
        ctx.lineWidth = 1;
        // S-13: iterate the precomputed deterministic edge list instead of
        // re-hashing O(n²) trig per frame.
        for (const [i, j] of this.graphEdges) {
          const n1 = this.nodesList[i];
          const n2 = this.nodesList[j];
          if (!n1 || !n2) continue;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }

        this.nodesList.forEach((n) => {
          ctx.fillStyle = "#fbbf24";
          ctx.beginPath();
          ctx.arc(n.x, n.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        break;
      }

      case 'wave': {
        const n = this.parameters.energyLevel ?? 2;
        const L = this.parameters.wellWidth ?? 8;
        const cx = w / 2;
        const pixels = L * 32;
        const lx = cx - pixels / 2;
        const rx = cx + pixels / 2;
        const cy = h / 2;

        ctx.strokeStyle = "rgba(167, 139, 250, 0.25)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(lx, 60);
        ctx.lineTo(lx, cy + 50);
        ctx.lineTo(rx, cy + 50);
        ctx.lineTo(rx, 60);
        ctx.stroke();

        ctx.strokeStyle = "#a78bfa";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let sx = lx; sx <= rx; sx++) {
          const ratio = (sx - lx) / pixels;
          const psi = Math.sqrt(2 / L) * Math.sin(n * Math.PI * ratio);
          const sy = cy - psi * Math.sin(t * 0.06) * 35;

          if (sx === lx) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        break;
      }

      case 'uncertainty': {
        const dx = this.parameters.positionSpread ?? 1.5;
        const cx = w / 2;
        const cy = h / 2;

        ctx.fillStyle = "rgba(34, 211, 238, 0.02)";
        ctx.fillRect(cx - dx * 30, cy - 50, dx * 60, 100);
        ctx.strokeStyle = "rgba(34, 211, 238, 0.15)";
        ctx.strokeRect(cx - dx * 30, cy - 50, dx * 60, 100);

        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let sx = cx - 180; sx <= cx + 180; sx++) {
          const rx = (sx - cx) / 25;
          const envelope = Math.exp(-Math.pow(rx / dx, 2));
          const osc = Math.sin(rx * (4.5 / dx) + t * 0.08);
          const sy = cy - envelope * osc * 45;

          if (sx === cx - 180) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        break;
      }

      case 'orbit': {
        const a = this.parameters.orbitSemiMajorAxis ?? 10;
        const sm = this.parameters.starMass ?? 120;
        const cx = w / 2;
        const cy = h / 2;

        ctx.fillStyle = "#e0f2fe";
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();

        const ra = a * 11;
        const rb = a * 8.5;
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.beginPath();
        ctx.ellipse(cx, cy, ra, rb, 0, 0, Math.PI * 2);
        ctx.stroke();

        const theta = t * computeOrbitAngularVelocity(a, sm);
        const px = cx + Math.cos(theta) * ra;
        const py = cy + Math.sin(theta) * rb;

        ctx.fillStyle = "#22d3ee";
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'blackhole': {
        const mass = this.parameters.blackholeMass ?? 10;
        const dist = this.parameters.probeDistance ?? 45;
        // SIM-BUG-006: Schwarzschild radius multiplier aligned with backend (2.95 km/M☉ proxy)
        const rs = mass * 2.95;
        const cx = w / 2;
        const cy = h / 2;

        // S-13: the accretion gradient depends only on mass (rs) and center —
        // create it once and reuse it until the mass parameter changes.
        if (!this.diskGradientCache || this.diskGradientCache.mass !== mass) {
          const disk = ctx.createRadialGradient(cx, cy, rs, cx, cy, rs * 2.2);
          disk.addColorStop(0, 'rgba(245,158,11,0.75)');
          disk.addColorStop(1, 'rgba(0,0,0,0)');
          this.diskGradientCache = { mass, gradient: disk };
        }
        const disk = this.diskGradientCache && this.diskGradientCache.gradient;
        if (!disk) break;
        ctx.fillStyle = disk;
        ctx.beginPath();
        ctx.arc(cx, cy, rs * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#020617";
        ctx.beginPath();
        ctx.arc(cx, cy, rs, 0, Math.PI * 2);
        ctx.fill();

        const angle = t * 0.015;
        const pr = dist * 8.5;
        ctx.fillStyle = rs / pr > 0.4 ? "#ef4444" : "#22d3ee";
        ctx.beginPath();
        ctx.arc(cx + Math.cos(angle) * pr, cy + Math.sin(angle) * pr, 5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'stellar': {
        const mass = this.parameters.initialMass ?? 8;
        const cx = w / 2;
        const cy = h / 2;

        let col = '#fbbf24';
        let size = 20;

        if (mass < 0.5) { col = '#ef4444'; size = 10; }
        else if (mass < 8) { col = '#fbbf24'; size = 18; }
        else if (mass < 25) { col = '#38bdf8'; size = 32; }
        else { col = '#c084fc'; size = 44; }

        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(cx, cy, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        break;
      }
    }

    ctx.restore(); // inner sim restore
    ctx.restore(); // outer DPI scale restore — must balance ctx.save() at start of draw()
  }
}

// ============================================================================
