/**
 * Lotka–Volterra predator–prey integrator for the 'ecosystem' simulation (RF-3).
 * dx/dt = αx − βxy, dy/dt = δxy − γy with normalised coefficients whose
 * equilibrium (x*, y*) = (γ/δ, α/β) = (50, 25) lies inside the registry's
 * parameter ranges, so every in-registry initial condition produces bounded,
 * out-of-phase closed cycles around it.
 */

export const LOTKA_VOLTERRA_COEFFICIENTS = {
  alpha: 0.4,
  beta: 0.016,
  delta: 0.005,
  gamma: 0.25,
} as const;

export const LOTKA_VOLTERRA_EQUILIBRIUM = {
  prey: LOTKA_VOLTERRA_COEFFICIENTS.gamma / LOTKA_VOLTERRA_COEFFICIENTS.delta,
  predators: LOTKA_VOLTERRA_COEFFICIENTS.alpha / LOTKA_VOLTERRA_COEFFICIENTS.beta,
} as const;

export interface LotkaVolterraSample {
  prey: number;
  predators: number;
}

/**
 * Forward-Euler integration with a fixed 0.05 s substep. Returns `sampleCount`
 * evenly spaced samples covering `totalSeconds` of simulated time, starting
 * with the initial populations.
 */
export function integrateLotkaVolterra(
  initialPrey: number,
  initialPredators: number,
  totalSeconds: number,
  sampleCount: number
): LotkaVolterraSample[] {
  const { alpha, beta, delta, gamma } = LOTKA_VOLTERRA_COEFFICIENTS;
  const samples: LotkaVolterraSample[] = [];
  let x = Math.max(0, initialPrey);
  let y = Math.max(0, initialPredators);
  const dt = 0.05;
  const steps = Math.max(1, Math.round(totalSeconds / dt));
  const count = Math.max(2, Math.round(sampleCount));
  const stride = Math.max(1, Math.floor(steps / (count - 1)));
  samples.push({ prey: x, predators: y });
  for (let i = 1; i <= steps; i++) {
    const dx = alpha * x - beta * x * y;
    const dy = delta * x * y - gamma * y;
    x += dx * dt;
    y += dy * dt;
    if (i % stride === 0) {
      samples.push({ prey: x, predators: y });
    }
  }
  if (samples.length < count - 1) {
    samples.push({ prey: x, predators: y });
  }
  return samples;
}