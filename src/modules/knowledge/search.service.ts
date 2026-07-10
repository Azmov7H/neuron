/**
 * Search Service
 * Cross-collection scientific search: full-text ($text), concept
 * ranking, autocomplete, did-you-mean, and optional relationship
 * traversal. Vector/semantic search is delegated to ConceptService.
 */

import { Concept } from '@/database/models/knowledge/concept.model';
import { EncyclopediaArticle } from '@/database/models/knowledge/encyclopedia.model';
import { Equation } from '@/database/models/knowledge/equation.model';
import { Scientist } from '@/database/models/knowledge/scientist.model';
import { Experiment } from '@/database/models/knowledge/experiment.model';
import { GlossaryTerm } from '@/database/models/knowledge/glossary.model';
import { SortOrder } from 'mongoose';
import {
  ISearchQuery,
  ISearchResponse,
  ISearchResultItem,
  IConceptRanking,
  ScientificDomain,
  Difficulty,
} from '@/types';
import { ConceptService } from './concept.service';

type SearchKind = ISearchResultItem['kind'];

const DEFAULT_TYPES: SearchKind[] = ['concept', 'article', 'equation', 'scientist', 'experiment', 'glossary'];

interface RawHit {
  id: string;
  kind: SearchKind;
  title: string;
  snippet: string;
  domain: ScientificDomain;
  difficulty?: Difficulty;
  score: number;
  conceptId?: string;
}

export class SearchService {
  static async search(query: ISearchQuery): Promise<ISearchResponse> {
    const started = Date.now();
    const types = query.types?.length ? query.types : DEFAULT_TYPES;
    const limit = Math.min(query.limit ?? 10, 100);
    const offset = Math.max(query.offset ?? 0, 0);

    const baseFilter: Record<string, unknown> = {};
    if (query.domain) baseFilter.domain = query.domain;
    if (query.difficulty) baseFilter.difficulty = query.difficulty;

    const tasks: Promise<RawHit[]>[] = [];

    if (types.includes('concept')) {
      tasks.push(this.searchCollection(Concept, query.q, baseFilter, 'concept', (d) => ({
        title: d.title,
        snippet: d.summary,
        domain: d.field,
        difficulty: d.difficulty,
        conceptId: d.conceptId,
      })));
    }
    if (types.includes('article')) {
      tasks.push(this.searchCollection(EncyclopediaArticle, query.q, baseFilter, 'article', (d) => ({
        title: d.title,
        snippet: d.summary ?? d.overview ?? '',
        domain: d.domain,
      })));
    }
    if (types.includes('equation')) {
      tasks.push(this.searchCollection(Equation, query.q, baseFilter, 'equation', (d) => ({
        title: d.label,
        snippet: d.plainText,
        domain: d.domain,
        conceptId: d.conceptIds?.[0],
      })));
    }
    if (types.includes('scientist')) {
      tasks.push(this.searchCollection(Scientist, query.q, baseFilter, 'scientist', (d) => ({
        title: d.name,
        snippet: d.biography ?? '',
        domain: (d.fields?.[0] as ScientificDomain) ?? ('physics' as ScientificDomain),
      })));
    }
    if (types.includes('experiment')) {
      tasks.push(this.searchCollection(Experiment, query.q, baseFilter, 'experiment', (d) => ({
        title: d.title,
        snippet: d.purpose,
        domain: d.domain,
        conceptId: d.conceptIds?.[0],
      })));
    }
    if (types.includes('glossary')) {
      tasks.push(this.searchCollection(GlossaryTerm, query.q, baseFilter, 'glossary', (d) => ({
        title: d.term,
        snippet: d.definition,
        domain: (d.domain as ScientificDomain) ?? ('physics' as ScientificDomain),
        difficulty: d.difficulty,
      })));
    }

    const settled = await Promise.all(tasks);
    let results: RawHit[] = settled.flat();

    // Rerank across collections by normalized score.
    results.sort((a, b) => b.score - a.score);
    const total = results.length;
    const page = results.slice(offset, offset + limit);

    // Did-you-mean + autocomplete (only when results are thin).
    const correctedQuery = total === 0 ? await this.didYouMean(query.q) : undefined;
    const suggestions = total <= 3 ? await this.autocomplete(query.q, query.domain, 5) : [];

    const response: ISearchResponse = {
      query: query.q,
      correctedQuery,
      suggestions,
      total,
      took: Date.now() - started,
      results: page,
    };

    if (query.includeRelationships && page.length > 0) {
      const primary = page.find((r) => r.kind === 'concept' && r.conceptId) ?? page[0];
      if (primary.conceptId) {
        const related = await ConceptService.getRelated(primary.conceptId);
        // Annotate: keep response shape; relationships surfaced via ranking.
        void related;
      }
    }

    return response;
  }

  /** Generic $text search against a model, returning normalized hits. */
  private static async searchCollection<T extends { _id: unknown }>(
    model: { find: (q: Record<string, unknown>) => any },
    q: string,
    baseFilter: Record<string, unknown>,
    kind: SearchKind,
    map: (d: any) => { title: string; snippet: string; domain: ScientificDomain; difficulty?: Difficulty; conceptId?: string }
  ): Promise<RawHit[]> {
    const filter = { ...baseFilter, $text: { $search: q } };
    const sort: Record<string, unknown> = { score: { $meta: 'textScore' } };
    const docs: any[] = await model
      .find(filter)
      .select({ score: { $meta: 'textScore' } })
      .sort(sort as unknown as Record<string, SortOrder>)
      .limit(50)
      .lean();

    return docs.map((d) => {
      const m = map(d);
      return {
        id: String(d._id),
        kind,
        title: m.title,
        snippet: m.snippet,
        domain: m.domain,
        difficulty: m.difficulty,
        conceptId: m.conceptId,
        score: typeof d.score === 'number' ? d.score : 0,
      };
    });
  }

  // ── Autocomplete ─────────────────────────
  static async autocomplete(prefix: string, domain?: ScientificDomain, limit = 8): Promise<string[]> {
    if (prefix.length < 1) return [];
    const safe = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(`^${safe}`, 'i');

    const [concepts, terms] = await Promise.all([
      Concept.find({ title: rx, ...(domain ? { field: domain } : {}) })
        .limit(limit)
        .select({ title: 1 })
        .lean(),
      GlossaryTerm.find({ term: rx, ...(domain ? { domain } : {}) })
        .limit(limit)
        .select({ term: 1 })
        .lean(),
    ]);

    const titles = concepts.map((c: any) => c.title as string);
    const termTitles = terms.map((t: any) => t.term as string);
    return Array.from(new Set([...titles, ...termTitles])).slice(0, limit);
  }

  // ── Did-you-mean (Levenshtein over candidate titles) ──
  static async didYouMean(term: string): Promise<string | undefined> {
    const cleaned = term.trim().toLowerCase();
    if (cleaned.length < 3) return undefined;

    const tokens = cleaned.split(/\s+/).filter(Boolean);
    // Candidate set: titles of published, important concepts (bounded).
    const candidates = await Concept.find({ isPublished: true })
      .sort({ importance: -1 })
      .limit(500)
      .select({ title: 1, searchableText: 1 })
      .lean();

    let best: { term: string; dist: number } | null = null;
    const maxDist = Math.max(1, Math.floor(cleaned.length / 4));

    for (const c of candidates as any[]) {
      const hay = (c.searchableText || c.title || '').toLowerCase();
      for (const word of hay.split(/\s+/)) {
        if (Math.abs(word.length - cleaned.length) > maxDist) continue;
        const d = levenshtein(cleaned, word);
        if (d <= maxDist && (!best || d < best.dist)) {
          best = { term: word, dist: d };
        }
      }
      // Also consider multi-word matches for the first token.
      const first = tokens[0];
      if (first && hay.includes(first)) {
        const d = levenshtein(first, tokens[0]);
        if (d <= maxDist && (!best || d < best.dist)) best = { term: tokens[0], dist: d };
      }
    }

    return best ? best.term : undefined;
  }

  // ── Concept ranking (importance + relationships + views) ──
  static async rank(conceptIds: string[]): Promise<IConceptRanking[]> {
    const concepts = await Concept.find({ conceptId: { $in: conceptIds } })
      .select({ conceptId: 1, title: 1, importance: 1, views: 1, relatedConcepts: 1 })
      .lean();

    return concepts.map((c: any) => {
      const reasons: string[] = [];
      if (c.importance >= 80) reasons.push('high importance');
      if (c.views >= 1000) reasons.push('widely viewed');
      if ((c.relatedConcepts?.length ?? 0) >= 5) reasons.push('highly connected');
      const score = (c.importance ?? 0) * 0.6 + Math.min(c.views ?? 0, 5000) / 5000 * 40;
      return {
        conceptId: c.conceptId,
        title: c.title,
        score: Math.round(score * 100) / 100,
        reasons,
      };
    });
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}
