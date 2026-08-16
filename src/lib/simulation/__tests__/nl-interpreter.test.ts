import { describe, it, expect } from 'vitest';
import { resolveNlProposal, NaturalLanguageInterpreter } from '../nl-interpreter.service';
import type { LlmInterpretationOutput } from '../schemas';

function proposal(partial: Partial<LlmInterpretationOutput>): LlmInterpretationOutput {
  return {
    matched: true,
    domain: 'physics',
    simulationId: 'motion',
    parameters: {},
    ...partial,
  };
}

describe('resolveNlProposal — registry whitelist', () => {
  it('resolves a valid simulation with complete parameters to ready', () => {
    const result = resolveNlProposal(proposal({ parameters: { force: 20, mass: 5, friction: 0.2 } }));
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.simulationId).toBe('motion');
      expect(result.parameters).toEqual({ force: 20, mass: 5, friction: 0.2 });
    }
  });

  it('rejects an unknown simulation id (hallucinated by the model)', () => {
    const result = resolveNlProposal(proposal({ simulationId: 'quantum_leap_engine' }));
    expect(result.status).toBe('unsupported');
  });

  it('rejects a known id claimed under the wrong domain', () => {
    const result = resolveNlProposal(proposal({ domain: 'biology', simulationId: 'motion' }));
    expect(result.status).toBe('unsupported');
  });

  it('rejects a proposal with no domain or id', () => {
    expect(resolveNlProposal({ matched: true, parameters: {} }).status).toBe('unsupported');
    expect(resolveNlProposal(null).status).toBe('unsupported');
  });

  it('rejects proposals explicitly marked unmatched', () => {
    const result = resolveNlProposal({ matched: false, parameters: {} });
    expect(result.status).toBe('unsupported');
  });
});

describe('resolveNlProposal — parameter bounds and requirements', () => {
  it('clamps out-of-range values into the registry bounds', () => {
    const result = resolveNlProposal(proposal({ parameters: { force: 9999, mass: 5, friction: 0.2 } }));
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.parameters.force).toBe(50);
    }
  });

  it('fills absent parameters with registry defaults', () => {
    const result = resolveNlProposal(proposal({ parameters: { force: 10 } }));
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.parameters.mass).toBe(5);
      expect(result.parameters.friction).toBe(0.2);
    }
  });

  it('asks for input when required parameters are missing', () => {
    const result = resolveNlProposal(proposal({ parameters: {} }));
    expect(result.status).toBe('needs_input');
    if (result.status === 'needs_input') {
      expect(result.missingParameters.sort()).toEqual(['force', 'friction', 'mass'].sort());
      expect(result.availableParameters.map((p) => p.key)).toContain('force');
    }
  });

  it('drops unknown and non-finite parameter keys instead of crashing', () => {
    const result = resolveNlProposal(
      proposal({ parameters: { force: 10, mass: 5, friction: 0.2, explosion: 1, weird: Number.NaN } as unknown as Record<string, number> })
    );
    expect(result.status).toBe('ready');
  });

  it('does not let a malicious nested payload bypass the registry', () => {
    const hostile = {
      matched: true,
      domain: 'physics',
      simulationId: 'relativity',
      parameters: { speed: '0.5' },
    } as unknown as LlmInterpretationOutput;
    const result = resolveNlProposal(hostile);
    expect(result.status).toBe('needs_input');
  });
});

describe('NaturalLanguageInterpreter — deterministic path (no API key)', () => {
  it('maps a keyword match and reports the missing parameters', async () => {
    const result = await NaturalLanguageInterpreter.interpret({ text: 'show the relativity simulation' });
    expect(result.status).toBe('needs_input');
    if (result.status === 'needs_input') {
      expect(result.simulationId).toBe('relativity');
    }
  });

  it('returns unsupported for text that matches nothing', async () => {
    const result = await NaturalLanguageInterpreter.interpret({ text: 'banana bread recipe please' });
    expect(result.status).toBe('unsupported');
  });
});