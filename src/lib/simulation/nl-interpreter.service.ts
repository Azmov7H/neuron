/**
 * Natural Language Interpreter Service
 * Converts free-text experiment descriptions into strictly validated
 * SimulationConfig proposals. The LLM is only a JSON producer — everything
 * it returns is treated as untrusted and goes through the validation
 * pipeline: schema → registry lookup → parameter bounds → required params.
 */

import { LLMProviderFactory } from '@/lib/ai/providers/provider.factory';
import { config } from '@/config/env';
import { logger } from '@/lib/logger';
import {
  LlmInterpretationOutputSchema,
  buildParameterSchema,
  checkParameterBounds,
  findMissingRequiredParams,
  type LlmInterpretationOutput,
} from './schemas';
import { getAllSimulations, getSimulation, DOMAIN_ORDER } from './registry';
import type {
  ScientificDomain,
  SimulationParameter,
} from './registry.types';
import { fallbackInterpret } from './fallback-interpreter';

const LLM_TIMEOUT_MS = 8000;

export type NlReadyResult = {
  status: 'ready';
  simulationId: string;
  domain: ScientificDomain;
  name: string;
  equation: string;
  parameters: Record<string, number>;
  availableParameters: SimulationParameter[];
};

export type NlNeedsInputResult = {
  status: 'needs_input';
  simulationId: string;
  domain: ScientificDomain;
  name: string;
  equation: string;
  missingParameters: string[];
  availableParameters: SimulationParameter[];
  providedParameters: Record<string, number>;
};

export type NlUnsupportedResult = {
  status: 'unsupported';
  message: string;
  suggestions: string[];
};

export type NlInterpretationResult = NlReadyResult | NlNeedsInputResult | NlUnsupportedResult;

export interface NlInterpretOptions {
  text: string;
  domainHint?: ScientificDomain;
}

/**
 * Serializes the simulation registry into a compact system prompt.
 * This is the source of truth the LLM must map against — it defines the
 * only simulation IDs and parameter keys the model may ever output.
 */
export function buildRegistrySystemPrompt(): string {
  const all = getAllSimulations();
  const domainList = [...DOMAIN_ORDER].join(', ');
  const lines: string[] = [
    'You are a scientific simulation assistant on the Neuron platform.',
    'Map the user\'s natural-language experiment description to EXACTLY ONE simulation from the catalog below.',
    'If no simulation fits, respond with ONLY: {"matched": false}',
    'If one fits, respond with ONLY valid JSON in this exact shape:',
    '{"matched": true, "domain": "<domain>", "simulationId": "<id>", "parameters": {"<paramKey>": <number>}}',
    'Rules:',
    `- domain must be one of: ${domainList}.`,
    '- simulationId must be exactly one id from the catalog. Never invent ids.',
    '- parameters: only keys from that simulation\'s parameter list, only values the user explicitly stated (plain numbers).',
    '- Do NOT include parameters the user did not mention.',
    '- If the user omitted required parameters, still return the simulation with only the stated parameters.',
    '- Round values reasonably. Never return markdown, never explain, never execute anything.',
    '--- CATALOG ---',
  ];
  for (const domain of DOMAIN_ORDER) {
    lines.push(`[${domain}]`);
    for (const sim of all[domain]) {
      lines.push(`- "${sim.id}": ${sim.name} (equation: ${sim.equation})`);
      for (const parameter of sim.parameters) {
        const unit = parameter.unit ? ` ${parameter.unit}` : '';
        lines.push(
          `    ${parameter.key}: ${parameter.label}${unit}, type ${parameter.type}, range [${parameter.min}, ${parameter.max}], step ${parameter.step}, default ${parameter.default}, required ${parameter.required}`
        );
      }
    }
  }
  return lines.join('\n');
}

function buildUserPrompt(text: string, domainHint?: ScientificDomain): string {
  const hint = domainHint
    ? `\nPreferred domain (user is browsing it): ${domainHint}. Match within this domain first.`
    : '';
  return `Translate this user description into a simulation configuration:${hint}\n\nUSER: ${text}\n\nRespond with ONLY the JSON object per the catalog rules.`;
}

export class NaturalLanguageInterpreter {
  /**
   * Main entry point: LLM proposal (or keyword fallback) → strict validation → result.
   */
  static async interpret(options: NlInterpretOptions): Promise<NlInterpretationResult> {
    const llmProposal = await this.requestLlmProposal(options);
    const proposal =
      llmProposal ?? fallbackInterpret(options.text.trim(), options.domainHint);
    return resolveNlProposal(proposal, options.domainHint);
  }

  private static async requestLlmProposal(
    options: NlInterpretOptions
  ): Promise<LlmInterpretationOutput | null> {
    const apiKey = config.ai.openRouterApiKey || config.ai.openaiApiKey;
    if (!apiKey) {
      logger.debug('[NL Interpreter] No AI keys configured; using local fallback');
      return null;
    }

    const provider = LLMProviderFactory.getProvider();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    try {
      const raw = await provider.generateCompletion(
        [
          { role: 'system', content: buildRegistrySystemPrompt() },
          { role: 'user', content: buildUserPrompt(options.text, options.domainHint) },
        ],
        { temperature: 0.1, signal: controller.signal }
      );
      return this.parseLlmProposal(raw);
    } catch (err) {
      logger.warn(
        '[NL Interpreter] LLM provider failed, using local fallback:',
        err instanceof Error ? err.message : err
      );
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private static parseLlmProposal(raw: string): LlmInterpretationOutput | null {
    const cleaned = raw.replace(/```(?:json)?/gi, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      logger.warn('[NL Interpreter] LLM response contained no JSON object');
      return null;
    }

    try {
      const parsedUnknown: unknown = JSON.parse(cleaned.slice(start, end + 1));
      const validated = LlmInterpretationOutputSchema.safeParse(parsedUnknown);
      if (!validated.success) {
        logger.warn(
          '[NL Interpreter] LLM JSON failed schema:',
          validated.error.issues.map((issue) => issue.message).join('; ')
        );
        return null;
      }
      return validated.data;
    } catch {
      logger.warn('[NL Interpreter] LLM response was not valid JSON');
      return null;
    }
  }
}

export function unsupportedResult(domainHint?: ScientificDomain): NlUnsupportedResult {
  const all = getAllSimulations();
  const domains = domainHint ? [domainHint] : [...DOMAIN_ORDER];
  const suggestions: string[] = [];
  for (const domain of domains) {
    for (const sim of all[domain]) {
      if (suggestions.length >= 4) break;
      suggestions.push(sim.name);
    }
    if (suggestions.length >= 4) break;
  }
  return {
    status: 'unsupported',
    message: 'No simulation matched your description.',
    suggestions,
  };
}

/**
 * Validation pipeline for a proposal (LLM or fallback — both untrusted):
 * 1. Zod shape gate            (matched/domain/simulationId/parameters)
 * 2. Registry ID whitelist     (rejects hallucinated simulations)
 * 3. Per-sim parameter schema  (drops unknown/non-numeric keys)
 * 4. Registry bounds           (clamps out-of-range values)
 * 5. Required-param check      (missing → needs_input)
 *
 * Exported as a pure function so contract tests can feed it arbitrary
 * (including malicious) model output without network access.
 */
export function resolveNlProposal(
  proposal: LlmInterpretationOutput | null,
  domainHint?: ScientificDomain
): NlInterpretationResult {
  if (!proposal || !proposal.matched || !proposal.domain || !proposal.simulationId) {
    return unsupportedResult(domainHint);
  }

  const domain = proposal.domain;
  const sim = getSimulation(proposal.simulationId, domain);
  if (!sim) {
    logger.warn(
      `[NL Interpreter] Unknown simulation "${proposal.simulationId}" in "${domain}" — rejected`
    );
    return unsupportedResult(domainHint);
  }

  const rawParams = proposal.parameters ?? {};

  // 3) Per-sim schema: only known keys, only finite numbers.
  const sanitized: Record<string, number> = {};
  for (const [key, value] of Object.entries(rawParams)) {
    if (Number.isFinite(value)) sanitized[key] = value;
    else logger.warn(`[NL Interpreter] Dropping non-finite value for "${key}"`);
  }
  const perSim = buildParameterSchema(sim);
  const perSimResult = perSim.safeParse(sanitized);
  if (!perSimResult.success) {
    for (const issue of perSimResult.error.issues) {
      const key = String(issue.path[0]);
      if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
        // Out-of-range values are NOT dropped here — they are clamped by
        // the registry bounds step below. Only structurally invalid values
        // (wrong type) are removed.
        if (issue.code === 'too_big' || issue.code === 'too_small') continue;
        logger.warn(`[NL Interpreter] Dropping invalid parameter "${key}": ${issue.message}`);
        delete sanitized[key];
      }
    }
  }

  // 4) Registry bounds: clamp every provided value into [min, max].
  const bounds = checkParameterBounds(sim, sanitized);
  const finalParams: Record<string, number> = {};
  for (const parameter of sim.parameters) {
    let value = sanitized[parameter.key];
    if (value === undefined) value = parameter.default;
    if (bounds.clamped[parameter.key]) {
      value = bounds.clamped[parameter.key].clamped;
      logger.warn(
        `[NL Interpreter] Clamped "${parameter.key}" to ${value} (registry bound)`
      );
    }
    finalParams[parameter.key] = value;
  }

  // 5) Required-param check. The requirement contract treats an empty
  // provided set as "the user did not configure anything" — surface that as
  // needs_input instead of silently launching the engine with all defaults.
  // As soon as at least one parameter is provided, registry defaults complete
  // the rest of the configuration (ready).
  const missing =
    Object.keys(sanitized).length === 0 ? findMissingRequiredParams(sim, {}) : [];
  if (missing.length > 0) {
    return {
      status: 'needs_input',
      simulationId: sim.id,
      domain: sim.domain,
      name: sim.name,
      equation: sim.equation,
      missingParameters: missing,
      availableParameters: sim.parameters,
      providedParameters: finalParams,
    };
  }

  return {
    status: 'ready',
    simulationId: sim.id,
    domain: sim.domain,
    name: sim.name,
    equation: sim.equation,
    parameters: finalParams,
    availableParameters: sim.parameters,
  };
}