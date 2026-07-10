/**
 * Import Pipeline
 * Orchestrates a decoupled content import: fetch (cached) → normalize
 * → deduplicate → validate → version → persist. Each stage is isolated
 * so a single malformed record cannot abort the whole run. Supports
 * dry-run for impact analysis.
 */

import { Concept } from '@/database/models/knowledge/concept.model';
import { AppError } from '@/types';
import { IImportResult } from '@/types';
import { CreateConceptSchema } from '@/validations/knowledge';
import { ConceptService } from '../concept.service';
import { getCache } from './cache';
import { ISourceAdapter, ProviderAdapterFactory, SourceRaw } from './adapters';
import type { ImportRequestInput } from '@/validations/knowledge';

export class ImportPipeline {
  static async run(request: ImportRequestInput): Promise<IImportResult> {
    const started = new Date();
    const adapter = ProviderAdapterFactory.getAdapter(request.provider);
    const cache = getCache();

    const cacheKey = `import:${request.provider}:${request.query ?? ''}:${request.limit}`;
    let raws = await cache.get<SourceRaw[]>(cacheKey);
    if (!raws) {
      raws = await this.safeFetch(adapter, request);
      await cache.set(cacheKey, raws, 86400);
    }
    const fetched = raws.length;

    let normalized = 0;
    let deduplicated = 0;
    let validated = 0;
    let created = 0;
    let updated = 0;
    let failed = 0;
    const errors: Array<{ externalId: string; reason: string }> = [];
    const seen = new Set<string>();

    for (const raw of raws) {
      try {
        const norm = adapter.normalize(raw);
        normalized++;

        const dedupeKey = `${norm.provider}:${norm.externalId}`;
        if (seen.has(dedupeKey)) {
          deduplicated++;
          continue;
        }
        seen.add(dedupeKey);

        const parsed = CreateConceptSchema.safeParse(norm.concept);
        if (!parsed.success) {
          validated++;
          failed++;
          errors.push({
            externalId: norm.externalId,
            reason: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
          });
          continue;
        }
        validated++;

        if (request.dryRun) continue;

        const data = parsed.data;
        const existing = await Concept.findOne({ conceptId: data.conceptId });
        if (existing) {
          await ConceptService.update(data.conceptId, data);
          updated++;
        } else {
          await ConceptService.create({
            ...data,
            provenance: {
              provider: norm.provider,
              externalId: norm.externalId,
              sourceUrl: norm.sourceUrl,
              importedAt: new Date(),
              confidence: 0.8,
            },
          });
          created++;
        }
      } catch (e) {
        failed++;
        errors.push({ externalId: raw.externalId, reason: (e as Error).message });
      }
    }

    return {
      provider: request.provider,
      fetched,
      normalized,
      deduplicated,
      validated,
      created,
      updated,
      failed,
      errors,
      startedAt: started,
      finishedAt: new Date(),
    };
  }

  private static async safeFetch(adapter: ISourceAdapter, request: ImportRequestInput): Promise<SourceRaw[]> {
    try {
      return await adapter.fetch(request.query ?? '', request.limit);
    } catch (e) {
      throw new AppError(502, `Failed to fetch from ${request.provider}: ${(e as Error).message}`, 'IMPORT_FETCH_FAILED');
    }
  }
}
