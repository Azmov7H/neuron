// components/simulation-runner/simulation-runner.tsx
"use client";

import { useState, useEffect, useRef, memo } from "react";
import { 
  Atom, Brain, Heart, Landmark, Orbit, Compass, 
  Sparkles, Play, Pause, RefreshCw, ChevronUp, ChevronDown, 
  Send, Database, History, X, Cpu, Settings, ChevronRight
} from "lucide-react";

// ============================================================================
// TYPES & SYSTEM CONFIGURATION
// ============================================================================
type ScientificDomain = 'physics' | 'biology' | 'anatomy' | 'mathematics' | 'quantum' | 'space';

interface SubSimulation {
  id: string;
  name: string;
  desc: string;
  equation: string;
  defaultParams: Record<string, number>;
  paramsList: Array<{
    key: string;
    label: string;
    min: number;
    max: number;
    step: number;
  }>;
}

// Client Fallback Config in case the API is offline
const LOCAL_FALLBACK_CONFIG: Record<ScientificDomain, {
  name: string;
  icon: any;
  colorClass: string;
  glowClass: string;
  accentHex: string;
  simulations: SubSimulation[];
}> = {
  physics: {
    name: "Physics Labs",
    icon: Atom,
    colorClass: "text-blue-400 border-blue-500/20 bg-blue-500/5",
    glowClass: "shadow-[0_0_20px_rgba(96,165,250,0.15)]",
    accentHex: "#3b82f6",
    simulations: [
      {
        id: "relativity",
        name: "Special Relativity Dilation",
        desc: "Observe spatial contraction and moving clock dilation as velocity approaches light speed.",
        equation: "t' = \\frac{t}{\\sqrt{1 - v^2/c^2}}",
        defaultParams: { speed: 0.5 },
        paramsList: [{ key: "speed", label: "Velocity (v/c)", min: 0.0, max: 0.99, step: 0.01 }]
      },
      {
        id: "motion",
        name: "Newtonian Motion Sandbox",
        desc: "Examine inertia, applied forces, and friction acting dynamically on a moving particle.",
        equation: "a = \\frac{F_{thrust} - \\mu m g}{m}",
        defaultParams: { force: 15, mass: 5, friction: 0.2 },
        paramsList: [
          { key: "force", label: "Thrust Force (N)", min: 0, max: 50, step: 1 },
          { key: "mass", label: "Inertial Mass (kg)", min: 1, max: 20, step: 0.5 },
          { key: "friction", label: "Friction Coefficient (\u03bbf)", min: 0, max: 0.8, step: 0.05 }
        ]
      },
      {
        id: "gravity",
        name: "Satellite Gravity System",
        desc: "Model centripetal orbital vectors balancing deep gravitational acceleration.",
        equation: "v_{orbit} = \\sqrt{\\frac{G \\cdot M}{r}}",
        defaultParams: { orbitalRadius: 8, centralMass: 150 },
        paramsList: [
          { key: "orbitalRadius", label: "Orbit Radius (r)", min: 3, max: 14, step: 0.5 },
          { key: "centralMass", label: "Stellar Mass (M)", min: 50, max: 300, step: 10 }
        ]
      }
    ]
  },
  biology: {
    name: "Biology Labs",
    icon: Compass,
    colorClass: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    glowClass: "shadow-[0_0_20px_rgba(52,211,153,0.15)]",
    accentHex: "#10b981",
    simulations: [
      {
        id: "bacteria",
        name: "Bacterial Logistic Colony",
        desc: "Simulate logarithmic cell division, growth phases, and carrying capacity saturation.",
        equation: "\\frac{dN}{dt} = r \\cdot N \\left(1 - \\frac{N}{K}\\right)",
        defaultParams: { temperature: 37, nutrientLevel: 6 },
        paramsList: [
          { key: "temperature", label: "Growth Temp (\u00b0C)", min: 5, max: 50, step: 1 },
          { key: "nutrientLevel", label: "Nutrients index (K)", min: 1, max: 10, step: 0.5 }
        ]
      },
      {
        id: "virus",
        name: "Pathogen SIR Spread",
        desc: "Model dynamic virus transmission through compartment interactions (Susceptible-Infected-Recovered).",
        equation: "R_0 = \\frac{\\beta}{\\gamma}",
        defaultParams: { transmissionRate: 0.5, recoveryRate: 0.1, populationSize: 120 },
        paramsList: [
          { key: "transmissionRate", label: "Transmission Rate (\u03b2)", min: 0.1, max: 0.9, step: 0.05 },
          { key: "recoveryRate", label: "Recovery Frequency (\u03b3)", min: 0.02, max: 0.3, step: 0.01 },
          { key: "populationSize", label: "Population Size (N)", min: 30, max: 300, step: 10 }
        ]
      },
      {
        id: "immune",
        name: "Cellular Immune Sweep",
        desc: "Observe white blood phagocytes recruit via chemotaxis to engulf foreign pathogens.",
        equation: "\\frac{dP}{dt} = r_p P - k P \\cdot WBC",
        defaultParams: { pathogenCount: 40, wbcCount: 15 },
        paramsList: [
          { key: "pathogenCount", label: "Pathogens (Red)", min: 10, max: 100, step: 5 },
          { key: "wbcCount", label: "Leukocytes (Green)", min: 2, max: 35, step: 1 }
        ]
      }
    ]
  },
  anatomy: {
    name: "Anatomy Labs",
    icon: Heart,
    colorClass: "text-rose-400 border-rose-500/20 bg-rose-500/5",
    glowClass: "shadow-[0_0_20px_rgba(251,113,133,0.15)]",
    accentHex: "#f43f5e",
    simulations: [
      {
        id: "heart",
        name: "Cardiovascular Output",
        desc: "Measure mechanical blood flow pumped per minute through systemic ventricles.",
        equation: "CO = HR \\cdot SV",
        defaultParams: { heartRate: 72, strokeVolume: 70 },
        paramsList: [
          { key: "heartRate", label: "Heart Rate (BPM)", min: 40, max: 180, step: 5 },
          { key: "strokeVolume", label: "Stroke Volume (mL)", min: 40, max: 125, step: 5 }
        ]
      },
      {
        id: "neural",
        name: "Axonal Signaling Pulse",
        desc: "Fire electrical depolarization spikes along myelinated nerve fibers.",
        equation: "v_{conduction} \\propto myelin",
        defaultParams: { stimulusStrength: 5, myelination: 2 },
        paramsList: [
          { key: "stimulusStrength", label: "Stimulus (mV)", min: 1, max: 10, step: 0.5 },
          { key: "myelination", label: "Myelin Sheath factor", min: 1, max: 4, step: 0.5 }
        ]
      },
      {
        id: "blood",
        name: "Vascular Poiseuille Flow",
        desc: "Observe how minor vasoconstrictions logarithmically drop flow rates.",
        equation: "Q = \\frac{\\Delta P \\cdot \\pi \\cdot r^4}{8 \\eta L}",
        defaultParams: { vesselRadius: 3, bloodPressure: 100 },
        paramsList: [
          { key: "vesselRadius", label: "Lumen Radius (r)", min: 1, max: 5, step: 0.1 },
          { key: "bloodPressure", label: "Perfusion Pressure (\u0394P)", min: 50, max: 150, step: 5 }
        ]
      }
    ]
  },
  mathematics: {
    name: "Math Labs",
    icon: Landmark,
    colorClass: "text-amber-400 border-amber-500/20 bg-amber-500/5",
    glowClass: "shadow-[0_0_20px_rgba(251,191,36,0.15)]",
    accentHex: "#fbbf24",
    simulations: [
      {
        id: "functions",
        name: "Combined Functions",
        desc: "Graph trigonometric polynomial waveforms over Cartesian coordinate plane.",
        equation: "f(x) = m \\cdot x + A \\cdot \\sin(x)",
        defaultParams: { slope: 1.5, amplitude: 4 },
        paramsList: [
          { key: "slope", label: "Linear Slope (m)", min: -4, max: 4, step: 0.1 },
          { key: "amplitude", label: "Sinusoidal Amplitude (A)", min: 0, max: 8, step: 0.2 }
        ]
      },
      {
        id: "probability",
        name: "Galton Board Central Limit",
        desc: "Drop thousands of random beads through triangular pegs to trace a Gaussian normal curve.",
        equation: "P(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}",
        defaultParams: { beadsCount: 200 },
        paramsList: [{ key: "beadsCount", label: "Beads dropped (N)", min: 50, max: 400, step: 10 }]
      },
      {
        id: "graph",
        name: "Network Graph Emergence",
        desc: "Generate random Erd\u0151s-R\u00e9nyi node clusters to discover structural giant components.",
        equation: "G(n, p) \\implies phase\\,transition\\,at\\,p \\approx 1/n",
        defaultParams: { nodesCount: 30, connectionProbability: 0.15 },
        paramsList: [
          { key: "nodesCount", label: "Vertices (n)", min: 10, max: 50, step: 1 },
          { key: "connectionProbability", label: "Link Probability (p)", min: 0, max: 0.5, step: 0.01 }
        ]
      }
    ]
  },
  quantum: {
    name: "Quantum Labs",
    icon: Brain,
    colorClass: "text-purple-400 border-purple-500/20 bg-purple-500/5",
    glowClass: "shadow-[0_0_20px_rgba(192,132,252,0.15)]",
    accentHex: "#c084fc",
    simulations: [
      {
        id: "wave",
        name: "Quantized Wave Function",
        desc: "Solve standing particle wavefunctions confined inside infinite potential well boxes.",
        equation: "\\psi_n(x) = \\sqrt{\\frac{2}{L}} \\sin\\left(\\frac{n \\pi x}{L}\\right)",
        defaultParams: { energyLevel: 2, wellWidth: 8 },
        paramsList: [
          { key: "energyLevel", label: "Energy Level (n)", min: 1, max: 6, step: 1 },
          { key: "wellWidth", label: "Well Width (L Bohr)", min: 4, max: 12, step: 0.5 }
        ]
      },
      {
        id: "uncertainty",
        name: "Heisenberg Conjugate spreads",
        desc: "Squeeze the spatial spread packet to see conjugate momentum spread scatter widely.",
        equation: "\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}",
        defaultParams: { positionSpread: 1.5 },
        paramsList: [{ key: "positionSpread", label: "Spatial Spread (\u0394x)", min: 0.4, max: 4.0, step: 0.1 }]
      }
    ]
  },
  space: {
    name: "Space Labs",
    icon: Orbit,
    colorClass: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    glowClass: "shadow-[0_0_20px_rgba(34,211,238,0.15)]",
    accentHex: "#22d3ee",
    simulations: [
      {
        id: "orbit",
        name: "Planetary Kepler Orbits",
        desc: "Trace orbital periods and speeds governed by Kepler's harmonic proportional laws.",
        equation: "T^2 = \\frac{4\\pi^2}{GM} \\cdot a^3",
        defaultParams: { orbitSemiMajorAxis: 10, starMass: 120 },
        paramsList: [
          { key: "orbitSemiMajorAxis", label: "Orbital Axis (a AU)", min: 4, max: 18, step: 0.5 },
          { key: "starMass", label: "Central Solar Mass (M)", min: 40, max: 240, step: 10 }
        ]
      },
      {
        id: "blackhole",
        name: "Schwarzspacetime Curvature",
        desc: "Measure severe gravitational redshifting surrounding static event horizons.",
        equation: "r_s = \\frac{2 G M}{c^2}",
        defaultParams: { blackholeMass: 10, probeDistance: 22 },
        paramsList: [
          { key: "blackholeMass", label: "Black Hole Mass (M\u2609)", min: 5, max: 30, step: 1 },
          { key: "probeDistance", label: "Probe Radius (r km)", min: 12, max: 40, step: 1 }
        ]
      },
      {
        id: "stellar",
        name: "Stellar Collapse timeline",
        desc: "Trigger core fuel fusion collapse based solely on initial stellar birth mass.",
        equation: "M_{initial} \\implies remnants",
        defaultParams: { initialMass: 8 },
        paramsList: [{ key: "initialMass", label: "Initial Birth Mass (M\u2609)", min: 0.1, max: 40, step: 0.5 }]
      }
    ]
  }
};

// ============================================================================
// DECOUPLED PURE JS/TS SCIENTIFIC SIMULATION ENGINE
// ============================================================================
class SimulationEngine {
  public canvas: HTMLCanvasElement;
  public ctx: CanvasRenderingContext2D;
  public domain: string;
  public simId: string;
  public parameters: Record<string, number> = {};
  public stateSnapshot: Record<string, any> = {};
  public isRunning: boolean = true;
  public timeStep: number = 0;

  // High-DPI logical dimensions (separate from canvas pixel buffer)
  private logicalW: number = 760;
  private logicalH: number = 480;
  
  private animId: number | null = null;
  private onStateSync: (snap: Record<string, any>) => void;
  private lastSyncTime: number = 0;

  // Particle databases and mathematical coordinates (Survives React re-renders)
  private sirParticles: Array<{ x: number; y: number; vx: number; vy: number; state: 'S' | 'I' | 'R'; timer: number }> = [];
  private wbcList: Array<{ x: number; y: number; vx: number; vy: number }> = [];
  private pathogenList: Array<{ x: number; y: number; vx: number; vy: number; active: boolean }> = [];
  private beadsList: Array<{ x: number; y: number; vx: number; vy: number; settled: boolean; bin?: number }> = [];
  private bins: number[] = Array(15).fill(0);
  private nodesList: Array<{ x: number; y: number; vx: number; vy: number }> = [];
  
  // Custom positions
  private boxX: number = 60;
  private boxVel: number = 0;
  private axonProgress: number = 0;

  constructor(
    canvas: HTMLCanvasElement, 
    domain: string, 
    simId: string, 
    params: Record<string, number>,
    onStateSync: (snap: Record<string, any>) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.domain = domain;
    this.simId = simId;
    this.parameters = { ...params };
    this.onStateSync = onStateSync;

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
      // Clamp existing particles into new bounds
      this.clampParticlesToBounds(lw, lh);
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
    if (!this.animId) {
      this.tick(0);
    }
  }

  public stop() {
    this.isRunning = false;
  }

  public resetTime() {
    this.timeStep = 0;
    this.boxX = 60;
    this.boxVel = 0;
    this.axonProgress = 0;
    this.initSubSimData();
  }

  public destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  public updateParameter(key: string, value: number) {
    this.parameters[key] = value;
    
    // Dynamic resets for specific parameter boundaries
    if (this.simId === 'immune' && (key === 'pathogenCount' || key === 'wbcCount')) {
      this.initSubSimData();
    } else if (this.simId === 'graph' && key === 'nodesCount') {
      this.initSubSimData();
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
      const wc = this.parameters.wbcCount || 15;
      const pc = this.parameters.pathogenCount || 40;

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
      const pop = Math.round(this.parameters.populationSize ?? 120);
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
    }
  }

  // Unified RequestAnimationFrame loop
  private tick = (timestamp: number) => {
    if (this.isRunning) {
      this.timeStep++;
      
      // Perform math simulation computations
      this.updatePhysics();
    }
    
    // Core render execution
    this.draw();

    // Throttled UI Sync Callback (Max 30 FPS / ~33ms) to bypass React state bottlenecks
    if (timestamp - this.lastSyncTime > 33) {
      this.onStateSync({
        timeStep: this.timeStep,
        stateSnapshot: { ...this.stateSnapshot }
      });
      this.lastSyncTime = timestamp;
    }

    this.animId = requestAnimationFrame(this.tick);
  }

  private updatePhysics() {
    const w = this.logicalW;
    const h = this.logicalH;

    switch (this.simId) {
      case 'motion': {
        const force = this.parameters.force ?? 15;
        const mass = this.parameters.mass ?? 5;
        const friction = this.parameters.friction ?? 0.2;
        const F_friction = friction * mass * 9.8;
        const F_net = Math.max(0, force - F_friction);
        const acc = F_net / mass;

        this.boxX += this.boxVel;
        this.boxVel += acc * 0.03;

        if (force === 0 && this.boxVel > 0) {
          this.boxVel = Math.max(0, this.boxVel - (F_friction / mass) * 0.03);
        }

        const blockW = 50 + mass * 1.5;
        if (this.boxX > w) {
          this.boxX = -blockW;
        }

        this.stateSnapshot = {
          acceleration: acc,
          velocity: this.boxVel * 4,
          frictionalForce: F_friction
        };
        break;
      }

      case 'bacteria': {
        const temp = this.parameters.temperature ?? 37;
        const nutrient = this.parameters.nutrientLevel ?? 6;
        const growthConstant = Math.max(0, Math.exp(-Math.pow(temp - 37, 2) / (2 * Math.pow(12, 2))));
        const capacity = nutrient * 40;

        const currentPop = this.stateSnapshot.population ?? 5;
        const nextPop = Math.min(capacity, currentPop + (growthConstant * 0.05 * currentPop * (1 - currentPop / capacity)));
        
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
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < bx || p.x > bx + boxW) { p.vx *= -1; p.x = Math.max(bx, Math.min(bx + boxW, p.x)); }
          if (p.y < by || p.y > by + boxH) { p.vy *= -1; p.y = Math.max(by, Math.min(by + boxH, p.y)); }

          if (p.state === 'I') {
            infected++;
            p.timer++;

            if (p.timer > (1 / rec) * 12) {
              p.state = 'R';
            }

            this.sirParticles.forEach((other) => {
              if (other.state === 'S') {
                const distSq = Math.pow(p.x - other.x, 2) + Math.pow(p.y - other.y, 2);
                if (distSq < 80 && Math.random() < trans * 0.04) {
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

        this.pathogenList.forEach((pat) => {
          if (!pat.active) return;
          pathLeft++;

          pat.x += pat.vx;
          pat.y += pat.vy;

          if (pat.x < 15 || pat.x > w - 15) pat.vx *= -1;
          if (pat.y < 15 || pat.y > h - 15) pat.vy *= -1;
        });

        this.wbcList.forEach((wbc) => {
          let target = null;
          let minDist = 99999;

          this.pathogenList.forEach((pat) => {
            if (!pat.active) return;
            const d = Math.pow(wbc.x - pat.x, 2) + Math.pow(wbc.y - pat.y, 2);
            if (d < minDist) {
              minDist = d;
              target = pat;
            }
          });

          if (target) {
            const dx = (target as any).x - wbc.x;
            const dy = (target as any).y - wbc.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
              wbc.vx = (wbc.vx + (dx / dist) * 0.15) * 0.95;
              wbc.vy = (wbc.vy + (dy / dist) * 0.15) * 0.95;
            }

            wbc.x += wbc.vx;
            wbc.y += wbc.vy;

            if (dist < 10) {
              (target as any).active = false;
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
        const N = this.parameters.beadsCount ?? 200;
        const cx = w / 2;
        const startY = 70;
        const spacing = 18;
        const rows = 8;

        if (this.timeStep % 8 === 0 && this.beadsList.length < N) {
          this.beadsList.push({
            x: cx + (Math.random() - 0.5) * 4,
            y: startY - 20,
            vx: 0,
            vy: 1.5,
            settled: false
          });
        }

        this.beadsList.forEach((b) => {
          if (b.settled) return;

          b.y += b.vy;
          b.x += b.vx;
          b.vx *= 0.95;

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
        const nodeCount = this.parameters.nodesCount ?? 30;
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
              const fx = (dx / dist) * (30 / dist);
              const fy = (dy / dist) * (30 / dist);
              n1.vx += fx;
              n1.vy += fy;
              n2.vx -= fx;
              n2.vy -= fy;
            }
          }

          // Gravity towards center and velocity integration
          const dcx = cx - n1.x;
          const dcy = cy - n1.y;
          n1.vx += dcx * 0.015;
          n1.vy += dcy * 0.015;

          n1.x += n1.vx;
          n1.y += n1.vy;
          n1.vx *= 0.85;
          n1.vy *= 0.85;
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
    const t = this.timeStep;

    // Scale context so all draw calls use logical pixel coordinates
    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark Scientific Theme Base
    ctx.fillStyle = "#030305";
    ctx.fillRect(0, 0, w, h);

    // Subtle Spacing Grid (8px grid aligned)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.012)";
    ctx.lineWidth = 1;
    const gridSize = 16;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
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
        const friction = this.parameters.friction ?? 0.2;
        const F_friction = friction * mass * 9.8;
        const acc = Math.max(0, force - F_friction) / mass;

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
        const temp = this.parameters.temperature ?? 37;
        const nutrient = this.parameters.nutrientLevel ?? 6;
        const cap = nutrient * 40;

        const currentPop = this.stateSnapshot.population ?? 5;
        const dishX = w / 2;
        const dishY = h / 2;
        const dishR = 110;

        ctx.strokeStyle = "rgba(16, 185, 129, 0.2)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(dishX, dishY, dishR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "rgba(52, 211, 153, 0.65)";
        for (let i = 0; i < Math.floor(currentPop); i++) {
          const angle = (i * 137.5) * (Math.PI / 180);
          const rFactor = Math.sqrt(i) * 7.5;
          if (rFactor < dishR - 10) {
            const bx = dishX + Math.cos(angle) * rFactor;
            const by = dishY + Math.sin(angle) * rFactor;
            ctx.beginPath();
            ctx.ellipse(bx, by, 5, 2.5, angle, 0, Math.PI * 2);
            ctx.fill();
          }
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
        this.pathogenList.forEach((pat) => {
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
        ctx.fillStyle = "rgba(244, 63, 94, 0.15)";
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

        const speed = 2.0 * myelin;
        this.axonProgress = (this.axonProgress + speed) % (ex - sx + 50);
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
        const nodes = this.parameters.nodesCount ?? 30;
        const p = this.parameters.connectionProbability ?? 0.15;
        
        ctx.strokeStyle = "rgba(251, 191, 36, 0.12)";
        ctx.lineWidth = 1;
        for (let i = 0; i < nodes; i++) {
          for (let j = i + 1; j < nodes; j++) {
            const seedVal = Math.sin(i * 12.98 + j * 78.2) * 43758.54;
            const randVal = seedVal - Math.floor(seedVal);
            if (randVal < p && this.nodesList[i] && this.nodesList[j]) {
              ctx.beginPath();
              ctx.moveTo(this.nodesList[i].x, this.nodesList[i].y);
              ctx.lineTo(this.nodesList[j].x, this.nodesList[j].y);
              ctx.stroke();
            }
          }
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

        const theta = t * (Math.sqrt(sm) * 0.0018);
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
        const dist = this.parameters.probeDistance ?? 22;
        // SIM-BUG-006: Schwarzschild radius multiplier aligned with backend (2.95 km/M☉ proxy)
        const rs = mass * 2.95;
        const cx = w / 2;
        const cy = h / 2;

        const disk = ctx.createRadialGradient(cx, cy, rs, cx, cy, rs * 2.2);
        disk.addColorStop(0, 'rgba(245,158,11,0.75)');
        disk.addColorStop(1, 'rgba(0,0,0,0)');
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

      default: {
        // ====================================================================
        // DYNAMIC SCIENTIFIC TELEMETRY GRAPHICS (FALLBACK FOR 31 NEW SIMULATIONS)
        // ====================================================================
        const cx = w / 2;
        const cy = h / 2;

        // Vector grid axes
        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(40, cy);
        ctx.lineTo(w - 40, cy);
        ctx.moveTo(cx, 40);
        ctx.lineTo(cx, h - 40);
        ctx.stroke();

        // Color theme mapping dynamically matching the domain slug
        const domainAccentColors: Record<string, string> = {
          physics: "#3b82f6",
          biology: "#10b981",
          anatomy: "#f43f5e",
          mathematics: "#fbbf24",
          quantum: "#c084fc",
          space: "#22d3ee"
        };
        const color = domainAccentColors[this.domain] || "#3b82f6";

        // Read active parameters to drive wave synthesis
        const paramKeys = Object.keys(this.parameters);
        const primaryVal = paramKeys.length > 0 ? this.parameters[paramKeys[0]] : 5;
        const secondaryVal = paramKeys.length > 1 ? this.parameters[paramKeys[1]] : 3;

        // Render beautiful glowing trigonometric lissajous pathway
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        for (let sx = 40; sx <= w - 40; sx += 2) {
          const mathX = (sx - cx) / 25;
          const mathY = Math.sin(mathX * (primaryVal * 0.3) + t * 0.05) * Math.cos(mathX * 0.15) * (secondaryVal * 8);
          const sy = cy - mathY;
          
          if (sx === 40) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Orbiter charge tracking the wave dynamically
        const pulseX = cx + Math.sin(t * 0.015) * (w / 2 - 80);
        const mathX = (pulseX - cx) / 25;
        const mathY = Math.sin(mathX * (primaryVal * 0.3) + t * 0.05) * Math.cos(mathX * 0.15) * (secondaryVal * 8);
        const pulseY = cy - mathY;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 5.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }
}

// ============================================================================
// MAIN REAL-TIME SCIENTIFIC SIMULATION ENGINE COMPONENT
// ============================================================================
export function SimulationRunner({ slug }: { slug: string }) {
  const [domainsConfig, setDomainsConfig] = useState<Record<ScientificDomain, any> | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  // States
  const [activeDomain, setActiveDomain] = useState<ScientificDomain>('physics');
  const [activeSimId, setActiveSimId] = useState<string>('relativity');

  const [uiActive, setUiActive] = useState<boolean>(true);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Playback and UI States
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyRuns, setHistoryRuns] = useState<any[]>([]);

  // Asynchronous Intel Drawer States
  const [aiOpen, setAiOpen] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiStreamText, setAiStreamText] = useState<string>("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [userQuestion, setUserQuestion] = useState<string>("");

  // Live Sync Telemetry Overlay State
  const [telemetrySnap, setTelemetrySnap] = useState<Record<string, any>>({ timeStep: 0, stateSnapshot: {} });

  // Slider view parameters
  const [localParams, setLocalParams] = useState<Record<string, number>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SimulationEngine | null>(null);

  // Fetch Database Configurations on mount
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const response = await fetch("/api/simulations/config");
        if (response.ok) {
          const body = await response.json();
          if (body.success && body.data && body.data.length > 0) {
            const mapping: any = {};
            body.data.forEach((item: any) => {
              const domainIcons: Record<string, any> = {
                physics: Atom,
                biology: Compass,
                anatomy: Heart,
                mathematics: Landmark,
                quantum: Brain,
                space: Orbit
              };
              mapping[item.domainKey] = {
                name: item.name,
                icon: domainIcons[item.domainKey] || Compass,
                colorClass: item.colorClass,
                glowClass: item.glowClass,
                accentHex: item.accentHex,
                simulations: item.simulations
              };
            });
            if (isMounted) {
              setDomainsConfig(mapping);
              
              // Set initial active domain & sim slug
              let initialDomain = 'physics' as ScientificDomain;
              let initialSimId = 'relativity';
              
              for (const [domKey, domConfig] of Object.entries(mapping)) {
                for (const sim of (domConfig as any).simulations) {
                  if (slug === sim.id || slug === domKey) {
                    initialDomain = domKey as ScientificDomain;
                    initialSimId = sim.id;
                    break;
                  }
                }
              }

              setActiveDomain(initialDomain);
              setActiveSimId(initialSimId);
              const activeSimObj = (mapping[initialDomain] as any).simulations.find((s: any) => s.id === initialSimId) || (mapping[initialDomain] as any).simulations[0];
              setLocalParams(activeSimObj.defaultParams);
              setIsLoadingConfig(false);
            }
            return;
          }
        }
      } catch (err) {
        console.warn("[Simulation Config Loader] Failed, using local client fallbacks:", err);
      }

      // Fallback
      if (isMounted) {
        setDomainsConfig(LOCAL_FALLBACK_CONFIG);
        let initialDomain = 'physics' as ScientificDomain;
        let initialSimId = 'relativity';
        for (const [domKey, domConfig] of Object.entries(LOCAL_FALLBACK_CONFIG)) {
          for (const sim of domConfig.simulations) {
            if (slug === sim.id || slug === domKey) {
              initialDomain = domKey as ScientificDomain;
              initialSimId = sim.id;
              break;
            }
          }
        }
        setActiveDomain(initialDomain);
        setActiveSimId(initialSimId);
        const activeSimObj = LOCAL_FALLBACK_CONFIG[initialDomain].simulations.find(s => s.id === initialSimId) || LOCAL_FALLBACK_CONFIG[initialDomain].simulations[0];
        setLocalParams(activeSimObj.defaultParams);
        setIsLoadingConfig(false);
      }
    };

    fetchConfig();
    return () => { isMounted = false; };
  }, [slug]);

  // Compute active variables safely
  const activeDomainConfig = domainsConfig ? domainsConfig[activeDomain] : null;
  const activeSim = activeDomainConfig ? (activeDomainConfig.simulations.find((s: any) => s.id === activeSimId) || activeDomainConfig.simulations[0]) : null;

  const resetActivityTimer = () => {
    setUiActive(true);
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    
    if (!aiOpen && !sidebarOpen && !showHistory) {
      activityTimerRef.current = setTimeout(() => {
        setUiActive(false);
      }, 3500);
    }
  };

  useEffect(() => {
    resetActivityTimer();
  }, [aiOpen, sidebarOpen, showHistory]);

  useEffect(() => {
    resetActivityTimer();
    return () => {
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, []);

  // Instantiates decoupled core engine when Sim toggles
  useEffect(() => {
    if (!activeSim) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (engineRef.current) {
      engineRef.current.destroy();
    }

    const engine = new SimulationEngine(
      canvas,
      activeDomain,
      activeSimId,
      activeSim.defaultParams,
      (snap) => {
        setTelemetrySnap(snap);
      }
    );

    engineRef.current = engine;
    engine.isRunning = isRunning;
    engine.start();

    setLocalParams(activeSim.defaultParams);
    setAiStreamText("");
    setAiResult(null);
    fetchHistory(activeSimId);

    return () => {
      engine.destroy();
    };
  }, [activeSimId, activeDomain, isLoadingConfig]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isRunning = isRunning;
    }
  }, [isRunning]);

  const fetchHistory = async (simId: string) => {
    try {
      const response = await fetch(`/api/simulations/history?simulationId=${simId}&limit=5`);
      if (response.ok) {
        const body = await response.json();
        if (body.success && body.data) {
          setHistoryRuns(body.data);
        }
      }
    } catch (e) {
      console.warn("Failed fetching history runs:", e);
    }
  };

  const handleSliderChange = (key: string, val: number) => {
    setLocalParams(prev => ({ ...prev, [key]: val }));
    if (engineRef.current) {
      engineRef.current.updateParameter(key, val);
    }
  };

  const handleSparkAIInterpretation = async () => {
    if (isAiLoading || !activeSim) return;
    setAiOpen(true);
    setIsAiLoading(true);
    setAiStreamText("");
    setAiResult(null);

    const eng = engineRef.current;
    const paramsSnapshot = eng ? { ...eng.parameters } : localParams;
    const stateSnapshot = eng ? { ...eng.stateSnapshot } : {};

    try {
      // SIM-BUG-002: Use credential-forwarding cookies (neuron_session httpOnly) instead of insecure localStorage
      const response = await fetch("/api/simulations/interpret", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: activeDomain,
          simulationId: activeSimId,
          parameters: paramsSnapshot,
          stateSnapshot,
          userQuestion: userQuestion ? userQuestion.trim() : undefined
        })
      });

      if (!response.ok) throw new Error("API Connection failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader body");

      let accum = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const tokenChunk = decoder.decode(value, { stream: true });
        accum += tokenChunk;

        let visible = accum;
        if (visible.includes("[METADATA_EVENT]")) visible = visible.split("[METADATA_EVENT]")[0].trim();
        if (visible.includes("[METADATA]")) visible = visible.split("[METADATA]")[0].trim();
        setAiStreamText(visible);

        if (accum.includes("[METADATA_EVENT]")) {
          const parts = accum.split("[METADATA_EVENT]");
          const raw = parts[1]?.split("[END]")[0]?.trim();
          if (raw) {
            try {
              const meta = JSON.parse(raw);
              if (meta.interpretation) setAiResult(meta.interpretation);
            } catch {}
          }
        }
      }

      fetchHistory(activeSimId);
    } catch {
      setAiStreamText("Initializing local scientifically compiled fallback assessment...");
      setTimeout(() => {
        setAiResult({
          explanation: `Dynamic system active under localized domain constraints. Parameters tuned to: ${Object.entries(paramsSnapshot).map(([k,v]) => `${k}=${v}`).join(', ')}.`,
          keyInsights: ["Local telemetry calibrated.", "Interactive vector graphics synthesized at 60 FPS."],
          concepts: [activeDomain.toUpperCase(), activeSimId.toUpperCase()],
          recommendedActions: ["Modify variables in the collapsible telemetry slider drawer."]
        });
        setAiStreamText(`[EXPLANATION]\nDynamic system active under localized domain constraints.\n\n[KEY INSIGHTS]\n- Local telemetry calibrated.\n- Interactive vector graphics synthesized at 60 FPS.`);
      }, 500);
    } finally {
      setIsAiLoading(false);
      setUserQuestion("");
    }
  };

  const loadHistoryItem = (item: any) => {
    setLocalParams(item.parameters);
    if (engineRef.current) {
      Object.entries(item.parameters).forEach(([k, v]: any) => {
        engineRef.current?.updateParameter(k, v);
      });
    }
    setAiResult(item.aiInterpretation);
    setAiStreamText(
      `[EXPLANATION]\n${item.aiInterpretation.explanation}\n\n[KEY INSIGHTS]\n${item.aiInterpretation.keyInsights.map((i: string) => `- ${i}`).join('\n')}`
    );
    setShowHistory(false);
    setAiOpen(true);
  };

  if (isLoadingConfig || !activeSim || !domainsConfig) {
    return (
      <div className="w-full h-full rounded-2xl border border-white/5 bg-[#030305] flex flex-col items-center justify-center gap-3 text-muted-foreground animate-pulse text-[10px] font-mono uppercase tracking-widest shadow-2xl">
        <Orbit size={24} className="animate-spin text-primary" />
        <span>Loading laboratories scope...</span>
      </div>
    );
  }

  return (
    <div 
      onMouseMove={resetActivityTimer}
      onClick={resetActivityTimer}
      onTouchStart={resetActivityTimer}
      className="flex h-full w-full bg-[#030305] overflow-hidden relative text-foreground font-sans select-none rounded-2xl border border-white/5 shadow-2xl"
    >
      
      {/* ======================================================================
          1. SIMULATION CANVAS LAYER (PRIMARY FOCUS - 100% CONTAINER PORT)
          ====================================================================== */}
      <div className="absolute inset-0 w-full h-full z-0 rounded-2xl overflow-hidden">
        <canvas 
          ref={canvasRef} 
          width={760} 
          height={480} 
          className="w-full h-full object-cover block"
        />
        
        {/* Soft edge grid overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#030305]/60 via-transparent to-[#030305]/10 pointer-events-none" />
      </div>

      {/* Floating Single-Line HUD Readout Overlay (Hides on inactivity) */}
      <div className={`absolute top-6 left-6 z-10 font-mono text-[10px] tracking-wider text-muted-foreground/60 flex items-center gap-3 transition-all duration-500 ease-out select-none pointer-events-none ${
        uiActive 
          ? "opacity-100 scale-100 translate-y-0" 
          : "opacity-0 scale-[0.98] -translate-y-2"
      }`}>
        <span className="text-primary font-bold">{activeSim.name}</span>
        <span className="w-px h-2.5 bg-white/10" />
        <span>{activeSim.equation}</span>
        <span className="w-px h-2.5 bg-white/10" />
        <span>Frame: {telemetrySnap.timeStep}</span>
      </div>

      {/* Top Floating Systems Console Bar (Hides on inactivity) */}
      <div className={`absolute top-6 right-6 z-20 flex items-center gap-2.5 transition-all duration-500 ease-out ${
        uiActive 
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 scale-[0.98] -translate-y-2 pointer-events-none"
      }`}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-black/45 border border-white/5 hover:border-white/15 text-muted-foreground hover:text-white transition-all backdrop-blur-md flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold"
        >
          <Settings size={12} /> Labs
        </button>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-2 rounded-lg bg-black/45 border border-white/5 hover:border-white/15 text-muted-foreground hover:text-white transition-all backdrop-blur-md"
        >
          {isRunning ? <Pause size={12} /> : <Play size={12} />}
        </button>

        <button
          onClick={() => { engineRef.current?.resetTime(); }}
          className="p-2 rounded-lg bg-black/45 border border-white/5 hover:border-white/15 text-muted-foreground hover:text-white transition-all backdrop-blur-md"
        >
          <RefreshCw size={12} />
        </button>

        <button
          onClick={() => setAiOpen(!aiOpen)}
          className={`p-2 rounded-lg border transition-all backdrop-blur-md flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold ${
            aiOpen 
              ? 'bg-secondary text-secondary-foreground border-secondary/40 shadow-[0_0_15px_rgba(167,139,250,0.25)]' 
              : 'bg-black/45 border border-white/5 hover:border-white/15 text-secondary hover:text-white'
          }`}
        >
          <Sparkles size={12} /> Spark AI
        </button>
      </div>

      {/* ======================================================================
          2. CONTEXT LAYER (COLLAPSIBLE FLOATING GLASS DRAWER)
          ====================================================================== */}
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-xl transition-all duration-500 ease-out ${
        uiActive 
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" 
          : "opacity-0 scale-[0.98] translate-y-4 pointer-events-none"
      }`}>
        <div className="bg-black/20 border border-white/5 rounded-2xl shadow-2xl backdrop-blur-sm overflow-hidden p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSim.paramsList.map((p: any) => {
            const val = localParams[p.key] ?? p.min;
            return (
              <div key={p.key} className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-mono">
                  <span className="text-muted-foreground font-semibold tracking-wider uppercase">{p.label}</span>
                  <span className="text-primary font-bold">{val.toFixed(p.step < 0.1 ? 2 : 1)}</span>
                </div>
                <input 
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={val}
                  onChange={(e) => handleSliderChange(p.key, parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-all"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================================
          3. INTELLIGENCE LAYER (SPARK AI SLIDE DRAWERS)
          ====================================================================== */}
      <div className={`absolute top-0 right-0 h-full w-80 bg-black/45 border-l border-white/5 backdrop-blur-lg z-30 transition-transform duration-300 shadow-2xl flex flex-col rounded-r-2xl ${
        aiOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/25">
          <div className="flex items-center gap-1.5">
            <Sparkles className="text-secondary animate-pulse" size={14} />
            <h2 className="text-[10px] font-black tracking-widest uppercase text-white">Spark Analyst</h2>
          </div>
          <button 
            onClick={() => setAiOpen(false)}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Console stream log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none max-h-[calc(100vh-140px)]">
          {isAiLoading && !aiStreamText && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center text-muted-foreground animate-pulse font-mono text-[10px] uppercase">
              <Orbit size={18} className="animate-spin text-secondary" />
              <span>Analyzing live telemetry...</span>
            </div>
          )}

          {!isAiLoading && !aiStreamText && (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-center text-muted-foreground/45 select-none">
              <Brain size={20} className="text-secondary/20" />
              <p className="text-[10px] font-mono tracking-wider uppercase">Submit Telemetry Assessment to begin.</p>
            </div>
          )}

          {aiStreamText && (
            <div className="whitespace-pre-line text-[10px] font-mono text-foreground/90 bg-white/2 rounded-xl p-3 border border-white/5 leading-relaxed overflow-x-auto select-text">
              {aiStreamText}
            </div>
          )}

          {/* Tag discovered concepts */}
          {aiResult?.concepts && (
            <div className="space-y-1.5 select-none">
              <span className="text-[8px] font-black tracking-wider text-muted-foreground uppercase block">Discovered Concepts</span>
              <div className="flex flex-wrap gap-1">
                {aiResult.concepts.map((concept: string) => (
                  <span 
                    key={concept} 
                    className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 transition-colors cursor-pointer"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action advices */}
          {aiResult?.recommendedActions && (
            <div className="space-y-1.5">
              <span className="text-[8px] font-black tracking-wider text-muted-foreground uppercase block">Recommended Adjustments</span>
              <ul className="space-y-1 list-none pl-0 text-[10px] font-mono">
                {aiResult.recommendedActions.map((act: string, idx: number) => (
                  <li key={idx} className="pl-3.5 relative before:content-['-'] before:absolute before:left-0 before:text-secondary text-foreground/80">
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Input block bar */}
        <div className="p-4 border-t border-white/5 bg-black/20 space-y-2">
          <div className="flex gap-2">
            <input 
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="Ask custom question..."
              onKeyDown={(e) => e.key === 'Enter' && handleSparkAIInterpretation()}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] focus:outline-none focus:border-secondary transition-colors"
            />
            <button
              onClick={handleSparkAIInterpretation}
              disabled={isAiLoading}
              className="px-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              <Send size={10} />
            </button>
          </div>
          
          <button
            onClick={handleSparkAIInterpretation}
            disabled={isAiLoading}
            className="w-full py-1.5 bg-secondary/15 border border-secondary/35 text-secondary hover:bg-secondary/25 transition-colors font-bold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles size={10} />
            {isAiLoading ? "Interpreting..." : "Telemetry Assessment"}
          </button>
        </div>
      </div>

      {/* Left Laboratories Sidebar Selection Drawer */}
      <div className={`absolute top-0 left-0 h-full w-60 bg-black/50 border-r border-white/5 backdrop-blur-lg z-40 transition-transform duration-300 shadow-2xl flex flex-col rounded-l-2xl ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-black/25">
          <span className="text-[10px] font-black uppercase text-white tracking-widest flex items-center gap-1.5">
            <Orbit size={12} className="text-primary animate-spin" /> Laboratories
          </span>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="text-muted-foreground hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
          {Object.entries(domainsConfig).map(([domKey, domConfig]: [string, any]) => {
            const Icon = domConfig.icon;
            const isActive = activeDomain === domKey;
            
            return (
              <div key={domKey} className="space-y-1">
                <button
                  onClick={() => {
                    setActiveDomain(domKey as ScientificDomain);
                    setActiveSimId(domConfig.simulations[0].id);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded-lg flex items-center justify-between text-[10px] uppercase font-bold tracking-wider transition-all ${
                    isActive 
                      ? 'bg-white/5 border border-white/10 text-white' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={12} className={isActive ? "text-primary" : "text-muted-foreground"} />
                    {domConfig.name}
                  </span>
                  <ChevronRight size={10} className={`transition-transform ${isActive ? 'rotate-90 text-primary' : 'text-muted-foreground'}`} />
                </button>

                {isActive && (
                  <div className="pl-4 space-y-1 mt-0.5 border-l border-white/5 ml-3.5">
                    {domConfig.simulations.map((sim: any) => {
                      const isSimActive = activeSimId === sim.id;
                      return (
                        <button
                          key={sim.id}
                          onClick={() => {
                            setActiveSimId(sim.id);
                            setSidebarOpen(false); // Close drawer on selection
                          }}
                          className={`w-full text-left px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                            isSimActive 
                              ? 'text-primary bg-primary/10 font-bold' 
                              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                          }`}
                        >
                          {sim.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* History calibration panel button */}
        <div className="p-3 border-t border-white/5">
          <button
            onClick={() => {
              setSidebarOpen(false);
              setShowHistory(true);
            }}
            className="w-full py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] uppercase tracking-wider font-bold rounded-lg flex items-center justify-center gap-1 transition-colors"
          >
            <History size={10} /> History
          </button>
        </div>
      </div>

      {/* Calibration history modal */}
      {showHistory && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 rounded-2xl">
          <div className="w-full max-w-sm bg-black/60 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-3 backdrop-blur-md">
            <div className="flex justify-between items-center border-b border-white/5 pb-2.5">
              <h3 className="text-[10px] font-black uppercase text-foreground tracking-widest flex items-center gap-1.5">
                <Database size={12} className="text-primary" /> Calibration History
              </h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-[10px] text-muted-foreground hover:text-foreground font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1 scrollbar-none">
              {historyRuns.length === 0 ? (
                <div className="text-center py-6 text-[10px] font-mono text-muted-foreground">
                  No previous runs logged for this lab.
                </div>
              ) : (
                historyRuns.map((run) => (
                  <div 
                    key={run._id}
                    onClick={() => loadHistoryItem(run)}
                    className="p-2.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 hover:border-primary/20 cursor-pointer transition-all flex justify-between items-center text-[10px] font-mono"
                  >
                    <div>
                      <p className="font-bold text-foreground">{new Date(run.timestamp).toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">
                        Params: {Object.entries(run.parameters).map(([k, v]: any) => `${k}: ${v.toFixed(1)}`).join(', ')}
                      </p>
                    </div>
                    <ChevronRight size={12} className="text-muted-foreground" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}