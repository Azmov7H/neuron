/**
 * Fallback Interpreter — deterministic offline NL → SimulationConfig matching.
 * Mirrors the SparkFallback pattern: rule-based keyword matching, no network,
 * no LLM. Consumed by NaturalLanguageInterpreter when the LLM is unavailable.
 */

import { getAllSimulations, DOMAIN_ORDER } from './registry';
import type { ScientificDomain, SimulationDefinition } from './registry.types';

const STOPWORDS = new Set([
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'with', 'and', 'or', 'for',
  'from', 'see', 'show', 'want', 'run', 'use', 'like', 'what', 'happens',
  'simulate', 'simulation', 'experiment', 'launch', 'object', 'describe',
]);

const MIN_MATCH_SCORE = 3;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

interface KeywordSet {
  idTokens: Set<string>;
  nameTokens: Set<string>;
  descriptionTokens: Set<string>;
}

const KEYWORD_CACHE = new Map<string, KeywordSet>();

function keywordsFor(sim: SimulationDefinition): KeywordSet {
  const cached = KEYWORD_CACHE.get(sim.id);
  if (cached) return cached;
  const set: KeywordSet = {
    idTokens: new Set(sim.id.split('_').filter((token) => token.length > 2)),
    nameTokens: new Set(tokenize(sim.name)),
    descriptionTokens: new Set(tokenize(sim.description)),
  };
  KEYWORD_CACHE.set(sim.id, set);
  return set;
}

/**
 * Deterministic keyword matching over the full registry.
 * Returns the best-scoring simulation, or null when nothing clears the bar.
 */
export function matchSimulationByKeywords(
  text: string,
  domainHint?: ScientificDomain
): { domain: ScientificDomain; simulationId: string; name: string } | null {
  const tokens = tokenize(text);
  if (tokens.length === 0) return null;

  const all = getAllSimulations();
  const domains = domainHint ? [domainHint] : [...DOMAIN_ORDER];

  let best: { domain: ScientificDomain; sim: SimulationDefinition; score: number } | null = null;

  for (const domain of domains) {
    for (const sim of all[domain]) {
      const keywords = keywordsFor(sim);
      let score = 0;
      for (const token of tokens) {
        if (keywords.idTokens.has(token)) score += 5;
        if (keywords.nameTokens.has(token)) score += 3;
        if (keywords.descriptionTokens.has(token)) score += 1;
      }
      if (score > 0 && (!best || score > best.score)) {
        best = { domain, sim, score };
      }
    }
  }

  if (!best || best.score < MIN_MATCH_SCORE) return null;
  return { domain: best.domain, simulationId: best.sim.id, name: best.sim.name };
}

/**
 * Fallback proposal in the same shape the LLM is expected to produce,
 * so the shared validation pipeline in nl-interpreter.service applies.
 */
export interface FallbackProposal {
  matched: boolean;
  domain?: ScientificDomain;
  simulationId?: string;
  parameters: Record<string, number>;
}

export function fallbackInterpret(text: string, domainHint?: ScientificDomain): FallbackProposal {
  const match = matchSimulationByKeywords(text, domainHint);
  if (!match) return { matched: false, parameters: {} };
  return {
    matched: true,
    domain: match.domain,
    simulationId: match.simulationId,
    parameters: {},
  };
}