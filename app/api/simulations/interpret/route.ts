import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { logger } from '@/lib/logger';
import { SimulationRun } from '@/database/models/simulation-run';
import mongoose from 'mongoose';
import { requireSimulationCsrfProtection } from '@/lib/security/simulation-security';
import { validateSimulationRun, SimulationRunCreateSchema } from '@/lib/security/validation';

const MODEL_NAME = 'google/gemma-4-26b-a4b-it:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_TIMEOUT_MS = 6000; // 6 seconds threshold

// Offline High-Fidelity Scientific Fallback Engine for the 6 Domains
function generateLocalSimulationFallback(
  domain: string,
  simulationId: string,
  parameters: Record<string, unknown>
): string {
  const diff =
    (typeof parameters.speed === 'number' && parameters.speed > 0.8) ||
    (typeof parameters.energyLevel === 'number' && parameters.energyLevel > 4) ||
    (typeof parameters.initialMass === 'number' && parameters.initialMass > 15)
      ? 'advanced'
      : 'intermediate';
  
  let explanation = '';
  let insights: string[] = [];
  let concepts: string[] = [];
  let actions: string[] = [];

  const safeParam = (key: string, fallback: number) => {
    return typeof parameters[key] === 'number' ? parameters[key] : fallback;
  };

  switch (domain.toLowerCase()) {
    case 'physics':
      if (simulationId === 'relativity') {
        const v = safeParam('speed', 0.5);
        const lorentz = 1 / Math.sqrt(1 - v * v);
        explanation = `Under Special Relativity, as an object's speed approaches the speed of light ($c$), spacetime coordinates deform deterministically. At your configured velocity of ${v.toFixed(2)}c, the Lorentz factor (gamma) is calculated precisely as ${lorentz.toFixed(3)}. Consequently, moving clocks tick slower by a factor of ${lorentz.toFixed(2)} relative to a stationary observer, and spatial length contracts in the direction of motion.`;
        insights = [
          `Lorentz factor reaches ${lorentz.toFixed(3)} at velocity ${v}c.`,
          `Time dilation dictates a clock tick interval of ${(1/lorentz).toFixed(3)} seconds relative to baseline.`,
          `Space contracts to ${(100/lorentz).toFixed(1)}% of original length along the axis of travel.`
        ];
        concepts = ['Lorentz Transformation', 'Special Relativity', 'Spacetime Contraction', 'Time Dilation'];
        actions = [
          'Increase speed to 0.95c to observe extreme length contraction and time dilation asymptotic behavior.',
          'Decrease speed below 0.10c to compare relativistic telemetry with classical Newtonian mechanics.'
        ];
      } else if (simulationId === 'motion') {
        const f = safeParam('force', 10);
        const m = safeParam('mass', 5);
        const mu = safeParam('friction', 0.2);
        const acc = Math.max(0, (f - mu * m * 9.8) / m);
        explanation = `According to Newton's Second Law of Motion ($F = ma$), acceleration is directly proportional to net force and inversely proportional to inertial mass. With a thrust force of ${f} N, a mass of ${m} kg, and a friction coefficient of ${mu.toFixed(2)}, the retarding force of friction equals ${(mu * m * 9.8).toFixed(2)} N. The net resulting acceleration is calculated as ${acc.toFixed(2)} m/s².`;
        insights = [
          `Applied thrust force is ${f} N against a frictional coefficient of ${mu.toFixed(2)}.`,
          `Opposing frictional force is ${(mu * m * 9.8).toFixed(2)} N, acting in opposition to movement.`,
          `Net acceleration of the system is ${acc.toFixed(2)} m/s².`
        ];
        concepts = ['Newtonian Mechanics', 'Inertial Mass', 'Frictional Resistance', 'Vector Forces'];
        actions = [
          'Increase the applied force slider to overcome the threshold of static friction.',
          'Increase the mass slider to observe how inertia dampens acceleration under identical force.'
        ];
      } else if (simulationId === 'pendulum') {
        const L = safeParam('length', 6);
        const g = safeParam('gravity', 9.8);
        const T = 2 * Math.PI * Math.sqrt(L / g);
        explanation = `A simple pendulum swings with a period governed by its cable length and local gravity: T = 2π√(L/g). With a cable length of ${L} m and gravitational acceleration ${g} m/s², the period resolves to ${T.toFixed(2)} seconds. Shorter cables oscillate faster, while stronger gravity compresses the period.`;
        insights = [
          `Cable length L is ${L} meters.`,
          `Gravitational acceleration g is ${g} m/s².`,
          `Oscillation period T resolves to ${T.toFixed(2)} s.`
        ];
        concepts = ['Simple Harmonic Motion', 'Period of a Pendulum', 'Gravitational Acceleration', 'Restoring Force'];
        actions = [
          'Shorten the cable to observe a faster, tighter oscillation period.',
          'Increase gravity to compress the period and accelerate the swing.'
        ];
      } else if (simulationId === 'thermodynamics') {
        const T = safeParam('temperature', 300);
        const V = safeParam('volume', 5);
        const P = (8.314 * T) / V;
        explanation = `An ideal gas obeys the equation of state P = nRT/V. With one mole of gas at temperature ${T} K inside a chamber volume of ${V} L, the pressure reaches ${P.toFixed(1)} kPa. Raising temperature increases kinetic collisions against the walls, while expanding the volume dilutes that pressure.`;
        insights = [
          `Absolute temperature T is ${T} K.`,
          `Chamber volume V is ${V} L.`,
          `Resulting pressure P resolves to ${P.toFixed(1)} kPa.`
        ];
        concepts = ['Ideal Gas Law', 'Kinetic Theory', 'Pressure-Volume Relationship', 'Absolute Temperature'];
        actions = [
          'Raise the temperature to watch pressure climb as molecular collisions intensify.',
          'Enlarge the chamber volume to dilute pressure and slow the gas.'
        ];
      } else if (simulationId === 'optics') {
        const n1 = safeParam('index1', 1.0);
        const n2 = safeParam('index2', 1.5);
        const a1 = safeParam('angle1', 45);
        const sin2 = (n1 * Math.sin((a1 * Math.PI) / 180)) / n2;
        const a2 = Math.min(90, (Math.asin(Math.max(-1, Math.min(1, sin2))) * 180) / Math.PI);
        explanation = `Snell's law governs refraction at a boundary: n1·sin(θ1) = n2·sin(θ2). Light entering from a medium of index ${n1} at an incident angle of ${a1}° into a medium of index ${n2} bends to a refraction angle of ${a2.toFixed(1)}°. Higher target indices pull the ray closer to the normal.`;
        insights = [
          `Incident medium index n1 is ${n1}.`,
          `Refraction medium index n2 is ${n2}.`,
          `Refraction angle θ2 resolves to ${a2.toFixed(1)}°.`
        ];
        concepts = ['Snell Law', 'Refractive Index', 'Optical Boundary', 'Critical Angle'];
        actions = [
          'Increase the second medium index to bend the ray more sharply toward the normal.',
          'Raise the incident angle toward the critical angle to observe total internal reflection.'
        ];
      } else if (simulationId === 'wave_interference') {
        const lambda = safeParam('wavelength', 550);
        const d = safeParam('slitDistance', 12);
        const fringe = (1 * lambda) / d;
        explanation = `In a double-slit experiment, constructive interference forms bright fringes spaced by y = L·λ/d. For wavelength ${lambda} nm and slit separation ${d} µm (with screen distance L = 1 m), adjacent bright fringes sit ${fringe.toFixed(1)} µm apart. Narrower slits or longer wavelengths widen the fringe spacing.`;
        insights = [
          `Light wavelength λ is ${lambda} nm.`,
          `Slit separation d is ${d} µm.`,
          `Fringe spacing resolves to ${fringe.toFixed(1)} µm.`
        ];
        concepts = ['Wave Interference', 'Double-Slit Experiment', 'Constructive Fringes', 'Coherence'];
        actions = [
          'Widen the slit separation to compress the bright fringe spacing.',
          'Lengthen the wavelength to spread the interference pattern.'
        ];
      } else if (simulationId === 'electrostatics') {
        const q1 = safeParam('charge1', 10);
        const q2 = safeParam('charge2', -10);
        const r = safeParam('distance', 5);
        const F = (8.99 * q1 * q2) / (r * r);
        explanation = `Coulomb's law quantifies the force between static charges: F = k·q1·q2/r², with k ≈ 8.99. For charges ${q1} µC and ${q2} µC separated by ${r} cm, the force is ${F.toFixed(2)} N — negative values indicate attraction, positive indicate repulsion.`;
        insights = [
          `Charge 1 q1 is ${q1} µC.`,
          `Charge 2 q2 is ${q2} µC.`,
          `Net force F resolves to ${F.toFixed(2)} N (sign indicates attraction or repulsion).`
        ];
        concepts = ['Coulomb Law', 'Electric Field', 'Attraction and Repulsion', 'Inverse-Square Law'];
        actions = [
          'Flip the sign of one charge to switch between attraction and repulsion.',
          'Reduce the separation distance to amplify the force by the inverse square.'
        ];
      } else {
        // gravity
        const r = safeParam('orbitalRadius', 10);
        const m = safeParam('centralMass', 100);
        const vel = Math.sqrt((0.667 * m) / r);
        explanation = `In a central gravity field, a satellite's orbit remains stable when centrifugal force balances gravitational pull ($F_g = G \\frac{m_1 m_2}{r^2}$). For orbital radius ${r} units and central stellar mass ${m} units, the orbital velocity required for circular equilibrium is ${vel.toFixed(2)} units/sec. Increasing the central mass increases the gravity well depth, accelerating the satellite.`;
        insights = [
          `Stellar central gravity mass is set at ${m} units, dictating spatial curvature.`,
          `Orbital radius of the satellite is ${r} space units.`,
          `Deterministic Keplerian orbital velocity resolves to ${vel.toFixed(2)} units/sec.`
        ];
        concepts = ['Keplerian Orbit', 'Gravitational Constant', 'Centripetal Force', 'Escape Velocity'];
        actions = [
          'Reduce the orbital radius to see the satellite accelerate to maintain stable orbit.',
          'Double the central mass and observe the sudden orbital decay or escape path velocity shift.'
        ];
      }
      break;

    case 'biology':
      if (simulationId === 'bacteria') {
        const temp = safeParam('temperature', 37);
        const nutrient = safeParam('nutrientLevel', 5);
        explanation = `Bacterial growth exhibits four distinct phases: Lag, Log (exponential), Stationary, and Death. At temperature ${temp}°C and nutrient abundance of ${nutrient}/10, cellular metabolic processes are optimized. In the exponential phase, cell division follows first-order kinetics ($dN/dt = rN$), accelerating cell population doubling. If nutrients exhaust, the culture enters stationary phase and subsequent death phase.`;
        insights = [
          `Growth temperature set at ${temp}°C, near standard biological optima.`,
          `Nutrient concentration capacity index is ${nutrient}/10.`,
          `Growth rate is in the exponential Log phase, multiplying colony density rapidly.`
        ];
        concepts = ['Logistic Growth', 'Cellular Division', 'Metabolic Rate', 'Nutrient Depletion'];
        actions = [
          'Reduce temperature below 15°C to witness bacterial growth slowing to the Lag phase.',
          'Set nutrient level to maximum to observe prolonged, steep exponential growth before saturation.'
        ];
      } else if (simulationId === 'virus') {
        const trans = safeParam('transmissionRate', 0.5);
        const rec = safeParam('recoveryRate', 0.1);
        const r0 = trans / rec;
        explanation = `Epidemiological disease vectors operate under a deterministic compartmental SIR model (Susceptible-Infected-Recovered). With a transmission probability of ${trans.toFixed(2)} and a recovery frequency of ${rec.toFixed(2)}, the basic reproduction number ($R_0$) resolves to ${r0.toFixed(2)}. An $R_0 > 1.0$ indicates an epidemic expansion where the infected count spikes rapidly until herd immunity threshold is crossed.`;
        insights = [
          `Pathogen transmission parameter is ${trans.toFixed(2)}.`,
          `Recovery rate per infected cell/agent is ${rec.toFixed(2)}.`,
          `Calculated Reproduction Number (R0) is ${r0.toFixed(2)}, indicating ${r0 > 1 ? 'epidemic expansion' : 'pathogen containment'}.`
        ];
        concepts = ['Epidemic Vector Modeling', 'Basic Reproduction Number R0', 'Herd Immunity Threshold', 'Compartmental Transmission'];
        actions = [
          'Increase the recovery rate to model active medical therapy and witness the flattening of the infection curve.',
          'Lower transmission rate to simulate social containment measures, restricting peak active infections.'
        ];
      } else if (simulationId === 'genetics') {
        const p = safeParam('dominantRatio', 0.6);
        const q = 1 - p;
        const homDom = p * p;
        const het = 2 * p * q;
        const rec = q * q;
        explanation = `Mendelian inheritance distributes alleles by Hardy-Weinberg proportions p² + 2pq + q² = 1. With dominant allele frequency p = ${p}, the homozygous dominant fraction is ${(homDom * 100).toFixed(1)}%, heterozygous ${(het * 100).toFixed(1)}%, and recessive ${(rec * 100).toFixed(1)}%. Drift in p reshapes the entire genotype landscape.`;
        insights = [
          `Dominant allele frequency p is ${p}.`,
          `Heterozygous carriers make up ${(het * 100).toFixed(1)}%.`,
          `Recessive genotype fraction is ${(rec * 100).toFixed(1)}%.`
        ];
        concepts = ['Mendelian Genetics', 'Hardy-Weinberg Equilibrium', 'Allele Frequency', 'Genotype Ratios'];
        actions = [
          'Increase p to suppress the recessive phenotype frequency.',
          'Decrease p toward 0.5 to maximize heterozygous carrier diversity.'
        ];
      } else if (simulationId === 'photosynthesis') {
        const light = safeParam('lightIntensity', 8);
        const co2 = safeParam('co2Level', 4);
        const rate = light * co2;
        explanation = `Photosynthetic rate scales with photon flux and carbon availability (Rate ∝ Light × CO2). At light intensity ${light} lux and CO2 concentration ${co2} PPM, the relative fixation rate is ${rate.toFixed(1)} units. Either factor alone saturates the process when the other is limiting.`;
        insights = [
          `Light flux is ${light} lux.`,
          `Carbon concentration is ${co2} PPM.`,
          `Relative fixation rate is ${rate.toFixed(1)} units.`
        ];
        concepts = ['Photosynthesis', 'Light Reactions', 'Limiting Factors', 'Carbon Fixation'];
        actions = [
          'Raise light intensity to accelerate photon capture.',
          'Increase CO2 to relieve the carbon-limiting bottleneck.'
        ];
      } else if (simulationId === 'enzymes') {
        const S = safeParam('substrateConc', 5);
        const E = safeParam('enzymeConc', 3);
        const Km = 5;
        const v = (E * S) / (Km + S);
        explanation = `Enzyme kinetics follow Michaelis-Menten saturation: v = Vmax·[S]/(Km + [S]). With enzyme concentration ${E}, substrate [S] = ${S}, and Km = ${Km}, the reaction velocity is ${v.toFixed(2)} units. Adding more substrate eventually saturates the active sites.`;
        insights = [
          `Substrate concentration [S] is ${S}.`,
          `Enzyme concentration is ${E}.`,
          `Reaction velocity v is ${v.toFixed(2)} units.`
        ];
        concepts = ['Michaelis-Menten Kinetics', 'Enzyme Saturation', 'Active Site', 'Vmax'];
        actions = [
          'Increase substrate to approach the maximum velocity Vmax.',
          'Add more enzyme to raise the overall throughput ceiling.'
        ];
      } else if (simulationId === 'osmosis') {
        const solute = safeParam('soluteRatio', 4);
        const pi = solute * 2.5;
        explanation = `Osmotic pressure across a semi-permeable membrane follows Π = i·M·R·T. With intracellular solute at ${solute}%, the relative osmotic pressure is ${pi.toFixed(1)} units. Water migrates toward the higher solute side until equilibrium balances the pressures.`;
        insights = [
          `Intracellular solute concentration is ${solute}%.`,
          `Relative osmotic pressure is ${pi.toFixed(1)} units.`,
          `Water flows toward the higher solute compartment until pressures balance.`
        ];
        concepts = ['Osmosis', 'Semi-permeable Membrane', 'Osmotic Pressure', 'Tonicity'];
        actions = [
          'Raise solute ratio to draw water inward via osmotic pull.',
          'Lower solute to observe the cell swell as water exits.'
        ];
      } else if (simulationId === 'ecosystem') {
        const prey = safeParam('preyPopulation', 60);
        const pred = safeParam('predatorPopulation', 15);
        explanation = `Predator-prey dynamics follow the Lotka-Volterra equations: dx/dt = αx − βxy. With ${prey} primary herbivores and ${pred} apex predators, the populations settle into coupled oscillations — prey boom enables predator growth, which then crashes the prey, relaxing the predators in turn.`;
        insights = [
          `Prey population x is ${prey}.`,
          `Predator population y is ${pred}.`,
          `Systems exhibit cyclic boom-bust oscillations.`
        ];
        concepts = ['Lotka-Volterra Model', 'Predator-Prey Oscillation', 'Population Dynamics', 'Carrying Capacity'];
        actions = [
          'Increase prey to fuel a subsequent predator surge.',
          'Raise predators to witness the prey population crash.'
        ];
      } else {
        // immune
        const pathogen = safeParam('pathogenCount', 50);
        const wbc = safeParam('wbcCount', 20);
        explanation = `The host immunological response is a complex interaction modeled via predator-prey differential kinetics. Here, Pathogens (${pathogen} count) trigger chemotaxis, causing white blood cells (${wbc} count) to recruit and perform phagocytosis. When WBC capture rate exceeds pathogen replication, the infection is successfully cleared. If WBC count is insufficient, the pathogen population overrides host defenses.`;
        insights = [
          `Host pathogen count stands at ${pathogen} units.`,
          `White blood cell scavenger patrol is initialized at ${wbc} count.`,
          `Phagocytic phagocytosis dynamics indicates active cell-mediated clearance.`
        ];
        concepts = ['Cellular Phagocytosis', 'Pathogen Cytotoxicity', 'Chemotaxis Recruitment', 'Immune Clearance Kinetics'];
        actions = [
          'Boost the initial WBC count to observe rapid pathogen elimination and minimal host tissue damage.',
          'Raise the pathogen count to test the threshold at which the host immune system becomes overwhelmed.'
        ];
      }
      break;

    case 'anatomy':
      if (simulationId === 'heart') {
        const hr = safeParam('heartRate', 70);
        const sv = safeParam('strokeVolume', 70);
        const co = (hr * sv) / 1000;
        explanation = `Cardiac output ($CO$) is defined as the volume of blood pumped by the heart per minute, determined by the product of Heart Rate ($HR$) and Stroke Volume ($SV$). At $HR = ${hr}$ BPM and $SV = ${sv}$ mL, the cardiac output is ${co.toFixed(2)} L/min. To meet increased metabolic demands (e.g. exercise), sympathetic stimulation increases both variables, maximizing flow.`;
        insights = [
          `Cardiac Heart Rate set at ${hr} beats per minute.`,
          `Stroke Volume of ventricular contraction is ${sv} mL.`,
          `Total Cardiac Output equals ${co.toFixed(2)} Liters of oxygenated blood per minute.`
        ];
        concepts = ['Cardiac Output Dynamics', 'Ventricular Stroke Volume', 'Systolic Contraction Pressure', 'Myocardial Muscle Frequency'];
        actions = [
          'Increase Heart Rate to 120 BPM to simulate high metabolic aerobic exercise, tracking the rise in Cardiac Output.',
          'Decrease Stroke Volume to model cardiogenic impairment, watching how heart rate attempts compensatory increases.'
        ];
      } else if (simulationId === 'neural') {
        const stim = safeParam('stimulusStrength', 5);
        const myelin = safeParam('myelination', 1);
        explanation = `Neural signaling propagates via transient membrane potential fluctuations known as action potentials. When sensory stimulus exceeds a threshold (approx. -55mV), voltage-gated sodium channels trigger massive depolarization. With myelination at ${myelin}x index, action potential conduction utilizes saltatory conduction, jumping between Nodes of Ranvier, accelerating signaling velocity.`;
        insights = [
          `Axonal electrical stimulus strength is ${stim} mV.`,
          `Nerve fiber myelination index is ${myelin}x, multiplying conduction speed.`,
          `Conduction style is ${myelin > 1.5 ? 'Saltatory Action' : 'Continuous Membrane Wave'} propagation.`
        ];
        concepts = ['Membrane Depolarization', 'Saltatory Conduction', 'Nodes of Ranvier', 'Myelination Velocity Acceleration'];
        actions = [
          'Increase myelination to study how the myelin sheath dramatically accelerates impulse velocities.',
          'Decrease stimulus strength below the threshold to observe the sub-threshold graded potentials that fail to trigger.'
        ];
      } else if (simulationId === 'nephron') {
        const pg = safeParam('filterPressure', 45);
        const pb = safeParam('urineResistance', 12);
        const gfr = pg - pb;
        explanation = `Glomerular filtration rate depends on the net pressure across the Bowman capsule: GFR = Kf·(P_g − P_b − π_g). With glomerular pressure ${pg} mmHg and Bowman resistance ${pb} mmHg, the net driving pressure is ${gfr.toFixed(1)} mmHg. Higher glomerular pressure forces more plasma through the filter.`;
        insights = [
          `Glomerular pressure P_g is ${pg} mmHg.`,
          `Bowman resistance P_b is ${pb} mmHg.`,
          `Net filtration pressure is ${gfr.toFixed(1)} mmHg.`
        ];
        concepts = ['Glomerular Filtration', 'Bowman Capsule', 'Net Filtration Pressure', 'Renal Clearance'];
        actions = [
          'Raise glomerular pressure to increase filtration throughput.',
          'Increase Bowman resistance to throttle filtration.'
        ];
      } else if (simulationId === 'pulmonary') {
        const dp = safeParam('oxygenPartialPress', 104);
        const thick = safeParam('barrierThickness', 2);
        const vgas = dp / thick;
        explanation = `Alveolar gas exchange obeys Fick's law: V_gas ∝ A·D·ΔP/T. With alveolar O2 pressure ${dp} mmHg across a membrane ${thick} µm thick, the relative diffusion rate is ${vgas.toFixed(1)} units. A thinner barrier drastically accelerates oxygen uptake.`;
        insights = [
          `Alveolar O2 pressure ΔP is ${dp} mmHg.`,
          `Membrane thickness T is ${thick} µm.`,
          `Relative diffusion rate is ${vgas.toFixed(1)} units.`
        ];
        concepts = ['Fick Law of Diffusion', 'Alveolar Gas Exchange', 'Membrane Thickness', 'Partial Pressure'];
        actions = [
          'Thin the membrane to accelerate oxygen diffusion.',
          'Raise alveolar O2 pressure to push more gas across.'
        ];
      } else if (simulationId === 'muscle') {
        const ca = safeParam('calciumLevel', 5);
        const atp = safeParam('atpAvailability', 8);
        const force = ca * atp * 0.4;
        explanation = `Sliding-filament contraction scales with calcium-triggered cross-bridge recruitment and ATP fuel: F = F0(1 − v/vmax). With intracellular Ca²⁺ at ${ca} and ATP availability ${atp}, the relative contractile force is ${force.toFixed(1)} units. Calcium exposes binding sites; ATP powers the stroke.`;
        insights = [
          `Intracellular Ca²⁺ is ${ca}.`,
          `ATP availability is ${atp}.`,
          `Relative contractile force is ${force.toFixed(1)} units.`
        ];
        concepts = ['Sliding Filament Theory', 'Cross-Bridge Cycle', 'Calcium Signaling', 'ATP-Dependent Contraction'];
        actions = [
          'Increase calcium to expose more actin binding sites.',
          'Raise ATP availability to sustain repeated power strokes.'
        ];
      } else if (simulationId === 'endocrine') {
        const carbs = safeParam('carbIntake', 60);
        const sens = safeParam('insulinSensitivity', 4);
        explanation = `Blood glucose follows a feedback loop: dG/dt = I_prod − I_util·G. With a carb load of ${carbs} g and insulin affinity ${sens}, the system drives glucose down faster as insulin sensitivity rises. Low sensitivity leaves glucose elevated, modeling insulin resistance.`;
        insights = [
          `Carbohydrate load is ${carbs} g.`,
          `Insulin sensitivity is ${sens}.`,
          `Higher sensitivity clears glucose more rapidly.`
        ];
        concepts = ['Insulin Feedback Loop', 'Glucose Homeostasis', 'Insulin Sensitivity', 'Beta-Cell Response'];
        actions = [
          'Increase insulin sensitivity to clear blood glucose faster.',
          'Raise carb intake to stress the regulatory loop.'
        ];
      } else if (simulationId === 'bone') {
        const cal = safeParam('calciumIntake', 8);
        const d3 = safeParam('vitaminD', 5);
        const mass = cal * d3 * 0.5;
        explanation = `Bone remodeling deposits mineral in proportion to dietary calcium and vitamin D activation: Bone_mass ∝ D3·Cal. With calcium intake ${cal} mg and vitamin D index ${d3}, the relative deposit rate is ${mass.toFixed(1)} units. Vitamin D is required to absorb the calcium in the first place.`;
        insights = [
          `Dietary calcium is ${cal} mg.`,
          `Vitamin D3 index is ${d3}.`,
          `Relative mineral deposit rate is ${mass.toFixed(1)} units.`
        ];
        concepts = ['Osteoblast Deposition', 'Calcium Homeostasis', 'Vitamin D Activation', 'Bone Remodeling'];
        actions = [
          'Increase vitamin D to improve calcium absorption.',
          'Raise dietary calcium to feed mineral deposition.'
        ];
      } else {
        // blood
        const r = safeParam('vesselRadius', 3);
        const bp = safeParam('bloodPressure', 100);
        const flow = (bp * Math.pow(r, 4)) / 100;
        explanation = `Fluid dynamics in vascular anatomy are governed by Poiseuille's Law, which states that blood flow rate ($Q$) is directly proportional to pressure gradient ($\\Delta P$) and the fourth power of the vessel radius ($r^4$). For vessel radius ${r} mm and perfusion pressure of ${bp} mmHg, relative blood flow scales to ${flow.toFixed(1)} units. This explains why minor arterial constriction causes massive vascular resistance.`;
        insights = [
          `Arterial vessel radius is ${r} mm.`,
          `Mean arterial perfusion blood pressure is ${bp} mmHg.`,
          `Relative laminar blood flow volume through the lumen is calculated at ${flow.toFixed(1)} mL/sec.`
        ];
        concepts = ['Poiseuille Fluid Law', 'Vascular Hemodynamics', 'Vasoconstriction Resistance', 'Arterial Pressure Gradient'];
        actions = [
          'Reduce vessel radius by 50% to observe the logarithmic drop in blood flow and massive increase in resistance.',
          'Increase the pressure slider to model chronic arterial hypertension and track fluid turbulence.'
        ];
      }
      break;

    case 'mathematics':
      if (simulationId === 'functions') {
        const slope = safeParam('slope', 2);
        const amp = safeParam('amplitude', 5);
        explanation = `Mathematical curves visualize functional mappings in coordinate spaces. Here, the system plots a trigonometric function combining linear components and sinusoidal waves: $f(x) = ${slope}x + ${amp}\\sin(x)$. The coefficient of ${slope} governs linear velocity gradient, while the amplitude of ${amp} scales periodic oscillatory height.`;
        insights = [
          `Linear function gradient component is set to ${slope}.`,
          `Trigonometric periodic oscillation amplitude is ${amp}.`,
          `Inflection point coordinates update dynamically as values shift.`
        ];
        concepts = ['Trigonometric Periodic Functions', 'Amplitude Scaling Factor', 'Linear Gradient Slopes', 'Asymptotic Coordinates'];
        actions = [
          'Increase slope to stretch the function graph vertically, accelerating growth rates.',
          'Set amplitude to 0 to collapse the sine wave, reducing the curve to a perfect linear function.'
        ];
      } else if (simulationId === 'probability') {
        const beads = safeParam('beadsCount', 200);
        explanation = `A Galton Board probability system illustrates the Central Limit Theorem. As ${beads} individual beads drop through rows of triangular pegs, each bead undergoes a binary choice (left or right, $p=0.5$). The summation of these independent random choices generates a binomial distribution. As the number of beads increases, this converges towards a perfect bell-shaped Normal Gaussian Curve.`;
        insights = [
          `Total beads generated for simulation equals ${beads}.`,
          ` peg deflection probability is deterministic at 0.5.`,
          `Statistical distribution maps as a classic Binomial bell curve.`
        ];
        concepts = ['Central Limit Theorem', 'Binomial Probability Distribution', 'Galton Peg Probability', 'Gaussian Normal Curve'];
        actions = [
          'Increase beads count to 500 to see how the statistical noise flattens into a smooth Gaussian curve.',
          'Tweak bin distribution sizes to see how standard deviation and variance shift in real-time.'
        ];
      } else if (simulationId === 'chaos') {
        const rho = safeParam('chaosRho', 28);
        explanation = `The Lorenz system (σ = 10, ρ = ${rho}, β = 8/3) produces a chaotic butterfly attractor. At Rayleigh factor ρ = ${rho}, trajectories spiral around two unstable lobes, never repeating — the hallmark of deterministic chaos and sensitive dependence on initial conditions.`;
        insights = [
          `Rayleigh factor ρ is ${rho}.`,
          `Fixed parameters σ = 10, β = 8/3.`,
          `Trajectories trace a non-repeating strange attractor.`
        ];
        concepts = ['Lorenz Attractor', 'Deterministic Chaos', 'Strange Attractor', 'Sensitive Dependence'];
        actions = [
          'Push ρ above 24 to unleash full chaotic divergence.',
          'Lower ρ toward 14 to settle into a stable fixed point.'
        ];
      } else if (simulationId === 'fractal') {
        const iters = safeParam('iterationsLimit', 40);
        explanation = `The Mandelbrot set iterates zₙ₊₁ = zₙ² + c up to ${iters} depths. Points whose orbit stays bounded belong to the set; escaping points are colored by escape speed, revealing infinitely detailed boundaries at every zoom level.`;
        insights = [
          `Iteration depth is ${iters}.`,
          `Escape-time coloring reveals boundary detail.`,
          `Structure is self-similar at all scales.`
        ];
        concepts = ['Mandelbrot Set', 'Complex Iteration', 'Fractal Boundary', 'Escape-Time Algorithm'];
        actions = [
          'Increase iteration depth to resolve finer boundary filaments.',
          'Zoom into the boundary to expose recursive self-similarity.'
        ];
      } else if (simulationId === 'fourier') {
        const n = safeParam('harmonicCount', 3);
        explanation = `Fourier synthesis builds periodic waves as a sum of sines: f(t) = Σ Aₙ·sin(nωt). Overlapping ${n} harmonic frequencies reconstructs square, triangle, or sawtooth shapes — more terms approximate the target with sharper edges.`;
        insights = [
          `Harmonic count n is ${n}.`,
          `Each term adds a higher sine frequency.`,
          `More terms sharpen the reconstructed waveform.`
        ];
        concepts = ['Fourier Series', 'Harmonic Synthesis', 'Wave Decomposition', 'Orthogonality'];
        actions = [
          'Increase harmonic count to sharpen the reconstructed edges.',
          'Vary amplitudes to sculpt custom periodic waveforms.'
        ];
      } else if (simulationId === 'calculus') {
        const rects = safeParam('rectanglesCount', 16);
        explanation = `Riemann sums approximate an integral by stacking ${rects} rectangles: ∫ f(x)dx ≈ Σ f(xᵢ)Δx. More subdivisions sample the curve at finer resolution, driving the discrete sum toward the exact continuous area.`;
        insights = [
          `Subdivision count n is ${rects}.`,
          `Each rectangle samples f(xᵢ) over Δx.`,
          `Finer subdivisions converge to the true area.`
        ];
        concepts = ['Riemann Sum', 'Numerical Integration', 'Definite Integral', 'Convergence'];
        actions = [
          'Increase subdivisions to tighten the area estimate.',
          'Compare left, right, and midpoint rules for the same curve.'
        ];
      } else if (simulationId === 'fibonacci') {
        const scale = safeParam('spiralScale', 4);
        const phi = (1 + Math.sqrt(5)) / 2;
        explanation = `The golden spiral grows by the ratio φ = ${phi.toFixed(3)} ≈ 1.618. At growth scale ${scale}, each quarter-turn expands the radius by φ, tracing the logarithmic spiral found in shells and galaxies.`;
        insights = [
          `Growth scale is ${scale}.`,
          `Golden ratio φ is ${phi.toFixed(3)}.`,
          `Each turn multiplies radius by φ.`
        ];
        concepts = ['Golden Ratio', 'Logarithmic Spiral', 'Fibonacci Sequence', 'Phyllotaxis'];
        actions = [
          'Increase the growth scale to stretch the spiral outward.',
          'Compare against the true φ to verify the golden proportion.'
        ];
      } else {
        // graph
        const nodes = safeParam('nodesCount', 30);
        const p = safeParam('connectionProbability', 0.2);
        const edges = Math.round((nodes * (nodes - 1) / 2) * p);
        explanation = `In network graph mathematics, random graphs are modeled under Erdos-Renyi dynamics ($G(n,p)$). With ${nodes} vertices (nodes) and an edge creation probability of ${p.toFixed(2)}, the system forms approximately ${edges} active link edges. As connection probability crosses the critical phase transition threshold ($1/n$), a giant connected component emerges, linking isolated nodes.`;
        insights = [
          `Network structural vertex node count is ${nodes}.`,
          `Edge linking connection probability threshold is ${p.toFixed(2)}.`,
          `Total network link edges formed matches ${edges} segments.`
        ];
        concepts = ['Erdos-Renyi Graph Network', 'Giant Connected Component', 'Network Node Degree Centrality', 'Structural Phase Transitions'];
        actions = [
          'Increase connection probability above 0.35 to observe how the network forms a single unified cluster.',
          'Set probability to 0.05 to observe high structural isolation and multiple disjoint sub-graphs.'
        ];
      }
      break;

    case 'quantum':
      if (simulationId === 'wave') {
        const n = safeParam('energyLevel', 2);
        const w = safeParam('wellWidth', 6);
        explanation = `A quantum particle confined in a one-dimensional infinite potential well exhibits wave function quantization. The Schrödinger equation dictates that the wave function $\\psi_n(x) = \\sqrt{2/L} \\sin(\\frac{n \\pi x}{L})$ must collapse to zero at the walls. At energy state $n = ${n}$ and well width $L = ${w}$ Bohr, the system creates ${n} half-wavelength nodes, and probability density peaks in localized standing waves.`;
        insights = [
          `Quantum energy state quantum number (n) equals ${n}.`,
          `Infinite potential well width (L) is ${w} Bohr.`,
          `Particle spatial probability density peaks at exactly ${n} localized intervals.`
        ];
        concepts = ['Quantized Wave Functions', 'Schrödinger Energy Equations', 'Infinite Potential Quantum Wells', 'Standing Wave Amplitude Nodes'];
        actions = [
          'Increase quantum number n to 5 to observe a higher energy frequency and increased spatial node points.',
          'Widen the potential well and see how the spatial wavelength expands, corresponding to lower energy states.'
        ];
      } else if (simulationId === 'tunneling') {
        const v0 = safeParam('barrierHeight', 8);
        const e = safeParam('particleEnergy', 4);
        const kappa = Math.sqrt(Math.max(0, v0 - e));
        const T = Math.exp(-2 * kappa);
        explanation = `Quantum tunneling gives a particle a finite probability of crossing a forbidden barrier: T ≈ e^(−2κa). With barrier height ${v0} and particle energy ${e}, the transmission probability is ${T.toFixed(3)} — small but nonzero whenever energy falls below the barrier.`;
        insights = [
          `Barrier height V0 is ${v0}.`,
          `Particle energy E is ${e}.`,
          `Transmission probability T is ${T.toFixed(3)}.`
        ];
        concepts = ['Quantum Tunneling', 'Barrier Penetration', 'Wavefunction Decay', 'Probability Current'];
        actions = [
          'Raise particle energy toward the barrier to boost transmission.',
          'Lower the barrier height to widen the tunneling window.'
        ];
      } else if (simulationId === 'spin') {
        const theta = safeParam('spinTheta', 90);
        const phi = safeParam('spinPhi', 45);
        explanation = `A qubit state lives on the Bloch sphere: |ψ⟩ = cos(θ/2)|0⟩ + e^(iφ)·sin(θ/2)|1⟩. At latitude θ = ${theta}° and phase φ = ${phi}°, the state sits between the poles, with its |0⟩/|1⟩ mix set by the polar angle.`;
        insights = [
          `Bloch latitude θ is ${theta}°.`,
          `Phase angle φ is ${phi}°.`,
          `Polar angle sets the |0⟩/|1⟩ superposition mix.`
        ];
        concepts = ['Bloch Sphere', 'Qubit State', 'Unitary Rotation', 'Superposition'];
        actions = [
          'Sweep θ from 0 to 180° to rotate the state pole to pole.',
          'Change φ to shift the relative phase between basis states.'
        ];
      } else if (simulationId === 'entanglement') {
        const ang = safeParam('correlationAngle', 45);
        const corr = Math.cos((2 * ang * Math.PI) / 180);
        explanation = `Bell-state correlations violate classical bounds: measuring entangled particles at angle ${ang}° yields correlation ${corr.toFixed(3)}. Spooky action shows stronger-than-classical agreement, peaking when measurements align.`;
        insights = [
          `Measurement angle is ${ang}°.`,
          `Correlation coefficient is ${corr.toFixed(3)}.`,
          `Violates Bell's inequality for aligned settings.`
        ];
        concepts = ['Bell States', 'Quantum Entanglement', 'Bell Inequality', 'Non-locality'];
        actions = [
          'Align both measurement angles to maximize correlation.',
          'Rotate one angle to watch the correlation oscillate.'
        ];
      } else if (simulationId === 'hydrogen') {
        const n = safeParam('quantumNumber', 2);
        const a0 = 0.529;
        const r = n * n * a0;
        explanation = `Bohr quantized the hydrogen orbit: rₙ = n²·a₀. At principal quantum number n = ${n}, the orbital radius is ${r.toFixed(2)} Å (a₀ ≈ ${a0} Å). Higher shells balloon outward quadratically.`;
        insights = [
          `Principal quantum number n is ${n}.`,
          `Bohr radius a₀ ≈ ${a0} Å.`,
          `Orbital radius rₙ is ${r.toFixed(2)} Å.`
        ];
        concepts = ['Bohr Model', 'Quantized Orbit', 'Principal Quantum Number', 'Atomic Radius'];
        actions = [
          'Increase n to watch the electron shell expand outward.',
          'Compare radii across shells to see the n² scaling.'
        ];
      } else if (simulationId === 'harmonic') {
        const n = safeParam('oscillatorEnergy', 1);
        const En = n + 0.5;
        explanation = `The quantum harmonic oscillator has evenly spaced levels: Eₙ = (n + ½)ℏω. At vibrational state n = ${n}, the energy is ${En.toFixed(1)}·ℏω above the zero-point floor — a nonzero baseline even at the ground state.`;
        insights = [
          `Vibrational state n is ${n}.`,
          `Energy Eₙ is ${En.toFixed(1)}·ℏω.`,
          `Zero-point energy keeps the ground state non-zero.`
        ];
        concepts = ['Quantum Harmonic Oscillator', 'Energy Quantization', 'Zero-Point Energy', 'Hermite Polynomials'];
        actions = [
          'Raise n to climb the evenly spaced ladder of energies.',
          'Note the residual zero-point energy at n = 0.'
        ];
      } else if (simulationId === 'superposition') {
        const a = safeParam('probabilityAlpha', 50) / 100;
        const b = Math.sqrt(1 - a * a);
        explanation = `A qubit in superposition reads |ψ⟩ = α|0⟩ + β|1⟩ with α = ${a.toFixed(2)}. Measurement collapses it to |0⟩ with probability ${(a * a * 100).toFixed(0)}% or |1⟩ with ${(b * b * 100).toFixed(0)}%. Until measured, both outcomes coexist.`;
        insights = [
          `State |0⟩ weight α is ${a.toFixed(2)}.`,
          `Collapse to |0⟩ with ${(a * a * 100).toFixed(0)}% probability.`,
          `Collapse to |1⟩ with ${(b * b * 100).toFixed(0)}% probability.`
        ];
        concepts = ['Quantum Superposition', 'State Collapse', 'Probability Amplitude', 'Measurement Postulate'];
        actions = [
          'Set α to 50% for a maximally balanced coin flip.',
          'Bias α toward 0 or 1 to weight the measurement outcome.'
        ];
      } else {
        // uncertainty
        const dx = safeParam('positionSpread', 2);
        const dp = 1 / dx;
        explanation = `Heisenberg's Uncertainty Principle states that position and momentum cannot be simultaneously measured with infinite precision: $\\Delta x \\Delta p \\ge \\hbar/2$. At position spread $\\Delta x = ${dx.toFixed(2)}$ space units, the momentum uncertainty $\\Delta p$ is resolved as ${dp.toFixed(2)} units. Compressing the spatial wave packet forces the momentum spectrum to spread widely, causing rapid wavefunction dispersion.`;
        insights = [
          `Position spread uncertainty (delta x) is ${dx.toFixed(2)}.`,
          `Momentum spectrum uncertainty (delta p) resolves to ${dp.toFixed(2)}.`,
          `Fourier transform wave packet product yields absolute physical stability.`
        ];
        concepts = ['Heisenberg Uncertainty Principle', 'Wave Packet Spatial Compression', 'Momentum Dispersion Spectrum', 'Fourier Transform Conjugate Variables'];
        actions = [
          'Squeeze the spatial position slider to witness the momentum spectrum scatter widely, creating a highly volatile wave.',
          'Widen the position spectrum to observe the convergence of a localized mono-chromatic wave packet.'
        ];
      }
      break;

    case 'space':
      if (simulationId === 'orbit') {
        const r = safeParam('orbitSemiMajorAxis', 12);
        const m = safeParam('starMass', 150);
        const vel = Math.sqrt((0.667 * m) / r);
        const period = 2 * Math.PI * Math.sqrt(Math.pow(r, 3) / (0.667 * m));
        explanation = `Orbital mechanics in stellar gravity systems are governed by Kepler's laws and Newton's gravitational equations. For orbital radius $r = ${r}$ AU and star mass $M = ${m}$ Solar masses, the required orbital velocity for a circular path is ${vel.toFixed(2)} km/s, resulting in an orbital period of ${period.toFixed(1)} years. Kepler's Third Law ($T^2 \\propto r^3$) establishes that outer planets take exponentially longer to complete an orbit.`;
        insights = [
          `Semi-major orbital radius is ${r} astronomical units.`,
          `Central stellar gravitational mass is ${m} solar masses.`,
          `Orbital period equals ${period.toFixed(1)} Earth years, with circular velocity of ${vel.toFixed(2)} km/s.`
        ];
        concepts = ['Keplerian Orbital Motion', 'Newtonian Gravity Fields', 'Orbital Periodic Frequency', 'Centripetal Acceleration Balanced'];
        actions = [
          'Reduce orbital radius and see the planet speed up, representing high kinetic orbital balance.',
          'Increase the stellar mass slider to track the gravity well tightening and higher escape velocity thresholds.'
        ];
      } else if (simulationId === 'blackhole') {
        const m = safeParam('blackholeMass', 10);
        const r = safeParam('probeDistance', 15);
        const rs = 2.95 * m; // Approx Schwarzschild radius
        const rsRatio = rs / r;
        explanation = `A black hole warps spacetime fabrics extremely, forming an Event Horizon at the Schwarzschild Radius ($r_s = \\frac{2GM}{c^2}$). With a mass of ${m} solar masses, the horizon forms at a radius of ${rs.toFixed(1)} km. At a probe distance of ${r} km, the relative spacetime warping factor is highly severe (${(rsRatio * 100).toFixed(1)}% of horizon proximity). Light waves traveling out experience severe gravitational redshift, stretching to infinity as they approach the horizon.`;
        insights = [
          `Black hole solar mass index is ${m} units.`,
          `Event horizon Schwarzschild boundary forms at ${rs.toFixed(1)} km.`,
          `Probe distance stands at ${r} km, yielding gravitational redshift of ${(1 / Math.sqrt(1 - rsRatio)).toFixed(2)}x time dilation.`
        ];
        concepts = ['Schwarzschild Event Horizon', 'Gravitational Redshift Dilation', 'Spacetime Curvature Singularities', 'Accretion Disk Perimeniscus'];
        actions = [
          'Move the probe closer to the Schwarzschild boundary to watch time dilate towards infinity.',
          'Increase black hole mass and see the event horizon expand outwards, swallowing the nearby orbital path.'
        ];
      } else if (simulationId === 'cosmology') {
        const h0 = safeParam('hubbleConstant', 70);
        explanation = `Hubble's law relates recession speed to distance: v = H₀·d. With Hubble constant H₀ = ${h0} km/s/Mpc, a galaxy ${h0} Mpc away recedes at roughly ${h0} km/s — the universe expands uniformly in all directions.`;
        insights = [
          `Hubble constant H₀ is ${h0} km/s/Mpc.`,
          `Recession speed scales linearly with distance.`,
          `Expansion is isotropic and homogeneous.`
        ];
        concepts = ['Hubble Law', 'Cosmic Expansion', 'Redshift', 'Metric Expansion'];
        actions = [
          'Raise H₀ to speed up the inferred expansion rate.',
          'Compare nearby and distant galaxies to confirm the linear relation.'
        ];
      } else if (simulationId === 'nebula') {
        const rho = safeParam('dustDensity', 4);
        const T = safeParam('gasTemp', 20);
        const mj = Math.pow(T, 1.5) / Math.sqrt(rho);
        explanation = `Jeans instability decides whether a gas cloud collapses: M_J ∝ T^(3/2)·ρ^(−1/2). With density ${rho} and temperature ${T} K, the Jeans mass is ${mj.toFixed(1)} units. Cold, dense clouds fall below the threshold and ignite star formation.`;
        insights = [
          `Core density ρ is ${rho}.`,
          `Cloud temperature T is ${T} K.`,
          `Jeans mass is ${mj.toFixed(1)} units.`
        ];
        concepts = ['Jeans Instability', 'Gravitational Collapse', 'Star Formation', 'Thermal Pressure'];
        actions = [
          'Cool the cloud to drop the Jeans mass and trigger collapse.',
          'Raise density to overcome thermal pressure support.'
        ];
      } else if (simulationId === 'tides') {
        const d = safeParam('moonDistance', 8);
        const tide = 1 / (d * d * d);
        explanation = `Lunar tides follow an inverse-cube law: F_tidal ∝ M_moon/d³. At orbital distance ${d} Earth radii, the relative tidal pull is ${tide.toFixed(4)} units. Moving the Moon closer spikes the bulge dramatically.`;
        insights = [
          `Orbital distance d is ${d} Earth radii.`,
          `Tidal force scales as 1/d³.`,
          `Relative pull is ${tide.toFixed(4)} units.`
        ];
        concepts = ['Tidal Force', 'Inverse-Cube Law', 'Roche Limit', 'Ocean Bulge'];
        actions = [
          'Bring the Moon closer to amplify the tidal bulge.',
          'Move it away to watch terrestrial tides fade.'
        ];
      } else if (simulationId === 'magnetosphere') {
        const v = safeParam('windVelocity', 5);
        const B = safeParam('fieldStrength', 8);
        const rm = Math.pow(B, 1 / 3);
        explanation = `A planetary magnetosphere stands off the solar wind where magnetic pressure balances it: r_magneto ∝ B^(1/3). With wind speed ${v} and core dipole ${B}, the standoff radius is ${rm.toFixed(2)} units. Stronger fields carve a larger protective bubble.`;
        insights = [
          `Solar wind speed v is ${v}.`,
          `Core dipole B is ${B}.`,
          `Magnetopause radius scales with ${rm.toFixed(2)} units.`
        ];
        concepts = ['Magnetosphere', 'Solar Wind', 'Magnetic Pressure', 'Standoff Distance'];
        actions = [
          'Strengthen the dipole to enlarge the protective magnetopause.',
          'Increase wind speed to compress the field inward.'
        ];
      } else if (simulationId === 'pulsar') {
        const p = safeParam('rotationSpeed', 6);
        explanation = `A pulsar sweeps a radio beam once per spin: P_spin ≈ ${p} ms. With a spin period of ${p} milliseconds, the neutron star rotates hundreds of times per second, flashing like a cosmic lighthouse.`;
        insights = [
          `Spin period is ${p} ms.`,
          `Hundreds of rotations per second.`,
          `Beam sweeps Earth as a periodic pulse.`
        ];
        concepts = ['Pulsar', 'Neutron Star', 'Radio Lighthouse', 'Spin Period'];
        actions = [
          'Shorten the spin period to speed up the pulse rate.',
          'Compare against millisecond pulsars for rotational extremes.'
        ];
      } else {
        // stellar
        const mass = safeParam('initialMass', 8);
        let lifecycle = '';
        let fate = '';
        if (mass < 0.5) {
          lifecycle = 'Red Dwarf -> Protostar -> Convective Helium Fusion -> Dense Helium Star';
          fate = 'Cold White Dwarf';
        } else if (mass < 8) {
          lifecycle = 'Main Sequence Star -> Red Giant -> Planetary Nebula Ejection';
          fate = 'Carbon-Oxygen White Dwarf';
        } else if (mass < 25) {
          lifecycle = 'Blue Supergiant -> Red Supergiant -> Core Collapse Iron Fusion -> Supernova';
          fate = 'Neutron Star (Pulsar)';
        } else {
          lifecycle = 'Hypergiant -> Wolf-Rayet Phase -> Core Collapse Supernova / Hypernova';
          fate = 'Schwarzschild Stellar Black Hole';
        }
        explanation = `Stellar evolution timelines are dictated entirely by a star's initial birth mass. With an initial mass of ${mass} solar masses, the star's lifespan is governed by rapid nuclear fusion in the core. The star will progress through the lifecycle: **${lifecycle}**. Upon exhausting its hydrogen and subsequent shell fusion fuels, the core suffers gravitational collapse, leaving behind a dense **${fate}** remnants.`;
        insights = [
          `Birth mass parameter is ${mass} solar masses.`,
          `Predicted evolutionary timeline: ${lifecycle}.`,
          `End-state collapse remnant will form a dense ${fate}.`
        ];
        concepts = ['Stellar Fusion Lifecycle', 'Core Gravitational Collapse', 'Supernova Nucleosynthesis', 'Electron Degeneracy Pressure'];
        actions = [
          'Set initial mass to 30 solar masses to observe a giant supernova explosion leaving behind a black hole.',
          'Reduce mass to 1 solar mass to track the long-term stable main sequence before transforming into a planetary nebula.'
        ];
      }
      break;

    default:
      explanation = 'Scientific simulation parameters aggregate normal physical properties under deterministic rules.';
      insights = ['Parameters are within active limits.', 'The system is in equilibrium.'];
      concepts = ['State Telemetry', 'Scientific Principles'];
      actions = ['Alter parameter values to trigger state changes.'];
  }

  // Construct structured markup string
  return `[EXPLANATION]
${explanation}

---

[KEY INSIGHTS]
${insights.map(item => `- ${item}`).join('\n')}

---

[CONCEPTS]
${concepts.map(item => `- ${item}`).join('\n')}

---

[RECOMMENDED ACTIONS]
${actions.map(item => `- ${item}`).join('\n')}

---

[METADATA]
{
  "domain": "${domain}",
  "simulationType": "${simulationId}",
  "difficulty": "${diff}",
  "aiModel": "gemma-4-26b-a4b-it"
}
`;
}

// Spark Stream Telemetry API Handler
async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  await connectDB();

  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponseHandler.badRequest('Invalid request body');
  }

  // Validate request body against schema
  let validatedData;
  try {
    validatedData = validateSimulationRun(body, SimulationRunCreateSchema);
    if (!validatedData.parameters) {
      throw new Error('Parameters are required');
    }
    if (!validatedData.metrics) {
      validatedData.metrics = {};
    }
    if (validatedData.entities) {
      // Convert unvalidated entities to properly typed array
      validatedData.entities = Array.isArray(validatedData.entities) ? 
        validatedData.entities.map((ent: any, idx: number) => ({ ...ent, id: ent.id || `entity-${idx}` })) : 
        [];
    } else {
      validatedData.entities = [];
    }
    // Replace original body with validated data
    Object.assign(body, validatedData);
  } catch (validationError) {
    logger.warn('[Simulation API] Validation failed:', validationError instanceof Error ? validationError.message : 'Unknown validation error');
    return ApiResponseHandler.badRequest(validationError instanceof Error ? validationError.message : 'Invalid request data');
  }

  const { domain, simulationId, parameters, stateSnapshot, userQuestion } = validatedData;

  const targetQuestion = userQuestion ? userQuestion.trim().replace(/[<>]/g, '') : 'Explain the current simulation telemetry and recommend variables adjustments.';
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '';
  const encoder = new TextEncoder();

  // Create stream channel
  const stream = new ReadableStream({
    async start(controller) {
      let fullResponseText = '';
      let fallbackTriggered = false;

      const finishAndPersist = async (completeText: string) => {
        try {
          // Parse sections from the text response
          const explanationSec = completeText.split('[EXPLANATION]')[1]?.split('---')[0]?.trim() || '';
          
          const insightsSec = completeText.split('[KEY INSIGHTS]')[1]?.split('---')[0]?.trim() || 
                              completeText.split('[KEY POINTS]')[1]?.split('---')[0]?.trim() || '';
          const insightsArr = insightsSec
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.replace(/^-\s+/, ''));

          const conceptsSec = completeText.split('[CONCEPTS]')[1]?.split('---')[0]?.trim() || '';
          const conceptsArr = conceptsSec
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.replace(/^-\s+/, ''));

          const recommendedSec = completeText.split('[RECOMMENDED ACTIONS]')[1]?.split('---')[0]?.trim() || 
                                 completeText.split('[FOLLOW UPS]')[1]?.split('---')[0]?.trim() || '';
          const recommendedArr = recommendedSec
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-'))
            .map(line => line.replace(/^-\s+/, ''));

          const metaText = completeText.split('[METADATA]')[1]?.trim() || '{}';
          let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
          try {
            const m = JSON.parse(metaText);
            if (m.difficulty === 'beginner' || m.difficulty === 'advanced') {
              difficulty = m.difficulty;
            }
          } catch {}

          const parsedInterpretation = {
            explanation: explanationSec || completeText.split('---')[0]?.trim() || completeText,
            keyInsights: insightsArr.length > 0 ? insightsArr : ['Parameters calibrated correctly.', 'Dynamic system is in motion.'],
            concepts: conceptsArr.length > 0 ? conceptsArr : [domain.toUpperCase()],
            recommendedActions: recommendedArr.length > 0 ? recommendedArr : ['Tweak the sliders to see variable effects.'],
            metadata: {
              domain,
              simulationType: simulationId,
              difficulty,
              aiModel: 'gemma-4-26b-a4b-it'
            }
          };

          // Save simulation run to MongoDB persistence layer
          await SimulationRun.create({
            simulationId,
            userId: new mongoose.Types.ObjectId(auth.userId),
            domain,
            parameters,
            stateSnapshot,
            aiInterpretation: parsedInterpretation,
            timestamp: new Date()
          });

          // Enqueue SSE custom metadata payload event at the end
          controller.enqueue(
            encoder.encode(
              `\n\n[METADATA_EVENT] ${JSON.stringify({
                domain,
                simulationId,
                interpretation: parsedInterpretation
              })} [END]`
            )
          );
        } catch (err) {
          logger.error('[Simulation API Stream] Failed to parse and save run details:', err);
        } finally {
          controller.close();
        }
      };

      const triggerLocalFallback = async (reason: string) => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        logger.warn(`[Simulation API Stream] Fallback activated. Reason: ${reason}`);

        try {
          const fallbackText = generateLocalSimulationFallback(domain, simulationId, parameters || {});
          
          // Stream word-by-word
          const words = fallbackText.split(' ');
          let accumulated = '';
          for (let i = 0; i < words.length; i++) {
            const word = words[i] + ' ';
            accumulated += word;
            controller.enqueue(encoder.encode(word));
            await new Promise(resolve => setTimeout(resolve, 15)); // smooth streaming simulation
          }
          await finishAndPersist(accumulated);
        } catch (err) {
          logger.error('[Simulation API Stream] Extreme failover crash:', err);
          const absoluteFallback = `[EXPLANATION]\nScientific systems running normally. The deterministic engine is executing mathematical steps in the background.\n\n---\n\n[KEY INSIGHTS]\n- Dynamic state is fully active.\n\n---\n\n[CONCEPTS]\n- Simulation Engine\n\n---\n\n[RECOMMENDED ACTIONS]\n- Modify sliders to check physical results.\n\n---\n\n[METADATA]\n{\n  "domain": "${domain}",\n  "simulationType": "${simulationId}",\n  "difficulty": "intermediate",\n  "aiModel": "gemma-4-26b-a4b-it"\n}`;
          controller.enqueue(encoder.encode(absoluteFallback));
          await finishAndPersist(absoluteFallback);
        }
      };

      // 1. Direct check: No API key -> immediate fallback
      if (!apiKey) {
        await triggerLocalFallback('No API keys configured in environment');
        return;
      }

      // 2. OpenRouter live stream with AbortController for primary timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
        triggerLocalFallback('OpenRouter primary connection timed out (6.0s)');
      }, PRIMARY_TIMEOUT_MS);

      try {
        // Construct prompt using the AI PROMPT INJECTION TEMPLATE
        const systemPrompt = `You are Spark AI, an educational scientific interpreter inside Neuron.
You do NOT calculate physics or simulate systems.
You ONLY explain simulation results in a clear, structured educational way.`;

        const userPrompt = `CONTEXT:
- Simulation Domain: ${domain}
- Simulation State: ${JSON.stringify(stateSnapshot || {})}
- Parameters: ${JSON.stringify(parameters || {})}

USER:
${targetQuestion}

OUTPUT RULES:
- structured explanation only
- no extra formatting outside allowed schema
- no system messages
- no storytelling unless requested

Strictly formatted as:
[EXPLANATION]
Explain the current state clearly.

---

[KEY INSIGHTS]
- list the primary telemetry observations

---

[CONCEPTS]
- list relevant scientific term titles

---

[RECOMMENDED ACTIONS]
- suggest variables modifications

---

[METADATA]
{
  "domain": "${domain}",
  "simulationType": "${simulationId}",
  "difficulty": "beginner" | "intermediate" | "advanced",
  "aiModel": "gemma-4-26b-a4b-it"
}`;

        const response = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://neuron-edu.vercel.app',
            'X-Title': 'Neuron Scientific Simulation System'
          },
          body: JSON.stringify({
            model: MODEL_NAME,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.5,
            stream: true,
          }),
          signal: abortController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`OpenRouter returned status ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) {
          throw new Error('Response body has no reader');
        }

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const cleanLine = line.trim();
            if (!cleanLine) continue;

            if (cleanLine.startsWith('data: ')) {
              const dataStr = cleanLine.slice(6);
              if (dataStr === '[DONE]') continue;

              try {
                const parsed = JSON.parse(dataStr);
                const token = parsed.choices?.[0]?.delta?.content || '';
                if (token) {
                  fullResponseText += token;
                  controller.enqueue(encoder.encode(token));
                }
              } catch { }
            }
          }
        }

        if (buffer && buffer.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(buffer.slice(6));
            const token = parsed.choices?.[0]?.delta?.content || '';
            if (token) {
              fullResponseText += token;
              controller.enqueue(encoder.encode(token));
            }
          } catch { }
        }

        await finishAndPersist(fullResponseText);
      } catch (err: unknown) {
        clearTimeout(timeoutId);
        const error = err instanceof Error ? err : new Error(String(err));
        if (error.name === 'AbortError') return;
        await triggerLocalFallback(`OpenRouter connection error: ${error.message}`);
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export const POST = withErrorHandling(requireSimulationCsrfProtection(requireAuth(handler)));
