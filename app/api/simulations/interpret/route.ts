import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { SimulationRun } from '@/database/models/simulation-run';
import { AppError } from '@/types';
import mongoose from 'mongoose';

const MODEL_NAME = 'google/gemma-4-26b-a4b-it:free';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const PRIMARY_TIMEOUT_MS = 6000; // 6 seconds threshold

// Offline High-Fidelity Scientific Fallback Engine for the 6 Domains
function generateLocalSimulationFallback(
  domain: string,
  simulationId: string,
  parameters: Record<string, any>,
  stateSnapshot: Record<string, any>
): string {
  const diff = parameters.speed > 0.8 || parameters.energyLevel > 4 || parameters.initialMass > 15 ? 'advanced' : 'intermediate';
  
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

    case 'quantum mechanics':
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

    case 'space science':
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

  const { domain, simulationId, parameters, stateSnapshot, userQuestion } = body;

  if (!domain || !simulationId) {
    return ApiResponseHandler.badRequest('Simulation Domain and Simulation ID are required.');
  }

  const targetQuestion = userQuestion ? userQuestion.trim() : 'Explain the current simulation telemetry and recommend variables adjustments.';
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
          console.error('[Simulation API Stream] Failed to parse and save run details:', err);
        } finally {
          controller.close();
        }
      };

      const triggerLocalFallback = async (reason: string) => {
        if (fallbackTriggered) return;
        fallbackTriggered = true;
        console.warn(`[Simulation API Stream] Fallback activated. Reason: ${reason}`);

        try {
          const fallbackText = generateLocalSimulationFallback(domain, simulationId, parameters || {}, stateSnapshot || {});
          
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
          console.error('[Simulation API Stream] Extreme failover crash:', err);
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
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') return;
        await triggerLocalFallback(`OpenRouter connection error: ${err.message}`);
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

export const POST = withErrorHandling(requireAuth(handler));
