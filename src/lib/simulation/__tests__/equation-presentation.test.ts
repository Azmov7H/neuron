import { describe, it, expect } from 'vitest';
import { presentEquation } from '../equation-presentation';
import { SIMULATION_REGISTRY } from '../registry';

describe('presentEquation (UX-02)', () => {
  it('flattens \\frac into readable a/b form with Greek letters', () => {
    expect(presentEquation('\\frac{dx}{dt} = \\alpha x - \\beta x y')).toBe('dx/dt = α x - β x y');
  });

  it('handles nested fractions', () => {
    expect(presentEquation('\\frac{\\frac{a}{b}}{c}')).toBe('a/b/c');
    expect(presentEquation('\\frac{a}{\\frac{b}{c}}')).toBe('a/b/c');
  });

  it('converts sqrt and common relation symbols', () => {
    expect(presentEquation('\\sqrt{1 - v^2/c^2} \\le 1')).toBe('√(1 - v^2/c^2) ≤ 1');
    expect(presentEquation('G \\cdot M \\approx 1.618')).toBe('G · M ≈ 1.618');
  });

  it('renders the Lorenz parameters with Greek letters', () => {
    expect(presentEquation('\\sigma=10, \\rho=28, \\beta=8/3')).toBe('σ=10, ρ=28, β=8/3');
  });

  it('leaves unrecognized LaTeX tokens verbatim (never silently dropped)', () => {
    expect(presentEquation('\\sqrt{2} \\hbar \\psi')).toBe('√(2) \\hbar \\psi');
  });

  it('renders every registry equation deterministically without throwing', () => {
    for (const [key, sim] of SIMULATION_REGISTRY) {
      const once = presentEquation(sim.equation);
      const twice = presentEquation(sim.equation);
      expect(once.length, `equation for "${key}" must render to non-empty text`).toBeGreaterThan(0);
      expect(twice).toBe(once); // pure function: stable output
      expect(once).not.toContain('\\frac');
      expect(once).not.toContain('\\sqrt');
    }
  });
});
