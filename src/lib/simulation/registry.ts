/**
 * Simulation Registry
 * Single source of truth for all simulations in the Neuron platform.
 * Extracted from the client-side LOCAL_FALLBACK_CONFIG to eliminate duplication
 * and serve as the authoritative definition for both traditional UI and AI interpretation.
 *
 * All 17 canvas-backed interactive simulations rendered by SimulationEngine.
 * Any simulation not in INTERACTIVE_SIM_IDS falls back to ConceptualTelemetryHUD.
 */

import type { SimulationDefinition, ScientificDomain, SimulationParameter, ClientSimulation } from './registry.types';
import { SCIENTIFIC_DOMAINS } from './registry.types';

export type { ScientificDomain } from './registry.types';

/** Canonical domain membership enumeration (single source). */
export { SCIENTIFIC_DOMAINS } from './registry.types';

export const INTERACTIVE_SIM_IDS: ReadonlyArray<string> = [
  'relativity', 'motion', 'gravity',
  'bacteria', 'virus', 'immune',
  'heart', 'neural', 'blood',
  'functions', 'probability', 'graph',
  'wave', 'uncertainty',
  'orbit', 'blackhole', 'stellar',
] as const;

export function isInteractiveSim(id: string): boolean {
  return (INTERACTIVE_SIM_IDS as readonly string[]).includes(id);
}

/**
 * Domain identity metadata (user-facing names). UI presentation concerns
 * (Tailwind classes, icons, accent colors) live in
 * `components/simulations/domain-presentation.ts` and must not be
 * injected into the scientific simulation model.
 */
export interface DomainIdentity {
  label: string;
  displayName: string;
}

export const DOMAIN_LABELS: Record<ScientificDomain, DomainIdentity> = {
  physics:     { label: 'Physics',     displayName: 'Physics Labs' },
  biology:     { label: 'Biology',     displayName: 'Biology Labs' },
  anatomy:     { label: 'Anatomy',     displayName: 'Anatomy Labs' },
  mathematics: { label: 'Mathematics', displayName: 'Math Labs' },
  quantum:     { label: 'Quantum',     displayName: 'Quantum Labs' },
  space:       { label: 'Space',       displayName: 'Space Labs' },
};

/** Stable domain ordering used everywhere (hub, runner, NL prompt, API). */
export const DOMAIN_ORDER: ReadonlyArray<ScientificDomain> = SCIENTIFIC_DOMAINS;

/**
 * The complete simulation registry.
 * Keyed by `${domain}:${simulationId}` for O(1) lookup.
 */
export const SIMULATION_REGISTRY = new Map<string, SimulationDefinition>();

function register(sim: SimulationDefinition): void {
  const key = `${sim.domain}:${sim.id}`;
  SIMULATION_REGISTRY.set(key, sim);
}

function param(key: string, label: string, min: number, max: number, step: number, def: number, required = true): SimulationParameter {
  return {
    key,
    label,
    type: Number.isInteger(step) && step >= 1 ? 'integer' : 'number',
    min,
    max,
    step,
    default: def,
    required,
  };
}

function paramExt(
  key: string,
  label: string,
  min: number,
  max: number,
  step: number,
  def: number,
  required: boolean,
  extra: { unit?: string; description?: string }
): SimulationParameter {
  return {
    key,
    label,
    type: Number.isInteger(step) && step >= 1 ? 'integer' : 'number',
    min,
    max,
    step,
    default: def,
    required,
    ...extra,
  };
}

// ═══════════════════════════════════════════════════════════════════
// PHYSICS
// ═══════════════════════════════════════════════════════════════════

register({
  id: 'relativity',
  name: 'Special Relativity Dilation',
  description: 'Observe spatial contraction and moving clock dilation as velocity approaches light speed.',
  domain: 'physics',
  equation: "t' = \\frac{t}{\\sqrt{1 - v^2/c^2}}",
  parameters: [
    paramExt('speed', 'Velocity (v/c)', 0.0, 0.99, 0.01, 0.5, true, {
      description: 'Fraction of light speed',
    }),
  ],
});

register({
  id: 'motion',
  name: 'Newtonian Motion Sandbox',
  description: 'Examine inertia, applied forces, and friction acting dynamically on a moving particle.',
  domain: 'physics',
  equation: "a = \\frac{F_{thrust} - \\mu m g}{m}",
  parameters: [
    param('force', 'Thrust Force (N)', 0, 50, 1, 15),
    param('mass', 'Inertial Mass (kg)', 1, 20, 0.5, 5),
    param('friction', 'Friction Coefficient (μ)', 0, 0.8, 0.05, 0.2),
  ],
});

register({
  id: 'gravity',
  name: 'Satellite Gravity System',
  description: 'Model centripetal orbital vectors balancing deep gravitational acceleration.',
  domain: 'physics',
  equation: "v_{orbit} = \\sqrt{\\frac{G \\cdot M}{r}}",
  parameters: [
    param('orbitalRadius', 'Orbit Radius (r)', 3, 14, 0.5, 8),
    param('centralMass', 'Stellar Mass (M)', 50, 300, 10, 150),
  ],
});

register({
  id: 'pendulum',
  name: 'Simple Harmonic Pendulum',
  description: 'Observe the regular periodicity of gravitational acceleration balancing cable lengths.',
  domain: 'physics',
  equation: "T = 2\\pi\\sqrt{\\frac{L}{g}}",
  parameters: [
    param('length', 'Cable Length (L meters)', 2, 12, 0.5, 6),
    param('gravity', 'Gravitational (g m/s²)', 1.6, 25.0, 0.2, 9.8),
  ],
});

register({
  id: 'thermodynamics',
  name: 'Ideal Gas Pressure Sandbox',
  description: 'Model thermodynamic kinetic energy collisions within a bounded volume chamber.',
  domain: 'physics',
  equation: "P = \\frac{n \\cdot R \\cdot T}{V}",
  parameters: [
    param('temperature', 'Temperature (T Kelvin)', 100, 600, 10, 300),
    param('volume', 'Chamber Volume (V Liters)', 2, 15, 0.5, 5),
  ],
});

register({
  id: 'optics',
  name: 'Snell Refraction Wave',
  description: 'Graph the velocity bending paths of light waves transitioning boundary indices.',
  domain: 'physics',
  equation: "n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)",
  parameters: [
    param('index1', 'Medium 1 Refraction (n₁)', 1.0, 2.5, 0.1, 1.0),
    param('index2', 'Medium 2 Refraction (n₂)', 1.0, 2.5, 0.1, 1.5),
    param('angle1', 'Incident Angle (θ₁°)', 0, 85, 1, 45),
  ],
});

register({
  id: 'wave_interference',
  name: 'Double Slit Interference',
  description: 'Observe crests and troughs overlapping to form phase shifts and bright fringes.',
  domain: 'physics',
  equation: "y = \\frac{L \\cdot \\lambda}{d}",
  parameters: [
    param('wavelength', 'Light Color (λ nm)', 380, 750, 10, 550),
    param('slitDistance', 'Slit Separation (d µm)', 4, 24, 0.5, 12),
  ],
});

register({
  id: 'electrostatics',
  name: 'Coulomb Particle Force',
  description: 'Model deep attraction and repulsion vectors acting between static charges.',
  domain: 'physics',
  equation: "F = k_e \\cdot \\frac{q_1 \\cdot q_2}{r^2}",
  parameters: [
    param('charge1', 'Charge 1 (q₁ µC)', -30, 30, 1, 10),
    param('charge2', 'Charge 2 (q₂ µC)', -30, 30, 1, -10),
    param('distance', 'Separation Radius (r cm)', 2, 12, 0.2, 5),
  ],
});

// ═══════════════════════════════════════════════════════════════════
// BIOLOGY
// ═══════════════════════════════════════════════════════════════════

register({
  id: 'bacteria',
  name: 'Bacterial Logistic Colony',
  description: 'Simulate logarithmic cell division, growth phases, and carrying capacity saturation.',
  domain: 'biology',
  equation: "\\frac{dN}{dt} = r \\cdot N \\left(1 - \\frac{N}{K}\\right)",
  parameters: [
    param('temperature', 'Growth Temp (°C)', 5, 50, 1, 37),
    param('nutrientLevel', 'Nutrients index (K)', 1, 10, 0.5, 6),
  ],
});

register({
  id: 'virus',
  name: 'Pathogen SIR Spread',
  description: 'Model dynamic virus transmission through compartment interactions (Susceptible-Infected-Recovered).',
  domain: 'biology',
  equation: "R_0 = \\frac{\\beta}{\\gamma}",
  parameters: [
    param('transmissionRate', 'Transmission Rate (β)', 0.1, 0.9, 0.05, 0.5),
    param('recoveryRate', 'Recovery Frequency (γ)', 0.02, 0.3, 0.01, 0.1),
    param('populationSize', 'Population Size (N)', 30, 300, 10, 120),
  ],
});

register({
  id: 'immune',
  name: 'Cellular Immune Sweep',
  description: 'Observe white blood phagocytes recruit via chemotaxis to engulf foreign pathogens.',
  domain: 'biology',
  equation: "\\frac{dP}{dt} = r_p P - k P \\cdot WBC",
  parameters: [
    param('pathogenCount', 'Pathogens (Red)', 10, 100, 5, 40),
    param('wbcCount', 'Leukocytes (Green)', 2, 35, 1, 15),
  ],
});

register({
  id: 'genetics',
  name: 'Mendel Punnett Alleles',
  description: 'Observe gene distribution frequencies and Hardy-Weinberg equilibrium offsets.',
  domain: 'biology',
  equation: "p^2 + 2pq + q^2 = 1.0",
  parameters: [
    param('dominantRatio', 'Dominant Allele Frequency (p)', 0.05, 0.95, 0.05, 0.6),
  ],
});

register({
  id: 'photosynthesis',
  name: 'Chlorophyll Photon Absorption',
  description: 'Observe the energetic rate of photon capture and carbon conversion processes.',
  domain: 'biology',
  equation: "Rate \\propto Light \\cdot CO_2",
  parameters: [
    param('lightIntensity', 'Light Flux (lux)', 1, 12, 0.5, 8),
    param('co2Level', 'Carbon Concent (PPM)', 1, 8, 0.5, 4),
  ],
});

register({
  id: 'enzymes',
  name: 'Lock & Key Reaction Kinetic',
  description: 'Observe metabolic reaction speeds saturating enzyme active sites.',
  domain: 'biology',
  equation: "v = \\frac{V_{max} \\cdot [S]}{K_m + [S]}",
  parameters: [
    param('substrateConc', 'Substrate Count [S]', 1, 12, 0.5, 5),
    param('enzymeConc', 'Enzyme Concentration', 1, 8, 0.5, 3),
  ],
});

register({
  id: 'osmosis',
  name: 'Semi-permeable Membrane Fluid',
  description: 'Examine water molecules moving across membrane barriers to balance solute pressures.',
  domain: 'biology',
  equation: "\\Pi = i \\cdot M \\cdot R \\cdot T",
  parameters: [
    param('soluteRatio', 'Intracellular Salt (%)', 1, 8, 0.2, 4),
  ],
});

register({
  id: 'ecosystem',
  name: 'Predator-Prey Lotka-Volterra',
  description: 'Model dynamic oscillations as populations balance hunting frequencies.',
  domain: 'biology',
  equation: "\\frac{dx}{dt} = \\alpha x - \\beta x y",
  parameters: [
    param('preyPopulation', 'Primary Herbivores (x)', 20, 100, 5, 60),
    param('predatorPopulation', 'Apex Predators (y)', 5, 35, 1, 15),
  ],
});

// ═══════════════════════════════════════════════════════════════════
// ANATOMY
// ═══════════════════════════════════════════════════════════════════

register({
  id: 'heart',
  name: 'Cardiovascular Output',
  description: 'Measure mechanical blood flow pumped per minute through systemic ventricles.',
  domain: 'anatomy',
  equation: "CO = HR \\cdot SV",
  parameters: [
    param('heartRate', 'Heart Rate (BPM)', 40, 180, 5, 72),
    param('strokeVolume', 'Stroke Volume (mL)', 40, 125, 5, 70),
  ],
});

register({
  id: 'neural',
  name: 'Axonal Signaling Pulse',
  description: 'Fire electrical depolarization spikes along myelinated nerve fibers.',
  domain: 'anatomy',
  equation: "v_{conduction} \\propto myelin",
  parameters: [
    param('stimulusStrength', 'Stimulus (mV)', 1, 10, 0.5, 5),
    param('myelination', 'Myelin Sheath factor', 1, 4, 0.5, 2),
  ],
});

register({
  id: 'blood',
  name: 'Vascular Poiseuille Flow',
  description: 'Observe how minor vasoconstrictions logarithmically drop flow rates.',
  domain: 'anatomy',
  equation: "Q = \\frac{\\Delta P \\cdot \\pi \\cdot r^4}{8 \\eta L}",
  parameters: [
    param('vesselRadius', 'Lumen Radius (r)', 1, 5, 0.1, 3),
    param('bloodPressure', 'Perfusion Pressure (ΔP)', 50, 150, 5, 100),
  ],
});

register({
  id: 'nephron',
  name: 'Glomerular Renal Filtration',
  description: 'Observe dynamic capillary blood filtering across Bowman capsule glomeruli.',
  domain: 'anatomy',
  equation: "GFR = K_f \\cdot (P_g - P_b - \\pi_g)",
  parameters: [
    param('filterPressure', 'Glomerular Pressure (Pᵢ)', 30, 70, 1, 45),
    param('urineResistance', 'Bowman Resistance (Pᵦ)', 5, 25, 0.5, 12),
  ],
});

register({
  id: 'pulmonary',
  name: 'Alveolar Gas Exchange',
  description: 'Examine oxygen diffusion across thin wet respiratory cell borders.',
  domain: 'anatomy',
  equation: "V_{gas} \\propto \\frac{A \\cdot D \\cdot \\Delta P}{T}",
  parameters: [
    param('oxygenPartialPress', 'Alveolar O₂ Pressure (ΔP)', 60, 130, 2, 104),
    param('barrierThickness', 'Membrane Width (T µm)', 1, 5, 0.2, 2),
  ],
});

register({
  id: 'muscle',
  name: 'Actomyosin Cross-Bridge Slide',
  description: 'Examine sliding sarcomere fibers contracting on calcium ion updates.',
  domain: 'anatomy',
  equation: "F = F_0 \\left(1 - \\frac{v}{v_{max}}\\right)",
  parameters: [
    param('calciumLevel', 'Intracellular Ca²⁺ ions', 1, 10, 0.5, 5),
    param('atpAvailability', 'ATP Energy concentration', 2, 12, 0.5, 8),
  ],
});

register({
  id: 'endocrine',
  name: 'Insulin Glucose Hormonal Loop',
  description: 'Observe systemic loops adjusting blood sugar via beta-cell insulin updates.',
  domain: 'anatomy',
  equation: "\\frac{dG}{dt} = I_{prod} - I_{util} \\cdot G",
  parameters: [
    param('carbIntake', 'Carb Load (g)', 10, 120, 5, 60),
    param('insulinSensitivity', 'Insulin Affinity', 1, 8, 0.2, 4),
  ],
});

register({
  id: 'bone',
  name: 'Osteoblast Calcium Deposit',
  description: 'Model dynamic bone remodeling mineral deposition ratios.',
  domain: 'anatomy',
  equation: "Bone_{mass} \\propto D_3 \\cdot Cal",
  parameters: [
    param('calciumIntake', 'Dietary Calcium (mg)', 2, 15, 0.5, 8),
    param('vitaminD', 'Vitamin D₃ index', 1, 10, 0.5, 5),
  ],
});

// ═══════════════════════════════════════════════════════════════════
// MATHEMATICS
// ═══════════════════════════════════════════════════════════════════

register({
  id: 'functions',
  name: 'Combined Functions',
  description: 'Graph trigonometric polynomial waveforms over Cartesian coordinate plane.',
  domain: 'mathematics',
  equation: "f(x) = m \\cdot x + A \\cdot \\sin(x)",
  parameters: [
    param('slope', 'Linear Slope (m)', -4, 4, 0.1, 1.5),
    param('amplitude', 'Sinusoidal Amplitude (A)', 0, 8, 0.2, 4),
  ],
});

register({
  id: 'probability',
  name: 'Galton Board Central Limit',
  description: 'Drop thousands of random beads through triangular pegs to trace a Gaussian normal curve.',
  domain: 'mathematics',
  equation: "P(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}}e^{-\\frac{(x-\\mu)^2}{2\\sigma^2}}",
  parameters: [
    param('beadsCount', 'Beads dropped (N)', 50, 400, 10, 200),
  ],
});

register({
  id: 'graph',
  name: 'Network Graph Emergence',
  description: 'Generate random Erdős-Rényi node clusters to discover structural giant components.',
  domain: 'mathematics',
  equation: "G(n, p) \\implies phase\\,transition\\,at\\,p \\approx 1/n",
  parameters: [
    param('nodesCount', 'Vertices (n)', 10, 50, 1, 30),
    param('connectionProbability', 'Link Probability (p)', 0, 0.5, 0.01, 0.15),
  ],
});

register({
  id: 'chaos',
  name: 'Lorenz Chaotic Attractor',
  description: 'Model dynamic butterfly effects as trajectories orbit triple-dimensional attractors.',
  domain: 'mathematics',
  equation: "\\sigma=10, \\rho=28, \\beta=8/3",
  parameters: [
    param('chaosRho', 'Rayleigh Factor (ρ)', 14, 40, 0.5, 28),
  ],
});

register({
  id: 'fractal',
  name: 'Mandelbrot Iteration Plane',
  description: 'Observe dynamic complex sets rendering infinite geometric boundaries.',
  domain: 'mathematics',
  equation: "z_{n+1} = z_n^2 + c",
  parameters: [
    param('iterationsLimit', 'Depth Iterations (n)', 10, 80, 2, 40),
  ],
});

register({
  id: 'fourier',
  name: 'Sine Harmonic Synthesizer',
  description: 'Overlap discrete sine frequencies to build perfect square, triangle, or sawtooth waves.',
  domain: 'mathematics',
  equation: "f(t) = \\sum A_n \\sin(n \\omega t)",
  parameters: [
    param('harmonicCount', 'Harmonic Iterations (n)', 1, 12, 1, 3),
  ],
});

register({
  id: 'calculus',
  name: 'Riemann Integral Area',
  description: 'Observe sub-divided rectangle areas summing closer to exact curve integration boundaries.',
  domain: 'mathematics',
  equation: "\\int_a^b f(x) dx \\approx \\sum f(x_i) \\Delta x",
  parameters: [
    param('rectanglesCount', 'Subdivisions (n columns)', 4, 48, 2, 16),
  ],
});

register({
  id: 'fibonacci',
  name: 'Golden Spiral Growth',
  description: 'Watch shell patterns trace the mathematical logarithmic spiral limits.',
  domain: 'mathematics',
  equation: "\\phi = \\frac{1+\\sqrt{5}}{2} \\approx 1.618",
  parameters: [
    param('spiralScale', 'Growth Vector Scale', 1, 8, 0.2, 4),
  ],
});

// ═══════════════════════════════════════════════════════════════════
// QUANTUM
// ═══════════════════════════════════════════════════════════════════

register({
  id: 'wave',
  name: 'Quantized Wave Function',
  description: 'Solve standing particle wavefunctions confined inside infinite potential well boxes.',
  domain: 'quantum',
  equation: "\\psi_n(x) = \\sqrt{\\frac{2}{L}} \\sin\\left(\\frac{n \\pi x}{L}\\right)",
  parameters: [
    param('energyLevel', 'Energy Level (n)', 1, 6, 1, 2),
    param('wellWidth', 'Well Width (L Bohr)', 4, 12, 0.5, 8),
  ],
});

register({
  id: 'uncertainty',
  name: 'Heisenberg Conjugate spreads',
  description: 'Squeeze the spatial spread packet to see conjugate momentum spread scatter widely.',
  domain: 'quantum',
  equation: "\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}",
  parameters: [
    param('positionSpread', 'Spatial Spread (Δx)', 0.4, 4.0, 0.1, 1.5),
  ],
});

register({
  id: 'tunneling',
  name: 'Potential Barrier Tunneling',
  description: 'Observe finite probability waves leaking through mathematically forbidden barriers.',
  domain: 'quantum',
  equation: "T \\approx e^{-2\\kappa a}",
  parameters: [
    param('barrierHeight', 'Barrier Voltage (V₀)', 5, 15, 0.5, 8),
    param('particleEnergy', 'Incident Energy (E)', 1, 10, 0.5, 4),
  ],
});

register({
  id: 'spin',
  name: 'Bloch Sphere Qubit Spin',
  description: 'Rotate a unitary state qubit vectors across latitude and longitude lines.',
  domain: 'quantum',
  equation: "|\\psi\\rangle = \\cos\\frac{\\theta}{2}|0\\rangle + e^{i\\phi}\\sin\\frac{\\theta}{2}|1\\rangle",
  parameters: [
    param('spinTheta', 'Latitude Angle (θ°)', 0, 180, 5, 90),
    param('spinPhi', 'Phase Angle (φ°)', 0, 360, 10, 45),
  ],
});

register({
  id: 'entanglement',
  name: 'Bell State Spooky Core',
  description: 'Examine quantum correlation distributions between entangled particles.',
  domain: 'quantum',
  equation: "|\\Phi^+\\rangle = \\frac{|00\\rangle + |11\\rangle}{\\sqrt{2}}",
  parameters: [
    param('correlationAngle', 'Measurement Angle (θ°)', 0, 90, 5, 45),
  ],
});

register({
  id: 'hydrogen',
  name: 'Bohr Atomic Radius',
  description: 'Observe stable quantized hydrogen electron orbit shells.',
  domain: 'quantum',
  equation: "r_n = n^2 \\cdot a_0",
  parameters: [
    param('quantumNumber', 'Principal Shell (n)', 1, 5, 1, 2),
  ],
});

register({
  id: 'harmonic',
  name: 'Quantum Harmonic Wave',
  description: 'Graph parabolic well energy states matching Hermite polynomial packets.',
  domain: 'quantum',
  equation: "E_n = (n + 1/2)\\hbar\\omega",
  parameters: [
    param('oscillatorEnergy', 'Vibrational State (n)', 0, 4, 1, 1),
  ],
});

register({
  id: 'superposition',
  name: 'Dual State Collapse',
  description: 'Watch coherent dual states collapse instantly to definite values on measurement.',
  domain: 'quantum',
  equation: "|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle",
  parameters: [
    param('probabilityAlpha', 'State |0⟩ Weight (%)', 0, 100, 5, 50),
  ],
});

// ═══════════════════════════════════════════════════════════════════
// SPACE
// ═══════════════════════════════════════════════════════════════════

register({
  id: 'orbit',
  name: 'Planetary Kepler Orbits',
  description: 'Trace orbital periods and speeds governed by Kepler\'s harmonic proportional laws.',
  domain: 'space',
  equation: "T^2 = \\frac{4\\pi^2}{GM} \\cdot a^3",
  parameters: [
    param('orbitSemiMajorAxis', 'Orbital Axis (a AU)', 4, 18, 0.5, 10),
    param('starMass', 'Central Solar Mass (M)', 40, 240, 10, 120),
  ],
});

register({
  id: 'blackhole',
  name: 'Schwarzspacetime Curvature',
  description: 'Measure severe gravitational redshifting surrounding static event horizons.',
  domain: 'space',
  equation: "r_s = \\frac{2 G M}{c^2}",
  // Physically scoped parameter space (RF-1): rs = 2.95·M ≤ 38.35 km for
  // M ≤ 13, probe r ≥ 39 km ⇒ r > rs for every in-registry combination,
  // keeping the time-dilation factor 1/√(1−rs/r) finite and real everywhere.
  parameters: [
    param('blackholeMass', 'Black Hole Mass (M☉)', 5, 13, 1, 10),
    param('probeDistance', 'Probe Radius (r km)', 39, 60, 1, 45),
  ],
});

register({
  id: 'stellar',
  name: 'Stellar Collapse timeline',
  description: 'Trigger core fuel fusion collapse based solely on initial stellar birth mass.',
  domain: 'space',
  equation: "M_{initial} \\implies remnants",
  parameters: [
    param('initialMass', 'Initial Birth Mass (M☉)', 0.1, 40, 0.5, 8),
  ],
});

register({
  id: 'cosmology',
  name: 'Hubble Expanding Universe',
  description: 'Observe dynamic Doppler galaxy redshifting relative to cosmic expansion boundaries.',
  domain: 'space',
  equation: "v = H_0 \\cdot d",
  parameters: [
    param('hubbleConstant', 'Hubble Constant (H₀)', 50, 90, 2, 70),
  ],
});

register({
  id: 'nebula',
  name: 'Jeans Nebula Collapse',
  description: 'Observe how gas pressure balances thermal limits to trigger dust star collapse.',
  domain: 'space',
  equation: "M_J \\propto T^{3/2} \\cdot \\rho^{-1/2}",
  parameters: [
    param('dustDensity', 'Gas Core Density (ρ)', 1, 10, 0.5, 4),
    param('gasTemp', 'Cloud Temperature (T K)', 5, 50, 1, 20),
  ],
});

register({
  id: 'tides',
  name: 'Lunar Tidal Bulge Pull',
  description: 'Model dynamic planetary ocean bulge elevations pulled by gravity.',
  domain: 'space',
  equation: "F_{tidal} \\propto \\frac{M_{moon}}{d^3}",
  parameters: [
    param('moonDistance', 'Orbital Distance (d Earth radii)', 4, 15, 0.5, 8),
  ],
});

register({
  id: 'magnetosphere',
  name: 'Solar Wind Deflection',
  description: 'Observe planetary core dipoles redirecting high-energy coronal mass ions.',
  domain: 'space',
  equation: "r_{magneto} \\propto B^{1/3}",
  parameters: [
    param('windVelocity', 'Solar Wind Speed (v)', 1, 10, 0.5, 5),
    param('fieldStrength', 'Core Dipole Power (B)', 2, 15, 0.5, 8),
  ],
});

register({
  id: 'pulsar',
  name: 'Relativistic Pulsar Jet',
  description: 'Examine high-speed magnetic field rotations emitting massive radio cones.',
  domain: 'space',
  equation: "P_{spin} \\approx ms",
  parameters: [
    param('rotationSpeed', 'Spin Period (milliseconds)', 1, 20, 0.5, 6),
  ],
});

// ═══════════════════════════════════════════════════════════════════
// EXPORTED LOOKUP FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Look up a simulation definition by ID and domain.
 * Returns null if not found.
 */
export function getSimulation(
  simulationId: string,
  domain: string
): SimulationDefinition | null {
  const key = `${domain.toLowerCase()}:${simulationId.toLowerCase()}`;
  return SIMULATION_REGISTRY.get(key) ?? null;
}

/**
 * Get all simulation definitions for a given domain.
 */
export function getSimulationsByDomain(
  domain: ScientificDomain
): SimulationDefinition[] {
  const results: SimulationDefinition[] = [];
  const iterator = SIMULATION_REGISTRY.values();
  for (let item = iterator.next(); item.done !== true; item = iterator.next()) {
    const sim = item.value;
    if (sim.domain === domain) {
      results.push(sim);
    }
  }
  return results;
}

/**
 * Get all simulations grouped by domain.
 */
export function getAllSimulations(): Record<ScientificDomain, SimulationDefinition[]> {
  const result = {} as Record<ScientificDomain, SimulationDefinition[]>;
  for (const domain of DOMAIN_ORDER) {
    result[domain] = getSimulationsByDomain(domain);
  }
  return result;
}

/**
 * Get the full list of all simulation IDs (for AI prompt context).
 */
export function getAllSimulationIds(): string[] {
  return Array.from(SIMULATION_REGISTRY.values()).map((s) => s.id);
}

/**
 * Convert a SimulationDefinition to the lightweight client config format.
 * Extracts defaultParams and paramsList; paramsList preserves the FULL
 * canonical parameter metadata (label, unit, type, bounds, step, default,
 * required) so the client projection loses nothing.
 */
export function toClientSimulation(sim: SimulationDefinition): ClientSimulation {
  return {
    id: sim.id,
    name: sim.name,
    desc: sim.description,
    equation: sim.equation,
    defaultParams: Object.fromEntries(
      sim.parameters.map((p) => [p.key, p.default])
    ),
    paramsList: sim.parameters,
  };
}
