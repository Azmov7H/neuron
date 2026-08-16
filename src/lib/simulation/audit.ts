/**
 * SimulationRun Data Integrity Audit
 *
 * P3 — registry- and engine-driven classifier for persisted SimulationRun
 * records. The registry is authoritative for definitions; the engine is
 * authoritative for computed state; AI interpretation is treated as derived
 * data and is never allowed to override simulation identity.
 *
 * This module is PURE (no database access, no side effects) so it can be
 * reused by tests, the cleanup script, and future tooling. Records are
 * accepted as plain objects — the caller normalizes mongoose documents.
 *
 * Dependency direction (P2): this module reads the registry only. The state
 * classification is re-derived from the registry's INTERACTIVE_SIM_IDS plus
 * the audit's own engine-verified dynamic-state table (below), mirroring
 * the engine switch — a second literal exists nowhere else.
 */

import type {
  SimulationDefinition,
  SimulationParameter,
} from './registry.types';
import { getAllSimulations, isInteractiveSim } from './registry';

/**
 * Diagnostic classifications produced by the audit (spec §3).
 */
export const AUDIT_CATEGORIES = [
  'VALID',
  'INVALID_PARAMETERS',
  'INVALID_DOMAIN',
  'INVALID_STATE',
  'STALE_SCHEMA',
  'AI_MISMATCH',
  'MISSING_SNAPSHOT',
  'SYNTHETIC_TEST_DATA',
  'DUPLICATE',
  'UNKNOWN_SIMULATION',
  'REQUIRES_REVIEW',
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

/**
 * Final data dispositions produced by the cleanup plan (spec §9).
 * ARCHIVE is report-only (records are never rewritten or moved — the
 * platform has no archive collection and persisted field renames are
 * forbidden). Destructive dispositions (DELETE) are gated behind explicit
 * flags in the cleanup script; REVIEW is never auto-deleted.
 */
export const DISPOSITIONS = ['KEEP', 'ARCHIVE', 'DELETE', 'REVIEW'] as const;

export type Disposition = (typeof DISPOSITIONS)[number];

/**
 * Engine-derived snapshot contract: which fields the runtime actually emits
 * per interactive simulation (verified against simulation-engine.ts, P3 §5).
 * The keys ARE the dynamic simulation set — the only place this set is
 * encoded in the audit, kept in sync with the engine by tests.
 */
export const DYNAMIC_SNAPSHOT_FIELDS: Record<string, readonly string[]> = {
  motion: ['acceleration', 'velocity', 'frictionalForce'],
  bacteria: ['population', 'growthRate'],
  virus: ['susceptible', 'infected', 'recovered', 'r0'],
  immune: ['pathogensRemaining', 'wbcUnits'],
  probability: ['beadsSettled'],
  graph: ['nodeCount', 'averageSpeed'],
};

export const DYNAMIC_SIM_IDS = Object.freeze(
  Object.keys(DYNAMIC_SNAPSHOT_FIELDS)
) as readonly string[];

/**
 * Strong lexical markers that uniquely identify a simulation's scientific
 * content. Used ONLY to detect cross-simulation contamination in AI text —
 * a marker belonging to another simulation appearing in an interpretation is
 * an AI/simulation mismatch. Shared generic terms (e.g. "Kepler") are
 * excluded. Ambigous short tokens (e.g. "R0") are kept because they only
 * occur in this codebase inside the relevant sim's own output.
 */
const AI_MARKERS: Record<string, readonly string[]> = {
  relativity: ['lorentz', 'time dilation', 'length contraction'],
  motion: ['newtonian motion', 'thrust force', 'frictional force'],
  gravity: ['centripetal'],
  bacteria: ['exponential phase', 'lag phase', 'culture'],
  virus: [
    'epidemic',
    'herd immunity',
    'basic reproduction number',
    'susceptible-infected',
  ],
  immune: ['phagocyt', 'chemotax', 'wbc', 'leukocyte'],
  heart: ['cardiac output', 'stroke volume'],
  neural: ['saltatory', 'myelination', 'nodes of ranvier'],
  blood: ['poiseuille', 'vascul'],
  probability: ['galton', 'bell curve', 'central limit'],
  graph: ['erdos', 'renyi', 'giant component'],
  wave: ['schr', 'potential well', 'quantum number'],
  uncertainty: ['heisenberg'],
  orbit: ['keplerian orbit', 'semi-major axis', 'astronomical units'],
  blackhole: ['schwarzschild', 'event horizon'],
  stellar: ['supernova', 'main sequence', 'white dwarf'],
  ecosystem: ['lotka', 'predator-prey'],
};

export interface AuditParameterIssue {
  key: string;
  reason:
    | 'unknown_key'
    | 'non_finite'
    | 'wrong_type'
    | 'below_min'
    | 'above_max'
    | 'missing_required';
  detail: string;
}

export interface AuditSnapshotIssue {
  reason:
    | 'expected_runtime_state'
    | 'unexpected_fields'
    | 'missing_field'
    | 'non_finite'
    | 'impossible_value'
    | 'contaminated_fields'
    | 'wrong_shape'
    | 'schema_era_empty';
  detail: string;
}

export interface AuditAiIssue {
  reason: 'cross_simulation_contamination' | 'fabricated_state_claim';
  sourceSimulation: string;
  marker: string;
  detail: string;
}

/**
 * The normalized input record shape the audit consumes (mongoose document →
 * plain object). `_id` and `userId` are opaque strings; timestamp semantics
 * never influence classification.
 */
export interface AuditRunInput {
  id: string;
  userId: string;
  simulationId: string;
  domain?: string;
  parameters?: Record<string, unknown>;
  stateSnapshot?: Record<string, unknown>;
  aiInterpretation?: {
    explanation?: string;
    keyInsights?: string[];
    concepts?: string[];
    recommendedActions?: string[];
    metadata?: {
      domain?: string;
      simulationType?: string;
      difficulty?: string;
      aiModel?: string;
      source?: 'ai' | 'deterministic' | string;
      fallbackReason?: string;
    };
  };
  timestamp?: string;
}

export interface AuditResult {
  category: AuditCategory;
  issues: Array<
    | AuditParameterIssue
    | AuditSnapshotIssue
    | AuditAiIssue
    | { reason: string; detail: string }
  >;
  /** Hard evidence of synthetic/test origin (never timestamp-based). */
  syntheticEvidence: string[];
  /** Resolved registry definition (null when simulationId is unknown). */
  definition: SimulationDefinition | null;
}

export interface AuditOptions {
  /** Registry vs stored-domain comparison normalizer (legacy Title-Case). */
  normalizeDomain?: (d: string) => string;
  /** Disable lexical AI checks (shape-only auditing). */
  skipAiLexicalCheck?: boolean;
}

const defaultNormalizeDomain = (d: string) => d.trim().toLowerCase();

const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

function sortKeys(value: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
  );
}

/** Normalized, order-independent JSON digest for duplicate detection. */
export function recordContentDigest(run: AuditRunInput): string {
  return JSON.stringify({
    simulationId: run.simulationId,
    domain: run.domain,
    parameters: sortKeys(run.parameters ?? {}),
    stateSnapshot: sortKeys(run.stateSnapshot ?? {}),
    ai: run.aiInterpretation
      ? {
          explanation: run.aiInterpretation.explanation,
          keyInsights: run.aiInterpretation.keyInsights,
          concepts: run.aiInterpretation.concepts,
          recommendedActions: run.aiInterpretation.recommendedActions,
        }
      : null,
  });
}

/** Resolve a definition by simulation id across all domains. */
function resolveDefinitionById(simulationId: string): SimulationDefinition | null {
  for (const defs of Object.values(getAllSimulations())) {
    for (const def of defs) {
      if (def.id === simulationId) return def;
    }
  }
  return null;
}

/**
 * Reference equations reproduced from the engine (simulation-engine.ts) so
 * snapshot values can be checked against the actual runtime — the engine,
 * not the registry equation string, is the runtime authority (spec §7).
 */
function evaluateEngineCoherence(
  simId: string,
  params: Record<string, unknown>,
  snapshot: Record<string, unknown>
): AuditSnapshotIssue[] {
  const issues: AuditSnapshotIssue[] = [];
  const num = (k: string) => params[k] as number | undefined;
  const snapNum = (k: string) => snapshot[k] as number | undefined;

  switch (simId) {
    case 'motion': {
      const f = num('force') ?? 15;
      const m = num('mass') ?? 5;
      const mu = num('friction') ?? 0.2;
      const frictionExpected = mu * m * 9.8;
      const accExpected = Math.max(0, f - frictionExpected) / m;
      const acc = snapNum('acceleration');
      if (acc !== undefined && Math.abs(acc - accExpected) > 1e-6) {
        issues.push({
          reason: 'impossible_value',
          detail: `acceleration ${acc} does not match engine-derived max(0, F − μmg)/m = ${accExpected}`,
        });
      }
      const fr = snapNum('frictionalForce');
      if (fr !== undefined && Math.abs(fr - frictionExpected) > 1e-6) {
        issues.push({
          reason: 'impossible_value',
          detail: `frictionalForce ${fr} does not match engine-derived μmg = ${frictionExpected}`,
        });
      }
      const v = snapNum('velocity');
      if (v !== undefined && (!Number.isFinite(v) || v < 0)) {
        issues.push({
          reason: 'impossible_value',
          detail: `velocity ${v} must be finite and non-negative`,
        });
      }
      break;
    }
    case 'bacteria': {
      const temp = num('temperature') ?? 37;
      const nutrient = num('nutrientLevel') ?? 6;
      const capacity = nutrient * 40;
      const growthExpected = Math.max(
        0,
        Math.exp(-Math.pow(temp - 37, 2) / (2 * Math.pow(12, 2)))
      );
      const pop = snapNum('population');
      if (pop !== undefined) {
        if (!Number.isFinite(pop) || pop < 0 || pop > capacity + 1e-9) {
          issues.push({
            reason: 'impossible_value',
            detail: `population ${pop} must be finite and within [0, logistic capacity ${capacity}] (= nutrientLevel × 40)`,
          });
        }
      }
      const g = snapNum('growthRate');
      if (g !== undefined && Math.abs(g - growthExpected) > 1e-9) {
        issues.push({
          reason: 'impossible_value',
          detail: `growthRate ${g} does not match engine-derived exp(−(T−37)²/(2·12²)) = ${growthExpected}`,
        });
      }
      break;
    }
    case 'virus': {
      const trans = num('transmissionRate') ?? 0.5;
      const rec = num('recoveryRate') ?? 0.1;
      const n = num('populationSize') ?? 120;
      const r0Expected = rec === 0 ? Infinity : trans / rec;
      const r0 = snapNum('r0');
      if (r0 !== undefined && Number.isFinite(r0) && Math.abs(r0 - r0Expected) > 1e-9) {
        issues.push({
          reason: 'impossible_value',
          detail: `r0 ${r0} does not match engine-reported β/γ = ${r0Expected}`,
        });
      }
      const s = snapNum('susceptible') ?? 0;
      const i = snapNum('infected') ?? 0;
      const r = snapNum('recovered') ?? 0;
      if (![s, i, r].every((x) => Number.isInteger(x) && x >= 0)) {
        issues.push({
          reason: 'impossible_value',
          detail: `SIR counts must be non-negative integers (got ${s}, ${i}, ${r})`,
        });
      }
      if (s + i + r > n + 1e-9) {
        issues.push({
          reason: 'impossible_value',
          detail: `SIR total ${s + i + r} exceeds populationSize ${n}`,
        });
      }
      break;
    }
    case 'immune': {
      const pathInit = num('pathogenCount') ?? 40;
      const wbcInit = num('wbcCount') ?? 15;
      const p = snapNum('pathogensRemaining') ?? 0;
      const w = snapNum('wbcUnits') ?? 0;
      if (!Number.isFinite(p) || !Number.isFinite(w)) {
        issues.push({ reason: 'non_finite', detail: 'immune snapshot not finite' });
      }
      if (p < 0 || p > pathInit + 1e-9 || !Number.isInteger(p)) {
        issues.push({
          reason: 'impossible_value',
          detail: `pathogensRemaining ${p} must be an integer in [0, initial pathogenCount ${pathInit}] — pathogens never spawn`,
        });
      }
      if (w < 0 || w > wbcInit + 1e-9 || !Number.isInteger(w)) {
        issues.push({
          reason: 'impossible_value',
          detail: `wbcUnits ${w} must be an integer in [0, initial wbcCount ${wbcInit}] — WBCs never spawn`,
        });
      }
      break;
    }
    case 'probability': {
      const n = num('beadsCount') ?? 200;
      const b = snapNum('beadsSettled');
      if (b !== undefined && (!Number.isInteger(b) || b < 0 || b > n + 1e-9)) {
        issues.push({
          reason: 'impossible_value',
          detail: `beadsSettled ${b} must be an integer in [0, beadsCount ${n}]`,
        });
      }
      break;
    }
    case 'graph': {
      const n = num('nodesCount') ?? 30;
      const cnt = snapNum('nodeCount');
      const speed = snapNum('averageSpeed');
      if (cnt !== undefined && (cnt < 0 || cnt > n + 1e-9)) {
        issues.push({
          reason: 'impossible_value',
          detail: `nodeCount ${cnt} outside [0, nodesCount ${n}]`,
        });
      }
      if (speed !== undefined && (!Number.isFinite(speed) || speed < 0)) {
        issues.push({
          reason: 'impossible_value',
          detail: `averageSpeed ${speed} must be finite and non-negative`,
        });
      }
      break;
    }
    default:
      break;
  }
  return issues;
}

function checkSnapshotShape(
  run: AuditRunInput
): AuditSnapshotIssue[] {
  const snapshot = run.stateSnapshot ?? {};
  const simId = run.simulationId;
  const issues: AuditSnapshotIssue[] = [];

  if (isInteractiveSim(simId)) {
    const expected = DYNAMIC_SNAPSHOT_FIELDS[simId];
    if (expected) {
      // Dynamic simulation: runtime MUST have produced measured state.
      if (Object.keys(snapshot).length === 0) {
        issues.push({
          reason: 'expected_runtime_state',
          detail: `dynamic simulation ${simId} persisted an empty stateSnapshot — the engine emits ${expected.join(', ')} every physics step`,
        });
        return issues;
      }
      const known = new Set([...expected]);
      const unexpected = Object.keys(snapshot).filter((k) => !known.has(k));
      if (unexpected.length > 0) {
        issues.push({
          reason: 'unexpected_fields',
          detail: `snapshot contains fields the ${simId} engine never emits: ${unexpected.join(', ')}`,
        });
      }
      for (const f of expected) {
        if (!(f in snapshot)) {
          issues.push({
            reason: 'missing_field',
            detail: `snapshot missing engine-emitted field ${f}`,
          });
        }
      }
      for (const v of Object.values(snapshot)) {
        if (typeof v === 'number' && !Number.isFinite(v)) {
          issues.push({ reason: 'non_finite', detail: 'snapshot contains a non-finite number' });
        }
      }
    } else {
      // Parameterized visualization: only the render clock may be present.
      const keys = Object.keys(snapshot);
      if (keys.length === 0) {
        issues.push({
          reason: 'schema_era_empty',
          detail: `parameterized visualization ${simId} persisted an empty stateSnapshot — post-P1 runs emit { visualizationState: { animationPhase } }`,
        });
      } else if (
        keys.length !== 1 ||
        keys[0] !== 'visualizationState' ||
        !snapshot.visualizationState ||
        typeof snapshot.visualizationState !== 'object' ||
        !('animationPhase' in (snapshot.visualizationState as object))
      ) {
        issues.push({
          reason: 'wrong_shape',
          detail: `parameterized visualization ${simId} snapshot must be { visualizationState: { animationPhase } }`,
        });
      }
    }
    return issues;
  }

  // Conceptual simulation: the engine emits no telemetry. {} is expected;
  // the P1+ explicit marker is also accepted; anything else is invalid.
  const keys = Object.keys(snapshot);
  if (keys.length > 0) {
    const ok = keys.length === 1 && snapshot.visualizationState === 'conceptual';
    if (!ok) {
      issues.push({
        reason: 'unexpected_fields',
        detail: `conceptual simulation ${simId} should persist {} or { visualizationState: 'conceptual' } — got ${keys.join(', ')}`,
      });
    }
  }
  return issues;
}

export function auditRun(
  raw: AuditRunInput,
  options: AuditOptions = {}
): AuditResult {
  const normalizeDomain = options.normalizeDomain ?? defaultNormalizeDomain;
  const issues: AuditResult['issues'] = [];
  const syntheticEvidence: string[] = [];

  // ── 0. synthetic/test evidence — hard markers only, never timestamps ──
  // (Evaluated before identity resolution so unregistered probe records can
  // still be classified. `deterministic` source alone is NOT synthetic: it
  // is a real user experiment answered by the local fallback generator.)
  const ai = raw.aiInterpretation;
  const isFallbackEngine =
    ai?.metadata?.source === 'deterministic' &&
    ai.metadata.aiModel === 'neuron-local-deterministic-engine';
  const isValidObjectId =
    /^[0-9a-fA-F]{24}$/.test(raw.userId ?? '') || raw.userId === '';
  if (!isValidObjectId) {
    syntheticEvidence.push(
      'userId is not a valid 24-hex ObjectId — requireAuth always supplies a valid ObjectId from the session'
    );
  }
  if (
    isFallbackEngine &&
    raw.stateSnapshot &&
    Object.keys(raw.stateSnapshot).length === 0 &&
    !resolveDefinitionById(raw.simulationId) &&
    Object.keys(raw.parameters ?? {}).length === 0
  ) {
    syntheticEvidence.push(
      'unregistered simulation executed by the fallback generator with empty parameters and empty snapshot — the UI cannot reach unregistered sims, so this record originates from a direct API/script probe'
    );
  }
  if (
    isInteractiveSim(raw.simulationId) &&
    raw.stateSnapshot &&
    Object.keys(raw.stateSnapshot).length === 0 &&
    Object.keys(raw.parameters ?? {}).length === 0
  ) {
    syntheticEvidence.push(
      'interactive simulation with empty parameters and empty snapshot — the runner always seeds registry defaults'
    );
  }
  if (syntheticEvidence.length > 0) {
    return {
      category: 'SYNTHETIC_TEST_DATA',
      issues: [
        ...issues,
        ...syntheticEvidence.map((d) => ({ reason: 'synthetic_evidence', detail: d })),
      ],
      syntheticEvidence,
      definition: resolveDefinitionById(raw.simulationId),
    };
  }

  // ── 1. resolve simulation identity against the registry ───────────────
  const def = resolveDefinitionById(raw.simulationId);
  if (!def) {
    return {
      category: 'UNKNOWN_SIMULATION',
      issues: [
        {
          reason: 'unknown_simulation_id',
          detail: `simulationId "${raw.simulationId}" does not resolve in the registry${raw.domain ? ` (stored domain "${raw.domain}")` : ''}`,
        },
      ],
      syntheticEvidence: [],
      definition: null,
    };
  }

  // ── 2. domain must equal the registry domain (case-insensitive) ───────
  if (normalizeDomain(raw.domain ?? '') !== def.domain) {
    return {
      category: 'INVALID_DOMAIN',
      issues: [
        {
          reason: 'wrong_domain',
          detail: `stored domain "${raw.domain}" does not match registry domain "${def.domain}" for ${raw.simulationId}`,
        },
      ],
      syntheticEvidence: [],
      definition: def,
    };
  }

  // ── 3. parameter contract validity ────────────────────────────────────
  const params = raw.parameters ?? {};
  const paramDefs = new Map(
    def.parameters.map((p: SimulationParameter) => [p.key, p])
  );
  const paramIssues: AuditParameterIssue[] = [];
  for (const [key, value] of Object.entries(params)) {
    const p = paramDefs.get(key);
    if (!p) {
      paramIssues.push({
        key,
        reason: 'unknown_key',
        detail: `parameter "${key}" is not defined for ${raw.simulationId}`,
      });
      continue;
    }
    if (!isFiniteNumber(value)) {
      paramIssues.push({
        key,
        reason: 'non_finite',
        detail: `parameter "${key}" must be a finite number (got ${JSON.stringify(value)})`,
      });
      continue;
    }
    if (value < p.min) {
      paramIssues.push({
        key,
        reason: 'below_min',
        detail: `parameter "${key}" = ${value} below registry min ${p.min}`,
      });
    }
    if (value > p.max) {
      paramIssues.push({
        key,
        reason: 'above_max',
        detail: `parameter "${key}" = ${value} above registry max ${p.max}`,
      });
    }
    if (p.type === 'integer' && !Number.isInteger(value)) {
      paramIssues.push({
        key,
        reason: 'wrong_type',
        detail: `parameter "${key}" must be an integer (got ${value})`,
      });
    }
  }
  const missingRequired = def.parameters
    .filter((p: SimulationParameter) => p.required && !(p.key in params))
    .map((p: SimulationParameter) => p.key);
  if (missingRequired.length > 0) {
    paramIssues.push({
      key: missingRequired.join(','),
      reason: 'missing_required',
      detail: `missing required parameter(s): ${missingRequired.join(', ')}`,
    });
  }
  issues.push(...paramIssues);

  // ── 4. state snapshot shape (engine-expected) ─────────────────────────
  const snapshotIssues = checkSnapshotShape(raw);
  issues.push(...snapshotIssues);

  // ── 5. snapshot physics coherence (engine equations) ──────────────────
  issues.push(...evaluateEngineCoherence(raw.simulationId, params, raw.stateSnapshot ?? {}));

  // ── 6. AI interpretation identity checks ──────────────────────────────
  const aiIssues: AuditAiIssue[] = [];
  const interpretation = raw.aiInterpretation;
  if (interpretation) {
    const text = [
      interpretation.explanation ?? '',
      ...(interpretation.keyInsights ?? []),
      ...(interpretation.concepts ?? []),
      ...(interpretation.recommendedActions ?? []),
    ]
      .join(' ')
      .toLowerCase();
    if (!options.skipAiLexicalCheck) {
      for (const [otherSim, markers] of Object.entries(AI_MARKERS)) {
        if (otherSim === raw.simulationId) continue;
        for (const marker of markers) {
          if (text.includes(marker)) {
            aiIssues.push({
              reason: 'cross_simulation_contamination',
              sourceSimulation: otherSim,
              marker,
              detail: `interpretation text contains "${marker}" which uniquely belongs to "${otherSim}"`,
            });
            break;
          }
        }
      }
    }
    if (
      raw.stateSnapshot &&
      Object.keys(raw.stateSnapshot).length === 0 &&
      isInteractiveSim(raw.simulationId) &&
      interpretation.explanation &&
      /dynamic state is fully active|system[\s\S]{0,20}running normally/i.test(
        interpretation.explanation
      )
    ) {
      aiIssues.push({
        reason: 'fabricated_state_claim',
        sourceSimulation: raw.simulationId,
        marker: 'dynamic state is fully active',
        detail: 'interpretation claims active dynamic state while the persisted snapshot is empty',
      });
    }
    const meta = interpretation.metadata;
    if (meta) {
      if (meta.simulationType && meta.simulationType !== raw.simulationId) {
        aiIssues.push({
          reason: 'cross_simulation_contamination',
          sourceSimulation: meta.simulationType,
          marker: 'metadata.simulationType',
          detail: `metadata.simulationType "${meta.simulationType}" disagrees with simulationId "${raw.simulationId}"`,
        });
      }
      if (meta.domain && normalizeDomain(meta.domain) !== def.domain) {
        aiIssues.push({
          reason: 'cross_simulation_contamination',
          sourceSimulation: def.id,
          marker: 'metadata.domain',
          detail: `metadata.domain "${meta.domain}" disagrees with registry domain "${def.domain}"`,
        });
      }
    }
  }
  issues.push(...aiIssues);

  // ── 7. classification (single dominant category, first match wins) ─────
  const hasParamIssue = paramIssues.length > 0;
  const hasCoherenceIssue = issues.some((i) => i.reason === 'impossible_value' || i.reason === 'non_finite');
  const hasSnapshotShapeIssue = issues.some(
    (i) =>
      i.reason === 'unexpected_fields' ||
      i.reason === 'missing_field' ||
      i.reason === 'contaminated_fields' ||
      i.reason === 'wrong_shape'
  );
  const missingSnapshot = snapshotIssues.some(
    (i) => i.reason === 'expected_runtime_state'
  );
  const schemaEraEmpty = snapshotIssues.some(
    (i) => i.reason === 'schema_era_empty'
  );

  if (hasParamIssue) {
    return { category: 'INVALID_PARAMETERS', issues, syntheticEvidence, definition: def };
  }
  if (missingSnapshot) {
    return { category: 'MISSING_SNAPSHOT', issues, syntheticEvidence, definition: def };
  }
  if (schemaEraEmpty) {
    return { category: 'STALE_SCHEMA', issues, syntheticEvidence, definition: def };
  }
  if (hasCoherenceIssue || hasSnapshotShapeIssue) {
    return { category: 'INVALID_STATE', issues, syntheticEvidence, definition: def };
  }
  if (aiIssues.length > 0) {
    return { category: 'AI_MISMATCH', issues, syntheticEvidence, definition: def };
  }
  return { category: 'VALID', issues, syntheticEvidence, definition: def };
}

/**
 * Duplicate detection: normalized content digest grouped per user. The
 * earliest record in a group is the canonical KEEP candidate; the rest are
 * DUPLICATE (archived by the cleanup plan, never auto-deleted).
 */
export function detectDuplicates(runs: AuditRunInput[]): Map<string, string[]> {
  const groups = new Map<string, AuditRunInput[]>();
  for (const r of runs) {
    const key = `${r.userId}|${recordContentDigest(r)}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  const result = new Map<string, string[]>();
  for (const [key, list] of groups) {
    if (list.length > 1) {
      const sorted = [...list].sort((a, b) =>
        (a.timestamp ?? '').localeCompare(b.timestamp ?? '')
      );
      result.set(key, sorted.map((r) => r.id));
    }
  }
  return result;
}

export interface CleanupPlanEntry {
  id: string;
  category: AuditCategory;
  disposition: Disposition;
  reasons: string[];
  syntheticEvidence: string[];
}

export interface CleanupPlan {
  entries: CleanupPlanEntry[];
  summary: Record<Disposition, number>;
  /** True when at least one entry received a destructive disposition. */
  hasDeletions: boolean;
}

/**
 * Builds a non-destructive disposition plan from audit results.
 *
 * Rules (spec §9–§10, §13):
 * - VALID                      → KEEP
 * - STALE_SCHEMA / DUPLICATE   → ARCHIVE (report-only; kept in place)
 * - SYNTHETIC_TEST_DATA        → DELETE (only via hard markers; still gated
 *                                behind --delete-synthetic in the script)
 * - AI_MISMATCH, INVALID_*, MISSING_SNAPSHOT, UNKNOWN_SIMULATION,
 *   REQUIRES_REVIEW             → REVIEW (never auto-deleted)
 *
 * REVIEW is a protected disposition: the plan builder can never assign it
 * to DELETE, and no flag combination re-assigns it.
 */
export function buildCleanupPlan(
  runs: AuditRunInput[],
  duplicateGroups?: Map<string, string[]>
): CleanupPlan {
  const groups = duplicateGroups ?? detectDuplicates(runs);
  const duplicates = new Set(
    [...groups.values()].flatMap((ids) => ids.slice(1))
  );

  const entries: CleanupPlanEntry[] = [];
  for (const r of runs) {
    const audit = auditRun(r);
    let disposition: Disposition;
    let category = audit.category;

    if (duplicates.has(r.id)) {
      category = 'DUPLICATE';
      disposition = 'ARCHIVE';
    } else {
      switch (audit.category) {
        case 'VALID':
          disposition = 'KEEP';
          break;
        case 'SYNTHETIC_TEST_DATA':
          disposition = 'DELETE';
          break;
        case 'STALE_SCHEMA':
          disposition = 'ARCHIVE';
          break;
        default:
          disposition = 'REVIEW';
          break;
      }
    }

    entries.push({
      id: r.id,
      category,
      disposition,
      reasons: audit.issues.map((i) => i.detail),
      syntheticEvidence: audit.syntheticEvidence,
    });
  }

  const summary: Record<Disposition, number> = { KEEP: 0, ARCHIVE: 0, DELETE: 0, REVIEW: 0 };
  for (const e of entries) summary[e.disposition]++;

  return { entries, summary, hasDeletions: summary.DELETE > 0 };
}

/**
 * Destructive-operation accord: deletions require the operator to pass
 * --apply AND the specific --delete-synthetic flag (and an interactive
 * confirmation, enforced by the script). Pure predicate so tests can assert
 * that no flag combination can delete REVIEW records.
 */
export function canDeleteSynthetic(
  flags: { apply: boolean; deleteSynthetic: boolean },
  plan: CleanupPlan
): boolean {
  return flags.apply && flags.deleteSynthetic && plan.hasDeletions;
}

/**
 * State snapshot classification table (spec §8): per simulation, whether a
 * persisted snapshot is expected, which fields the engine emits, and the
 * classification of an empty snapshot.
 */
export interface SnapshotExpectationRow {
  simulationId: string;
  interactive: boolean;
  stateType: 'dynamic' | 'parameterized_visualization' | 'conceptual';
  snapshotExpected: boolean;
  snapshotFields: string;
  emptyClassification: 'EXPECTED_EMPTY' | 'MISSING_RUNTIME_STATE';
}

export function snapshotClassificationTable(): SnapshotExpectationRow[] {
  const rows: SnapshotExpectationRow[] = [];
  for (const defs of Object.values(getAllSimulations())) {
    for (const def of defs) {
      const interactive = isInteractiveSim(def.id);
      const dynamic = DYNAMIC_SNAPSHOT_FIELDS[def.id] !== undefined;
      const stateType = dynamic
        ? 'dynamic'
        : interactive
          ? 'parameterized_visualization'
          : 'conceptual';
      rows.push({
        simulationId: def.id,
        interactive,
        stateType,
        snapshotExpected: stateType === 'dynamic',
        snapshotFields: DYNAMIC_SNAPSHOT_FIELDS[def.id]?.join(', ') ?? '—',
        emptyClassification:
          stateType === 'dynamic' ? 'MISSING_RUNTIME_STATE' : 'EXPECTED_EMPTY',
      });
    }
  }
  return rows;
}