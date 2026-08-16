/**
 * Equation presentation helper (P3 runtime/UX audit, UX-02).
 * The registry stores equations as LaTeX-ish strings (e.g.
 * "\\frac{dx}{dt} = \\alpha x - \\beta x y"). We render them as readable
 * plain text — this project has no KaTeX/MathJax dependency, so a small
 * deterministic token translation keeps the user-visible equation honest
 * instead of showing raw backslashes and braces.
 */

const GREEK: Record<string, string> = {
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\delta': 'δ',
  '\\epsilon': 'ε',
  '\\lambda': 'λ',
  '\\mu': 'μ',
  '\\rho': 'ρ',
  '\\sigma': 'σ',
  '\\omega': 'ω',
  '\\theta': 'θ',
  '\\phi': 'φ',
  '\\pi': 'π',
  '\\eta': 'η',
  '\\tau': 'τ',
  '\\Delta': 'Δ',
  '\\Sigma': 'Σ',
};

const SYMBOLS: Array<[RegExp, string]> = [
  [/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2'],
  [/\\sqrt\s*\{([^{}]*)\}/g, '√($1)'],
  [/\\cdot/g, '·'],
  [/\\times/g, '×'],
  [/\\le/g, '≤'],
  [/\\ge/g, '≥'],
  [/\\rightarrow/g, '→'],
  [/\\approx/g, '≈'],
  [/\\pm/g, '±'],
  [/\\propto/g, '∝'],
  [/\\implies/g, '⇒'],
  [/\\left\(/g, '('],
  [/\\right\)/g, ')'],
];

/**
 * Two passes so nested \frac inside \frac arguments are flattened.
 */
function flattenFrac(input: string): string {
  let out = input;
  for (let pass = 0; pass < 3; pass++) {
    const next = out.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2');
    if (next === out) break;
    out = next;
  }
  return out;
}

/**
 * Converts a registry equation string into readable plain text.
 *
 * - Braced subscripts (F_{thrust}) become plain-text subscripts (F_thrust)
 *   so they never block \frac flattening with nested braces.
 * - \frac and \sqrt are flattened to a/b and √(...) respectively.
 * - Greek tokens become Unicode glyphs; recognized relation symbols are
 *   translated.
 * - Unrecognized LaTeX tokens are left as-is (never silently dropped).
 */
export function presentEquation(latex: string): string {
  let out = latex.replace(/_\{([^{}]*)\}/g, '_$1');

  for (const [token, replacement] of Object.entries(GREEK)) {
    out = out.split(token).join(replacement);
  }

  // Interleave fraction flattening with symbol substitution until stable:
  // a symbol replacement can expose a new brace-free \frac group (e.g.
  // \frac{t}{\sqrt{1 - v^2/c^2}} → \frac{t}{√(1 - v^2/c^2)} → t/√(1 - v^2/c^2)).
  for (let i = 0; i < 8; i++) {
    const prev = out;
    out = flattenFrac(out);
    for (const [pattern, replacement] of SYMBOLS) {
      out = out.replace(pattern, replacement);
    }
    if (out === prev) break;
  }
  return out;
}