/**
 * P3 — SimulationRun Data Integrity Audit: regression tests
 *
 * Covers every classifier decision and the cleanup plan safety rules:
 * unknown simulation, wrong domain, invalid/out-of-range/wrong-type
 * parameters, empty snapshots (expected vs missing), AI/simulation
 * mismatch, valid records, synthetic evidence, duplicates, REVIEW
 * protection, destructive-operation gating, and preservation of valid
 * user history.
 */

import { describe, it, expect } from 'vitest';
import {
  auditRun,
  buildCleanupPlan,
  canDeleteSynthetic,
  detectDuplicates,
  snapshotClassificationTable,
  type AuditRunInput,
} from '../audit';

const VALID_USER = 'aaaaaaaaaaaaaaaaaaaaaaaa';

function neutralAi(
  simulationId: string,
  domain: string,
  source: 'ai' | 'deterministic' = 'ai'
): AuditRunInput['aiInterpretation'] {
  return {
    explanation: `Deterministic telemetry of ${simulationId} under ${domain} conditions recorded during the experiment.`,
    keyInsights: ['Parameter configuration recorded.'],
    concepts: ['Simulation telemetry'],
    recommendedActions: ['Adjust parameters and re-run.'],
    metadata: {
      domain,
      simulationType: simulationId,
      difficulty: 'intermediate',
      aiModel: 'test-model',
      source,
    },
  };
}

function baseRun(overrides: Partial<AuditRunInput> = {}): AuditRunInput {
  return {
    id: 'run-1',
    userId: VALID_USER,
    simulationId: 'motion',
    domain: 'physics',
    parameters: { force: 15, mass: 5, friction: 0.2 },
    stateSnapshot: {
      acceleration: 1.04,
      velocity: 2.4,
      frictionalForce: 9.8,
    },
    aiInterpretation: {
      explanation:
        'Newtonian motion sandbox: net acceleration follows F=ma with friction opposing motion.',
      keyInsights: ['Net acceleration of the system is 1.04 m/s².'],
      concepts: ['Newtonian Mechanics', 'Frictional Resistance'],
      recommendedActions: ['Increase the applied force to overcome friction.'],
      metadata: {
        domain: 'Physics',
        simulationType: 'motion',
        difficulty: 'intermediate',
        aiModel: 'test-model',
        source: 'ai',
      },
    },
    timestamp: '2026-05-01T12:00:00.000Z',
    ...overrides,
  };
}

describe('P3 — simulation identity resolution', () => {
  it('classifies an unknown simulation id as UNKNOWN_SIMULATION', () => {
    const result = auditRun(baseRun({ simulationId: 'ecosystem_legacy' }));
    expect(result.category).toBe('UNKNOWN_SIMULATION');
    expect(result.definition).toBeNull();
  });

  it('classifies a wrong domain as INVALID_DOMAIN', () => {
    const result = auditRun(baseRun({ domain: 'biology' }));
    expect(result.category).toBe('INVALID_DOMAIN');
  });

  it('accepts legacy Title-Cased domain casing', () => {
    const result = auditRun(baseRun({ domain: 'Physics' }));
    expect(result.category).toBe('VALID');
  });

  it('resolves the simulation across domains by id alone', () => {
    const result = auditRun(
      baseRun({
        simulationId: 'wave',
        domain: 'quantum',
        parameters: { energyLevel: 2, wellWidth: 6 },
        stateSnapshot: { visualizationState: { animationPhase: 3 } },
        aiInterpretation: neutralAi('wave', 'Quantum'),
      })
    );
    expect(result.category).toBe('VALID');
  });
});

describe('P3 — parameter validation', () => {
  it('flags an unknown parameter key', () => {
    const result = auditRun(baseRun({ parameters: { force: 15, bogusParam: 3 } }));
    expect(result.category).toBe('INVALID_PARAMETERS');
    expect(result.issues.some((i) => 'reason' in i && i.reason === 'unknown_key')).toBe(true);
  });

  it('flags an out-of-range parameter value', () => {
    const result = auditRun(baseRun({ parameters: { force: 51, mass: 5, friction: 0.2 } }));
    expect(result.category).toBe('INVALID_PARAMETERS');
    expect(result.issues.some((i) => 'reason' in i && i.reason === 'above_max')).toBe(true);
  });

  it('flags a non-finite parameter value', () => {
    const result = auditRun(
      baseRun({ parameters: { force: Number.POSITIVE_INFINITY, mass: 5, friction: 0.2 } })
    );
    expect(result.category).toBe('INVALID_PARAMETERS');
    expect(result.issues.some((i) => 'reason' in i && i.reason === 'non_finite')).toBe(true);
  });

  it('flags wrong parameter type (non-integer for an integer parameter)', () => {
    const result = auditRun(
      baseRun({
        simulationId: 'bacteria',
        domain: 'biology',
        parameters: { temperature: 37.5, nutrientLevel: 4.5 },
        stateSnapshot: { population: 100, growthRate: 1 },
        aiInterpretation: { ...baseRun().aiInterpretation, metadata: { domain: 'Biology', simulationType: 'bacteria', difficulty: 'intermediate', aiModel: 'x', source: 'ai' } },
      })
    );
    // temperature has step 1 → integer; 37.5 is a wrong type.
    expect(result.category).toBe('INVALID_PARAMETERS');
    expect(result.issues.some((i) => 'reason' in i && i.reason === 'wrong_type')).toBe(true);
  });
});

describe('P3 — state snapshot validation (engine-derived)', () => {
  it('flags an empty snapshot on a dynamic simulation as MISSING_SNAPSHOT', () => {
    const result = auditRun(baseRun({ stateSnapshot: {} }));
    expect(result.category).toBe('MISSING_SNAPSHOT');
  });

  it('accepts an empty snapshot on a conceptual simulation', () => {
    const result = auditRun(
      baseRun({
        simulationId: 'pendulum',
        domain: 'physics',
        parameters: { length: 6, gravity: 9.8 },
        stateSnapshot: {},
        aiInterpretation: neutralAi('pendulum', 'Physics'),
      })
    );
    expect(result.category).toBe('VALID');
  });

  it('flags stale snapshot metadata on conceptual simulations pre-P1 as STALE_SCHEMA', () => {
    // Conceptual sims are acceptable empty; the schema-era concern applies to
    // parameterized visualizations that now emit visualizationState.
    const result = auditRun(
      baseRun({
        simulationId: 'relativity',
        domain: 'physics',
        parameters: { speed: 0.5 },
        stateSnapshot: {},
      })
    );
    expect(result.category).toBe('STALE_SCHEMA');
  });

  it('flags state fields from another simulation (contamination)', () => {
    const result = auditRun(
      baseRun({
        stateSnapshot: {
          acceleration: 1.04,
          velocity: 2.4,
          frictionalForce: 9.8,
          pathogensRemaining: 12, // immune field leaked into motion
        },
      })
    );
    expect(result.category).toBe('INVALID_STATE');
    expect(result.issues.some((i) => 'reason' in i && i.reason === 'unexpected_fields')).toBe(true);
  });

  it('flags impossible values inconsistent with engine equations (motion)', () => {
    // F=36, m=20, μ=0.8 → μmg = 156.8 N; acceleration must be 0.
    const result = auditRun(
      baseRun({
        parameters: { force: 36, mass: 20, friction: 0.8 },
        stateSnapshot: { acceleration: 2.1, velocity: 4.1, frictionalForce: 156.8 },
      })
    );
    expect(result.category).toBe('INVALID_STATE');
    expect(result.issues.some((i) => 'reason' in i && i.reason === 'impossible_value')).toBe(true);
  });

  it('accepts physically justified acceleration 0 for F below friction', () => {
    const result = auditRun(
      baseRun({
        parameters: { force: 36, mass: 20, friction: 0.8 },
        stateSnapshot: { acceleration: 0, velocity: 4.1, frictionalForce: 156.8 },
      })
    );
    expect(result.category).toBe('VALID');
  });

  it('validates virus SIR totals against populationSize', () => {
    const base = {
      ...baseRun(),
      simulationId: 'virus',
      domain: 'biology',
      parameters: { transmissionRate: 0.5, recoveryRate: 0.1, populationSize: 120 },
      aiInterpretation: neutralAi('virus', 'Biology'),
    };
    const ok = auditRun({
      ...base,
      stateSnapshot: { susceptible: 100, infected: 15, recovered: 5, r0: 5 },
    });
    expect(ok.category).toBe('VALID');

    const bad = auditRun({
      ...base,
      stateSnapshot: { susceptible: 100, infected: 15, recovered: 10, r0: 5 },
    });
    expect(bad.category).toBe('INVALID_STATE');
  });

  it('validates probability beadsSettled against beadsCount', () => {
    const base = {
      ...baseRun(),
      simulationId: 'probability',
      domain: 'mathematics',
      parameters: { beadsCount: 200 },
      aiInterpretation: neutralAi('probability', 'Mathematics'),
    };
    const bad = auditRun({
      ...base,
      stateSnapshot: { beadsSettled: 210 },
    });
    expect(bad.category).toBe('INVALID_STATE');
    const ok = auditRun({
      ...base,
      stateSnapshot: { beadsSettled: 58 },
    });
    expect(ok.category).toBe('VALID');
  });
});

describe('P3 — AI interpretation identity', () => {
  it('flags cross-simulation contamination in explanation text', () => {
    const result = auditRun(
      baseRun({
        aiInterpretation: {
          ...baseRun().aiInterpretation,
          explanation:
            'Phagocytosis and chemotaxis drive immune clearance of pathogens — WBC counts.',
        },
      })
    );
    expect(result.category).toBe('AI_MISMATCH');
    expect(
      result.issues.some(
        (i) => 'reason' in i && i.reason === 'cross_simulation_contamination'
      )
    ).toBe(true);
  });

  it('flags metadata.simulationType disagreeing with simulationId', () => {
    const result = auditRun(
      baseRun({
        aiInterpretation: {
          ...baseRun().aiInterpretation,
          metadata: {
            ...baseRun().aiInterpretation!.metadata!,
            simulationType: 'immune',
          },
        },
      })
    );
    expect(result.category).toBe('AI_MISMATCH');
  });

  it('does not flag a simulation’s own markers', () => {
    const result = auditRun(
      baseRun({
        simulationId: 'immune',
        domain: 'biology',
        parameters: { pathogenCount: 40, wbcCount: 15 },
        stateSnapshot: { pathogensRemaining: 40, wbcUnits: 15 },
        aiInterpretation: {
          explanation:
            'Phagocytosis and chemotaxis drive immune clearance of pathogens with WBC recruitment.',
          keyInsights: ['WBC count is 15.'],
          concepts: ['Cellular Phagocytosis', 'Chemotaxis Recruitment'],
          recommendedActions: ['Boost the initial WBC count.'],
          metadata: { domain: 'Biology', simulationType: 'immune', difficulty: 'intermediate', aiModel: 'x', source: 'ai' },
        },
      })
    );
    expect(result.category).toBe('VALID');
  });
});

describe('P3 — synthetic/test evidence', () => {
  it('flags a record with an invalid userId as SYNTHETIC_TEST_DATA', () => {
    const result = auditRun(baseRun({ userId: 'not-an-object-id' }));
    expect(result.category).toBe('SYNTHETIC_TEST_DATA');
  });

  it('flags an unregistered fallback probe with empty payload as SYNTHETIC_TEST_DATA', () => {
    const result = auditRun(
      baseRun({
        simulationId: 'ecosystem_legacy',
        domain: 'biology',
        parameters: {},
        stateSnapshot: {},
        aiInterpretation: {
          explanation: 'System running normally.',
          keyInsights: [],
          concepts: [],
          recommendedActions: [],
          metadata: {
            domain: 'Biology',
            simulationType: 'ecosystem_legacy',
            difficulty: 'intermediate',
            aiModel: 'neuron-local-deterministic-engine',
            source: 'deterministic',
          },
        },
      })
    );
    expect(result.category).toBe('SYNTHETIC_TEST_DATA');
  });

  it('does NOT classify deterministic-source records as synthetic (real user + fallback text)', () => {
    const result = auditRun(
      baseRun({
        aiInterpretation: {
          ...baseRun().aiInterpretation,
          metadata: {
            domain: 'Physics',
            simulationType: 'motion',
            difficulty: 'intermediate',
            aiModel: 'neuron-local-deterministic-engine',
            source: 'deterministic',
          },
        },
      })
    );
    expect(result.category).toBe('VALID');
  });
});

describe('P3 — duplicate detection', () => {
  it('detects content-identical records per user and keeps the earliest', () => {
    const runs = [
      baseRun({ id: 'run-a', timestamp: '2026-05-01T12:00:00.000Z' }),
      baseRun({ id: 'run-b', timestamp: '2026-05-01T13:00:00.000Z' }),
      baseRun({ id: 'run-c', userId: 'bbbbbbbbbbbbbbbbbbbbbbbb', timestamp: '2026-05-01T13:00:00.000Z' }),
    ];
    const groups = detectDuplicates(runs);
    expect(groups.size).toBe(1);
    const group = [...groups.values()][0];
    // The group lists every member sorted by timestamp; the cleanup plan
    // keeps the earliest and archives the rest.
    expect(group).toEqual(['run-a', 'run-b']);
  });

  it('archives duplicates while preserving the earliest (KEEP)', () => {
    const runs = [
      baseRun({ id: 'run-a', timestamp: '2026-05-01T12:00:00.000Z' }),
      baseRun({ id: 'run-b', timestamp: '2026-05-01T13:00:00.000Z' }),
    ];
    const plan = buildCleanupPlan(runs);
    const byId = Object.fromEntries(plan.entries.map((e) => [e.id, e]));
    expect(byId['run-a'].disposition).toBe('KEEP');
    expect(byId['run-b'].category).toBe('DUPLICATE');
    expect(byId['run-b'].disposition).toBe('ARCHIVE');
  });
});

describe('P3 — cleanup plan safety', () => {
  it('maps VALID records to KEEP (user history preserved)', () => {
    const plan = buildCleanupPlan([baseRun()]);
    expect(plan.entries[0].disposition).toBe('KEEP');
    expect(plan.summary.KEEP).toBe(1);
  });

  it('maps AI_MISMATCH records to REVIEW, never DELETE', () => {
    const contaminated = baseRun({
      aiInterpretation: {
        ...baseRun().aiInterpretation,
        explanation: 'Phagocytosis and chemotaxis are active.',
      },
    });
    const plan = buildCleanupPlan([contaminated]);
    expect(plan.entries[0].category).toBe('AI_MISMATCH');
    expect(plan.entries[0].disposition).toBe('REVIEW');
    expect(plan.summary.DELETE).toBe(0);
  });

  it('maps ambiguous/invalid records to REVIEW, preserving their history', () => {
    const invalidParams = baseRun({ parameters: { force: 51, mass: 5, friction: 0.2 } });
    const plan = buildCleanupPlan([invalidParams]);
    expect(plan.entries[0].category).toBe('INVALID_PARAMETERS');
    expect(plan.entries[0].disposition).toBe('REVIEW');
  });

  it('never assigns a destructive disposition to a REVIEW record under any flag set', () => {
    const contaminated = baseRun({
      aiInterpretation: {
        ...baseRun().aiInterpretation,
        explanation: 'WBC chemotaxis is active.',
      },
    });
    const plan = buildCleanupPlan([contaminated]);
    expect(plan.hasDeletions).toBe(false);
    expect(canDeleteSynthetic({ apply: true, deleteSynthetic: true }, plan)).toBe(false);
  });

  it('requires BOTH --apply and --delete-synthetic to activate deletions', () => {
    const synthetic = baseRun({ userId: 'not-an-object-id' });
    const plan = buildCleanupPlan([synthetic]);
    expect(plan.entries[0].disposition).toBe('DELETE');
    expect(plan.hasDeletions).toBe(true);

    expect(canDeleteSynthetic({ apply: false, deleteSynthetic: true }, plan)).toBe(false);
    expect(canDeleteSynthetic({ apply: true, deleteSynthetic: false }, plan)).toBe(false);
    expect(canDeleteSynthetic({ apply: true, deleteSynthetic: true }, plan)).toBe(true);
  });
});

describe('P3 — snapshot classification table (spec §8)', () => {
  it('covers all 48 registry simulations exactly once', () => {
    const rows = snapshotClassificationTable();
    expect(rows.length).toBe(48);
    const ids = rows.map((r) => r.simulationId);
    expect(new Set(ids).size).toBe(48);
  });

  it('classifies 6 dynamic, 11 parameterized, 31 conceptual', () => {
    const rows = snapshotClassificationTable();
    expect(rows.filter((r) => r.stateType === 'dynamic').length).toBe(6);
    expect(rows.filter((r) => r.stateType === 'parameterized_visualization').length).toBe(11);
    expect(rows.filter((r) => r.stateType === 'conceptual').length).toBe(31);
  });

  it('expects runtime state only for dynamic simulations', () => {
    for (const row of snapshotClassificationTable()) {
      expect(row.snapshotExpected).toBe(row.stateType === 'dynamic');
      expect(row.emptyClassification).toBe(
        row.stateType === 'dynamic' ? 'MISSING_RUNTIME_STATE' : 'EXPECTED_EMPTY'
      );
    }
  });

  it('every dynamic simulation has engine-emitted snapshot fields', () => {
    for (const row of snapshotClassificationTable()) {
      if (row.stateType === 'dynamic') {
        expect(row.snapshotFields.split(', ').length).toBeGreaterThan(0);
        expect(row.snapshotFields).not.toBe('—');
      }
    }
  });
});

describe('P3 — coherent valid record end-to-end', () => {
  it('classifies a fully engine-coherent record as VALID', () => {
    // F=36, m=20, μ=0.8: μmg = 156.8 N → net force 0 → acceleration 0.
    const result = auditRun(
      baseRun({
        parameters: { force: 36, mass: 20, friction: 0.8 },
        stateSnapshot: { acceleration: 0, velocity: 2.2, frictionalForce: 156.8 },
        aiInterpretation: {
          explanation:
            'Applied force 36 N is below the 156.8 N static friction threshold, so net acceleration is zero while velocity persists.',
          keyInsights: ['Friction threshold is 156.8 N.'],
          concepts: ['Newtonian Mechanics'],
          recommendedActions: ['Raise force above 156.8 N to accelerate.'],
          metadata: {
            domain: 'Physics',
            simulationType: 'motion',
            difficulty: 'intermediate',
            aiModel: 'test-model',
            source: 'ai',
          },
        },
      })
    );
    expect(result.category).toBe('VALID');
  });
});