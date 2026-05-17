import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { ApiResponseHandler } from '@/lib/utils/response';
import { SimulationConfig } from '@/database/models/simulation-config';

// 48 Calibrated Simulation configurations (8 per domain)
const SEED_CONFIGS = [
  {
    domainKey: "physics",
    name: "Physics Labs",
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
        desc: "Model thermodynamic kinetic energy collisons within a bounded volume chamber.",
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
  {
    domainKey: "biology",
    name: "Biology Labs",
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
        defaultParams: { transmissionRate: 0.5, recoveryRate: 0.1 },
        paramsList: [
          { key: "transmissionRate", label: "Transmission Rate (\u03b2)", min: 0.1, max: 0.9, step: 0.05 },
          { key: "recoveryRate", label: "Recovery Frequency (\u03b3)", min: 0.02, max: 0.3, step: 0.01 }
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
  {
    domainKey: "anatomy",
    name: "Anatomy Labs",
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
  {
    domainKey: "mathematics",
    name: "Math Labs",
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
  {
    domainKey: "quantum",
    name: "Quantum Labs",
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
  {
    domainKey: "space",
    name: "Space Labs",
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
];

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Check if dynamic configurations are present. If empty, self-seed immediately.
    const count = await SimulationConfig.countDocuments();
    if (count === 0) {
      console.log("[Simulation Config API] Seeding 48 simulation configs...");
      await SimulationConfig.insertMany(SEED_CONFIGS);
    }

    const configs = await SimulationConfig.find({}).lean();
    return ApiResponseHandler.success(configs);
  } catch (err: any) {
    console.error("[Simulation Config API] Fetch failed:", err);
    return ApiResponseHandler.internalError("Failed to retrieve simulation configurations.");
  }
}
