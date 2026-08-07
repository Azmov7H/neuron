// components/simulation-runner/simulation-runner.tsx
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { LucideIcon } from "lucide-react";
import { 
  Atom, Brain, Heart, Landmark, Orbit, Compass, 
  Sparkles, Play, Pause, RefreshCw, 
  Send, Database, History, X, Settings, ChevronRight
} from "lucide-react";
import { isInteractiveSim } from "@/components/simulations/constants";
import { ConceptualTelemetryHUD } from "@/components/simulation-runner/conceptual-telemetry-hud";
import { fetchSimulationConfig } from "@/components/simulations/simulation-config-client";

// Import centralized types and constants
import type {
  ScientificDomain,
  TelemetrySnapshot,
} from "@/components/simulation-runner/simulation.types";
import { SimulationEngine } from "@/components/simulation-runner/simulation-engine";

// ============================================================================
// TYPES & SYSTEM CONFIGURATION
// ============================================================================
// ScientificDomain is imported from simulation.types above

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

interface SimulationDomainConfig {
  name: string;
  icon?: LucideIcon;
  colorClass: string;
  glowClass: string;
  accentHex: string;
  simulations: SubSimulation[];
}


interface HistoryRun {
  _id: string;
  timestamp: string;
  parameters: Record<string, number>;
  aiInterpretation: {
    explanation: string;
    keyInsights: string[];
    concepts: string[];
    recommendedActions: string[];
  };
}

// Client Fallback Config in case the API is offline
const LOCAL_FALLBACK_CONFIG: Record<ScientificDomain, SimulationDomainConfig> = {
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
      },
      {
        id: "pendulum",
        name: "Simple Harmonic Pendulum",
        desc: "Observe the regular periodicity of gravitational acceleration balancing cable lengths.",
        equation: "T = 2\\pi\\sqrt{\\frac{L}{g}}",
        defaultParams: { length: 6, gravity: 9.8 },
        paramsList: [
          { key: "length", label: "Cable Length (L meters)", min: 2, max: 12, step: 0.5 },
          { key: "gravity", label: "Gravitational (g m/s\u00b2)", min: 1.6, max: 25.0, step: 0.2 }
        ]
      },
      {
        id: "thermodynamics",
        name: "Ideal Gas Pressure Sandbox",
        desc: "Model thermodynamic kinetic energy collisions within a bounded volume chamber.",
        equation: "P = \\frac{n \\cdot R \\cdot T}{V}",
        defaultParams: { temperature: 300, volume: 5 },
        paramsList: [
          { key: "temperature", label: "Temperature (T Kelvin)", min: 100, max: 600, step: 10 },
          { key: "volume", label: "Chamber Volume (V Liters)", min: 2, max: 15, step: 0.5 }
        ]
      },
      {
        id: "optics",
        name: "Snell Refraction Wave",
        desc: "Graph the velocity bending paths of light waves transitioning boundary indices.",
        equation: "n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)",
        defaultParams: { index1: 1.0, index2: 1.5, angle1: 45 },
        paramsList: [
          { key: "index1", label: "Medium 1 Refraction (n\u2081)", min: 1.0, max: 2.5, step: 0.1 },
          { key: "index2", label: "Medium 2 Refraction (n\u2082)", min: 1.0, max: 2.5, step: 0.1 },
          { key: "angle1", label: "Incident Angle (\u03b8\u2081\u00b0)", min: 0, max: 85, step: 1 }
        ]
      },
      {
        id: "wave_interference",
        name: "Double Slit Interference",
        desc: "Observe crests and troughs overlapping to form phase shifts and bright fringes.",
        equation: "y = \\frac{L \\cdot \\lambda}{d}",
        defaultParams: { wavelength: 550, slitDistance: 12 },
        paramsList: [
          { key: "wavelength", label: "Light Color (\u03bb nm)", min: 380, max: 750, step: 10 },
          { key: "slitDistance", label: "Slit Separation (d \u03bcm)", min: 4, max: 24, step: 0.5 }
        ]
      },
      {
        id: "electrostatics",
        name: "Coulomb Particle Force",
        desc: "Model deep attraction and repulsion vectors acting between static charges.",
        equation: "F = k_e \\cdot \\frac{q_1 \\cdot q_2}{r^2}",
        defaultParams: { charge1: 10, charge2: -10, distance: 5 },
        paramsList: [
          { key: "charge1", label: "Charge 1 (q\u2081 \u03bcC)", min: -30, max: 30, step: 1 },
          { key: "charge2", label: "Charge 2 (q\u2082 \u03bcC)", min: -30, max: 30, step: 1 },
          { key: "distance", label: "Separation Radius (r cm)", min: 2, max: 12, step: 0.2 }
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
      },
      {
        id: "genetics",
        name: "Mendel Punnett Alleles",
        desc: "Observe gene distribution frequencies and Hardy-Weinberg equilibrium offsets.",
        equation: "p^2 + 2pq + q^2 = 1.0",
        defaultParams: { dominantRatio: 0.6 },
        paramsList: [{ key: "dominantRatio", label: "Dominant Allele Frequency (p)", min: 0.05, max: 0.95, step: 0.05 }]
      },
      {
        id: "photosynthesis",
        name: "Chlorophyll Photon Absorption",
        desc: "Observe the energetic rate of photon capture and carbon conversion processes.",
        equation: "Rate \\propto Light \\cdot CO_2",
        defaultParams: { lightIntensity: 8, co2Level: 4 },
        paramsList: [
          { key: "lightIntensity", label: "Light Flux (lux)", min: 1, max: 12, step: 0.5 },
          { key: "co2Level", label: "Carbon Concent (PPM)", min: 1, max: 8, step: 0.5 }
        ]
      },
      {
        id: "enzymes",
        name: "Lock & Key Reaction Kinetic",
        desc: "Observe metabolic reaction speeds saturating enzyme active sites.",
        equation: "v = \\frac{V_{max} \\cdot [S]}{K_m + [S]}",
        defaultParams: { substrateConc: 5, enzymeConc: 3 },
        paramsList: [
          { key: "substrateConc", label: "Substrate Count [S]", min: 1, max: 12, step: 0.5 },
          { key: "enzymeConc", label: "Enzyme Concentration", min: 1, max: 8, step: 0.5 }
        ]
      },
      {
        id: "osmosis",
        name: "Semi-permeable Membrane Fluid",
        desc: "Examine water molecules moving across membrane barriers to balance solute pressures.",
        equation: "\\Pi = i \\cdot M \\cdot R \\cdot T",
        defaultParams: { soluteRatio: 4 },
        paramsList: [{ key: "soluteRatio", label: "Intracellular Salt (%)", min: 1, max: 8, step: 0.2 }]
      },
      {
        id: "ecosystem",
        name: "Predator-Prey Lotka-Volterra",
        desc: "Model dynamic oscillations as populations balance hunting frequencies.",
        equation: "\\frac{dx}{dt} = \\alpha x - \\beta x y",
        defaultParams: { preyPopulation: 60, predatorPopulation: 15 },
        paramsList: [
          { key: "preyPopulation", label: "Primary Herbivores (x)", min: 20, max: 100, step: 5 },
          { key: "predatorPopulation", label: "Apex Predators (y)", min: 5, max: 35, step: 1 }
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
      },
      {
        id: "nephron",
        name: "Glomerular Renal Filtration",
        desc: "Observe dynamic capillary blood filtering across Bowman capsule glomeruli.",
        equation: "GFR = K_f \\cdot (P_g - P_b - \\pi_g)",
        defaultParams: { filterPressure: 45, urineResistance: 12 },
        paramsList: [
          { key: "filterPressure", label: "Glomerular Pressure (P\u1d62)", min: 30, max: 70, step: 1 },
          { key: "urineResistance", label: "Bowman Resistance (P\u1d47)", min: 5, max: 25, step: 0.5 }
        ]
      },
      {
        id: "pulmonary",
        name: "Alveolar Gas Exchange",
        desc: "Examine oxygen diffusion across thin wet respiratory cell borders.",
        equation: "V_{gas} \\propto \\frac{A \\cdot D \\cdot \\Delta P}{T}",
        defaultParams: { oxygenPartialPress: 104, barrierThickness: 2 },
        paramsList: [
          { key: "oxygenPartialPress", label: "Alveolar O\u2082 Pressure (\u0394P)", min: 60, max: 130, step: 2 },
          { key: "barrierThickness", label: "Membrane Width (T \u03bcm)", min: 1, max: 5, step: 0.2 }
        ]
      },
      {
        id: "muscle",
        name: "Actomyosin Cross-Bridge Slide",
        desc: "Examine sliding sarcomere fibers contracting on calcium ion updates.",
        equation: "F = F_0 \\left(1 - \\frac{v}{v_{max}}\\right)",
        defaultParams: { calciumLevel: 5, atpAvailability: 8 },
        paramsList: [
          { key: "calciumLevel", label: "Intracellular Ca\u00b2\u207a ions", min: 1, max: 10, step: 0.5 },
          { key: "atpAvailability", label: "ATP Energy concentration", min: 2, max: 12, step: 0.5 }
        ]
      },
      {
        id: "endocrine",
        name: "Insulin Glucose Hormonal Loop",
        desc: "Observe systemic loops adjusting blood sugar via beta-cell insulin updates.",
        equation: "\\frac{dG}{dt} = I_{prod} - I_{util} \\cdot G",
        defaultParams: { carbIntake: 60, insulinSensitivity: 4 },
        paramsList: [
          { key: "carbIntake", label: "Carb Load (g)", min: 10, max: 120, step: 5 },
          { key: "insulinSensitivity", label: "Insulin Affinity", min: 1, max: 8, step: 0.2 }
        ]
      },
      {
        id: "bone",
        name: "Osteoblast Calcium Deposit",
        desc: "Model dynamic bone remodeling mineral deposition ratios.",
        equation: "Bone_{mass} \\propto D_3 \\cdot Cal",
        defaultParams: { calciumIntake: 8, vitaminD: 5 },
        paramsList: [
          { key: "calciumIntake", label: "Dietary Calcium (mg)", min: 2, max: 15, step: 0.5 },
          { key: "vitaminD", label: "Vitamin D\u2083 index", min: 1, max: 10, step: 0.5 }
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
      },
      {
        id: "chaos",
        name: "Lorenz Chaotic Attractor",
        desc: "Model dynamic butterfly effects as trajectories orbit triple-dimensional attractors.",
        equation: "\\sigma=10, \\rho=28, \\beta=8/3",
        defaultParams: { chaosRho: 28 },
        paramsList: [{ key: "chaosRho", label: "Rayleigh Factor (\u03c1)", min: 14, max: 40, step: 0.5 }]
      },
      {
        id: "fractal",
        name: "Mandelbrot Iteration Plane",
        desc: "Observe dynamic complex sets rendering infinite geometric boundaries.",
        equation: "z_{n+1} = z_n^2 + c",
        defaultParams: { iterationsLimit: 40 },
        paramsList: [{ key: "iterationsLimit", label: "Depth Iterations (n)", min: 10, max: 80, step: 2 }]
      },
      {
        id: "fourier",
        name: "Sine Harmonic Synthesizer",
        desc: "Overlap discrete sine frequencies to build perfect square, triangle, or sawtooth waves.",
        equation: "f(t) = \\sum A_n \\sin(n \\omega t)",
        defaultParams: { harmonicCount: 3 },
        paramsList: [{ key: "harmonicCount", label: "Harmonic Iterations (n)", min: 1, max: 12, step: 1 }]
      },
      {
        id: "calculus",
        name: "Riemann Integral Area",
        desc: "Observe sub-divided rectangle areas summing closer to exact curve integration boundaries.",
        equation: "\\int_a^b f(x) dx \\approx \\sum f(x_i) \\Delta x",
        defaultParams: { rectanglesCount: 16 },
        paramsList: [{ key: "rectanglesCount", label: "Subdivisions (n columns)", min: 4, max: 48, step: 2 }]
      },
      {
        id: "fibonacci",
        name: "Golden Spiral Growth",
        desc: "Watch shell patterns trace the mathematical logarithmic spiral limits.",
        equation: "\\phi = \\frac{1+\\sqrt{5}}{2} \\approx 1.618",
        defaultParams: { spiralScale: 4 },
        paramsList: [{ key: "spiralScale", label: "Growth Vector Scale", min: 1, max: 8, step: 0.2 }]
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
      },
      {
        id: "tunneling",
        name: "Potential Barrier Tunneling",
        desc: "Observe finite probability waves leaking through mathematically forbidden barriers.",
        equation: "T \\approx e^{-2\\kappa a}",
        defaultParams: { barrierHeight: 8, particleEnergy: 4 },
        paramsList: [
          { key: "barrierHeight", label: "Barrier Voltage (V\u2080)", min: 5, max: 15, step: 0.5 },
          { key: "particleEnergy", label: "Incident Energy (E)", min: 1, max: 10, step: 0.5 }
        ]
      },
      {
        id: "spin",
        name: "Bloch Sphere Qubit Spin",
        desc: "Rotate a unitary state qubit vectors across latitude and longitude lines.",
        equation: "|\\psi\\rangle = \\cos\\frac{\\theta}{2}|0\\rangle + e^{i\\phi}\\sin\\frac{\\theta}{2}|1\\rangle",
        defaultParams: { spinTheta: 90, spinPhi: 45 },
        paramsList: [
          { key: "spinTheta", label: "Latitude Angle (\u03b8\u00b0)", min: 0, max: 180, step: 5 },
          { key: "spinPhi", label: "Phase Angle (\u03c6\u00b0)", min: 0, max: 360, step: 10 }
        ]
      },
      {
        id: "entanglement",
        name: "Bell State Spooky Core",
        desc: "Examine quantum correlation distributions between entangled particles.",
        equation: "|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}",
        defaultParams: { correlationAngle: 45 },
        paramsList: [{ key: "correlationAngle", label: "Measurement Angle (\u03b8\u00b0)", min: 0, max: 90, step: 5 }]
      },
      {
        id: "hydrogen",
        name: "Bohr Atomic Radius",
        desc: "Observe stable quantized hydrogen electron orbit shells.",
        equation: "r_n = n^2 \\cdot a_0",
        defaultParams: { quantumNumber: 2 },
        paramsList: [{ key: "quantumNumber", label: "Principal Shell (n)", min: 1, max: 5, step: 1 }]
      },
      {
        id: "harmonic",
        name: "Quantum Harmonic Wave",
        desc: "Graph parabolic well energy states matching Hermite polynomial packets.",
        equation: "E_n = (n + 1/2)\\hbar\\omega",
        defaultParams: { oscillatorEnergy: 1 },
        paramsList: [{ key: "oscillatorEnergy", label: "Vibrational State (n)", min: 0, max: 4, step: 1 }]
      },
      {
        id: "superposition",
        name: "Dual State Collapse",
        desc: "Watch coherent dual states collapse instantly to definite values on measurement.",
        equation: "|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle",
        defaultParams: { probabilityAlpha: 50 },
        paramsList: [{ key: "probabilityAlpha", label: "State |0\u27e9 Weight (%)", min: 0, max: 100, step: 5 }]
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
      },
      {
        id: "cosmology",
        name: "Hubble Expanding Universe",
        desc: "Observe dynamic Doppler galaxy redshifting relative to cosmic expansion boundaries.",
        equation: "v = H_0 \\cdot d",
        defaultParams: { hubbleConstant: 70 },
        paramsList: [{ key: "hubbleConstant", label: "Hubble Constant (H\u2080)", min: 50, max: 90, step: 2 }]
      },
      {
        id: "nebula",
        name: "Jeans Nebula Collapse",
        desc: "Observe how gas pressure balances thermal limits to trigger dust star collapse.",
        equation: "M_J \\propto T^{3/2} \\cdot \\rho^{-1/2}",
        defaultParams: { dustDensity: 4, gasTemp: 20 },
        paramsList: [
          { key: "dustDensity", label: "Gas Core Density (\u03c1)", min: 1, max: 10, step: 0.5 },
          { key: "gasTemp", label: "Cloud Temperature (T K)", min: 5, max: 50, step: 1 }
        ]
      },
      {
        id: "tides",
        name: "Lunar Tidal Bulge Pull",
        desc: "Model dynamic planetary ocean bulge elevations pulled by gravity.",
        equation: "F_{tidal} \\propto \\frac{M_{moon}}{d^3}",
        defaultParams: { moonDistance: 8 },
        paramsList: [{ key: "moonDistance", label: "Orbital Distance (d Earth radii)", min: 4, max: 15, step: 0.5 }]
      },
      {
        id: "magnetosphere",
        name: "Solar Wind Deflection",
        desc: "Observe planetary core dipoles redirecting high-energy coronal mass ions.",
        equation: "r_{magneto} \\propto B^{1/3}",
        defaultParams: { windVelocity: 5, fieldStrength: 8 },
        paramsList: [
          { key: "windVelocity", label: "Solar Wind Speed (v)", min: 1, max: 10, step: 0.5 },
          { key: "fieldStrength", label: "Core Dipole Power (B)", min: 2, max: 15, step: 0.5 }
        ]
      },
      {
        id: "pulsar",
        name: "Relativistic Pulsar Jet",
        desc: "Examine high-speed magnetic field rotations emitting massive radio cones.",
        equation: "P_{spin} \\approx ms",
        defaultParams: { rotationSpeed: 6 },
        paramsList: [{ key: "rotationSpeed", label: "Spin Period (milliseconds)", min: 1, max: 20, step: 0.5 }]
      }
    ]
  }
};

// Domain-to-icon fallback map (used when API config omits icon references)
const DOMAIN_ICONS: Record<ScientificDomain, LucideIcon> = {
  physics: Atom,
  biology: Compass,
  anatomy: Heart,
  mathematics: Landmark,
  quantum: Brain,
  space: Orbit,
};

// ============================================================================
// MAIN REAL-TIME SCIENTIFIC SIMULATION ENGINE COMPONENT
// ============================================================================
export function SimulationRunner({ slug }: { slug: string }) {
  const [domainsConfig, setDomainsConfig] = useState<Record<ScientificDomain, SimulationDomainConfig> | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  // States
  const [activeDomain, setActiveDomain] = useState<ScientificDomain>('physics');
  const [activeSimId, setActiveSimId] = useState<string>('relativity');

  const [uiActive, setUiActive] = useState<boolean>(true);
  const activityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Playback and UI States
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [historyRuns, setHistoryRuns] = useState<HistoryRun[]>([]);

  // Asynchronous Intel Drawer States
  const [aiOpen, setAiOpen] = useState<boolean>(false);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [aiStreamText, setAiStreamText] = useState<string>("");
  const [aiResult, setAiResult] = useState<HistoryRun['aiInterpretation'] | null>(null);
  const [userQuestion, setUserQuestion] = useState<string>("");

  // Live Sync Telemetry Overlay State
  const [telemetrySnap, setTelemetrySnap] = useState<TelemetrySnapshot>({ timeStep: 0, stateSnapshot: {} });

  // Slider view parameters
  const [localParams, setLocalParams] = useState<Record<string, number>>({});

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<SimulationEngine | null>(null);
  const historyCacheRef = useRef<Record<string, HistoryRun[]>>({});
  const pendingParamUpdatesRef = useRef<Record<string, number>>({});
  const paramUpdateRafRef = useRef<number | null>(null);

  const activeDomainConfig = useMemo(
    () => (domainsConfig ? domainsConfig[activeDomain] : null),
    [domainsConfig, activeDomain]
  );

  const activeSim = useMemo<SubSimulation | null>(
    () =>
      activeDomainConfig
        ? activeDomainConfig.simulations.find((s) => s.id === activeSimId) || activeDomainConfig.simulations[0]
        : null,
    [activeDomainConfig, activeSimId]
  );

  const isConceptual = useMemo(() => !isInteractiveSim(activeSimId), [activeSimId]);

  const flushPendingEngineUpdates = useCallback(() => {
    const engine = engineRef.current;
    const pending = pendingParamUpdatesRef.current;
    if (!engine || Object.keys(pending).length === 0) return;

    Object.entries(pending).forEach(([key, value]) => {
      engine.updateParameter(key, value);
    });
    pendingParamUpdatesRef.current = {};
    if (paramUpdateRafRef.current) {
      cancelAnimationFrame(paramUpdateRafRef.current);
      paramUpdateRafRef.current = null;
    }
  }, []);

  const scheduleEngineParameterUpdate = useCallback((key: string, value: number) => {
    pendingParamUpdatesRef.current[key] = value;
    if (paramUpdateRafRef.current === null) {
      paramUpdateRafRef.current = requestAnimationFrame(() => {
        flushPendingEngineUpdates();
      });
    }
  }, [flushPendingEngineUpdates]);

  useEffect(() => {
    return () => {
      if (paramUpdateRafRef.current) {
        cancelAnimationFrame(paramUpdateRafRef.current);
      }
    };
  }, []);

  // Fetch Database Configurations on mount
  useEffect(() => {
    let isMounted = true;
    const resolveInitialConfig = async () => {
      try {
        const fetchedConfig = await fetchSimulationConfig();
        const mapping = fetchedConfig || LOCAL_FALLBACK_CONFIG;

        if (!isMounted) return;
        setDomainsConfig(mapping as Record<ScientificDomain, SimulationDomainConfig>);

        let initialDomain = 'physics' as ScientificDomain;
        let initialSimId = '';

        outerLoop1: for (const [domKey, domConfig] of Object.entries(mapping) as Array<[ScientificDomain, SimulationDomainConfig]>) {
          if (slug === domKey) {
            initialDomain = domKey;
            initialSimId = domConfig.simulations[0]?.id || '';
            break outerLoop1;
          }
          for (const sim of domConfig.simulations) {
            if (slug === sim.id) {
              initialDomain = domKey;
              initialSimId = sim.id;
              break outerLoop1;
            }
          }
        }

        if (!initialSimId && mapping[initialDomain]) {
          initialSimId = mapping[initialDomain].simulations[0]?.id || 'relativity';
        }

        const activeSimObj = mapping[initialDomain]?.simulations.find((s) => s.id === initialSimId) || mapping[initialDomain]?.simulations[0];
        setActiveDomain(initialDomain);
        setActiveSimId(initialSimId);
        if (activeSimObj) setLocalParams(activeSimObj.defaultParams ?? {});
      } catch (err) {
        console.warn("[Simulation Config Loader] Failed, using local client fallbacks:", err);
        if (!isMounted) return;
        setDomainsConfig(LOCAL_FALLBACK_CONFIG);

        let initialDomain = 'physics' as ScientificDomain;
        let initialSimId = '';

        outerLoop2: for (const [domKey, domConfig] of Object.entries(LOCAL_FALLBACK_CONFIG) as Array<[ScientificDomain, SimulationDomainConfig]>) {
          if (slug === domKey) {
            initialDomain = domKey;
            initialSimId = domConfig.simulations[0]?.id || '';
            break outerLoop2;
          }
          for (const sim of domConfig.simulations) {
            if (slug === sim.id) {
              initialDomain = domKey;
              initialSimId = sim.id;
              break outerLoop2;
            }
          }
        }

        if (!initialSimId && LOCAL_FALLBACK_CONFIG[initialDomain]) {
          initialSimId = LOCAL_FALLBACK_CONFIG[initialDomain].simulations[0]?.id || 'relativity';
        }

        const activeSimObj = LOCAL_FALLBACK_CONFIG[initialDomain].simulations.find((s) => s.id === initialSimId) || LOCAL_FALLBACK_CONFIG[initialDomain].simulations[0];
        setActiveDomain(initialDomain);
        setActiveSimId(initialSimId);
        if (activeSimObj) setLocalParams(activeSimObj.defaultParams ?? {});
      } finally {
        if (isMounted) setIsLoadingConfig(false);
      }
    };

    resolveInitialConfig();
    return () => { isMounted = false; };
  }, [slug]);

  const resetActivityTimer = useCallback(() => {
    setUiActive(true);
    if (activityTimerRef.current) {
      clearTimeout(activityTimerRef.current);
    }
    
    if (!aiOpen && !sidebarOpen && !showHistory) {
      activityTimerRef.current = setTimeout(() => {
        setUiActive(false);
      }, 3500);
    }
  }, [aiOpen, sidebarOpen, showHistory]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      resetActivityTimer();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [resetActivityTimer]);

  // Instantiates decoupled core engine when Sim toggles
  useEffect(() => {
    let syncTimer: number | null = null;

    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }

    if (!activeSim) return;

    // Conceptual labs have no Canvas engine — the SVG HUD handles rendering.
    if (isConceptual) {
      syncTimer = window.setTimeout(() => {
        setLocalParams(activeSim.defaultParams);
        setAiStreamText("");
        setAiResult(null);
      }, 0);
      return () => {
        if (syncTimer !== null) window.clearTimeout(syncTimer);
      };
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

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

    syncTimer = window.setTimeout(() => {
      setLocalParams(activeSim.defaultParams);
      setAiStreamText("");
      setAiResult(null);
    }, 0);

    return () => {
      engine.destroy();
      if (syncTimer !== null) window.clearTimeout(syncTimer);
    };
  // NOTE: isRunning intentionally excluded — a separate effect (below) syncs it.
  // Including it here would destroy + re-create the engine on every pause/play.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSimId, activeDomain, activeSim, isLoadingConfig, isConceptual]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isRunning = isRunning;
    }
  }, [isRunning]);

  useEffect(() => {
    if (!showHistory || !activeSimId) return;
    if (historyCacheRef.current[activeSimId]) {
      setHistoryRuns(historyCacheRef.current[activeSimId]);
      return;
    }

    let active = true;
    const loadHistory = async () => {
      try {
        const response = await fetch(`/api/simulations/history?simulationId=${activeSimId}&limit=5`, {
          credentials: "include",
        });
        if (!active || !response.ok) return;
        const body = await response.json();
        if (body.success && body.data) {
          historyCacheRef.current[activeSimId] = body.data;
          setHistoryRuns(body.data);
        }
      } catch (e) {
        console.warn("Failed fetching history runs:", e);
      }
    };

    loadHistory();
    return () => {
      active = false;
    };
  }, [showHistory, activeSimId]);

  const handleSliderChange = useCallback((key: string, val: number) => {
    setLocalParams((prev) => ({ ...prev, [key]: val }));
    scheduleEngineParameterUpdate(key, val);
  }, [scheduleEngineParameterUpdate]);

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

  const loadHistoryItem = (item: HistoryRun) => {
    setLocalParams(item.parameters);
    if (engineRef.current) {
      Object.entries(item.parameters).forEach(([k, v]) => {
        engineRef.current?.updateParameter(k, v as number);
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
      {isConceptual ? (
        <ConceptualTelemetryHUD
          accent={activeDomainConfig?.accentHex || "#3b82f6"}
          sim={activeSim}
          params={localParams}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full z-0 rounded-2xl overflow-hidden">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover block"
          />

          {/* Soft edge grid overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#030305]/60 via-transparent to-[#030305]/10 pointer-events-none" />
        </div>
      )}

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
          aria-label={sidebarOpen ? "Close laboratories panel" : "Open laboratories panel"}
          className="p-2 rounded-lg bg-black/45 border border-white/5 hover:border-white/15 text-muted-foreground hover:text-white transition-all backdrop-blur-md flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold"
        >
          <Settings size={12} /> Labs
        </button>

        <button
          onClick={() => setIsRunning(!isRunning)}
          aria-label={isRunning ? "Pause simulation" : "Resume simulation"}
          className="p-2 rounded-lg bg-black/45 border border-white/5 hover:border-white/15 text-muted-foreground hover:text-white transition-all backdrop-blur-md"
        >
          {isRunning ? <Pause size={12} /> : <Play size={12} />}
        </button>

        <button
          onClick={() => { engineRef.current?.resetTime(); }}
          aria-label="Reset simulation"
          className="p-2 rounded-lg bg-black/45 border border-white/5 hover:border-white/15 text-muted-foreground hover:text-white transition-all backdrop-blur-md"
        >
          <RefreshCw size={12} />
        </button>

        <button
          onClick={() => setAiOpen(!aiOpen)}
          aria-label={aiOpen ? "Close Spark AI panel" : "Open Spark AI analysis"}
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
          {activeSim.paramsList.map((p: SubSimulation["paramsList"][number]) => {
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
          {(Object.entries(domainsConfig) as Array<[ScientificDomain, SimulationDomainConfig]>).map(([domKey, domConfig]) => {
            const Icon = domConfig.icon || DOMAIN_ICONS[domKey];
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
                    {domConfig.simulations.map((sim: SubSimulation) => {
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
                        Params: {Object.entries(run.parameters).map(([k, v]) => `${k}: ${(v as number).toFixed(1)}`).join(', ')}
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