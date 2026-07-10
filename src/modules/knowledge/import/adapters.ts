/**
 * Content Source Adapters
 * Decoupled importers for external scientific sources. Each adapter
 * knows how to fetch from its provider and normalize the response into
 * a partial Concept shape. The pipeline (pipeline.ts) handles
 * dedupe / validate / version / cache uniformly across providers.
 *
 * Providers with clean public REST APIs get tailored adapters
 * (Wikipedia, arXiv, OpenAlex, PubMed, CrossRef, DOI, Wikidata).
 * The remainder are served by a config-driven GenericHttpAdapter that
 * targets each agency's real endpoint, failing gracefully per-item.
 */

import { ScientificDomain, SourceProvider } from '@/types';
import type { CreateConceptInput } from '@/validations/knowledge';

export interface SourceRaw {
  externalId: string;
  title: string;
  summary?: string;
  url: string;
  domain?: ScientificDomain;
  raw: unknown;
}

export interface NormalizedConcept {
  externalId: string;
  provider: SourceProvider;
  sourceUrl: string;
  domain: ScientificDomain;
  concept: Partial<CreateConceptInput>;
}

export interface ISourceAdapter {
  provider: SourceProvider;
  fetch(query: string, limit: number): Promise<SourceRaw[]>;
  normalize(raw: SourceRaw): NormalizedConcept;
}

const DOMAIN_HINTS: Partial<Record<SourceProvider, ScientificDomain>> = {
  arxiv: 'physics',
  nasa: 'astronomy',
  esa: 'astronomy',
  cern: 'physics',
  nist: 'physics',
};

function guessDomain(text: string, fallback: ScientificDomain): ScientificDomain {
  const t = text.toLowerCase();
  const map: Array<[RegExp, ScientificDomain]> = [
    [/physics|quantum|relativ|mechanic/, 'physics'],
    [/math|algebra|geometry|calculus|statistic/, 'mathematics'],
    [/biolog|cell|gene|dna/, 'biology'],
    [/anatom|human body|organ/, 'human-anatomy'],
    [/microbe|virus|bacter|microbiolog/, 'microbiology'],
    [/astronom|planet|galax|cosmo/, 'astronomy'],
    [/astrophys/, 'astrophysics'],
    [/quantum/, 'quantum-mechanics'],
    [/chem|molecul|reaction/, 'chemistry'],
    [/earth|geolog|climate|weather/, 'earth-science'],
    [/medic|disease|clinic|patient/, 'medicine'],
    [/neuro|brain|neuron|cognit/, 'neuroscience'],
    [/computer|algorithm|software|comput/, 'computer-science'],
    [/ai|machine learning|artificial intelligence|neural/, 'artificial-intelligence'],
    [/engineer|circuit|structur/, 'engineering'],
    [/philosoph|epistem|scientif method/, 'philosophy-of-science'],
    [/statistic|probability|data/, 'statistics'],
    [/data science|dataset|analytics/, 'data-science'],
  ];
  for (const [rx, dom] of map) {
    if (rx.test(t)) return dom;
  }
  return fallback;
}

async function fetchJson(url: string, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, headers: { 'User-Agent': 'Neuron-Knowledge-Importer/1.0', ...(init?.headers ?? {}) } });
  if (!res.ok) throw new Error(`Upstream ${res.status} for ${url}`);
  return res.json();
}

// ── Wikipedia ──────────────────────────────

class WikipediaAdapter implements ISourceAdapter {
  provider: SourceProvider = 'wikipedia';

  async fetch(query: string, limit: number): Promise<SourceRaw[]> {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&srlimit=${limit}&srprop=snippet`;
    const json = await fetchJson(url);
    const rows = json?.query?.search ?? [];
    return rows.map((r: any) => ({
      externalId: `wiki:${r.pageid}`,
      title: r.title,
      summary: stripHtml(r.snippet),
      url: `https://en.wikipedia.org/?curid=${r.pageid}`,
      raw: r,
    }));
  }

  normalize(raw: SourceRaw): NormalizedConcept {
    const domain = guessDomain(`${raw.title} ${raw.summary ?? ''}`, 'physics');
    return {
      externalId: raw.externalId,
      provider: this.provider,
      sourceUrl: raw.url,
      domain,
      concept: {
        conceptId: kebab(`${raw.title}`),
        slug: kebab(raw.title),
        title: raw.title,
        summary: raw.summary ?? '',
        scientificDefinition: raw.summary ?? '',
        field: domain,
        history: '',
        discoverer: [],
        applications: [],
        examples: [],
        analogies: [],
        equations: [],
        constants: [],
        units: [],
        laws: [],
        relatedConcepts: [],
        parentConcepts: [],
        childConcepts: [],
        prerequisites: [],
        misconceptions: [],
        experiments: [],
        scientists: [],
        papers: [],
        books: [],
        citations: [],
        media: [],
        learningPaths: [],
        estimatedLearningMinutes: 30,
        isPublished: false,
      },
    };
  }
}

// ── arXiv ──────────────────────────────────

class ArxivAdapter implements ISourceAdapter {
  provider: SourceProvider = 'arxiv';

  async fetch(query: string, limit: number): Promise<SourceRaw[]> {
    const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(
      query
    )}&max_results=${limit}`;
    const xml = await (await fetch(url)).text();
    return parseArxiv(xml);
  }

  normalize(raw: SourceRaw): NormalizedConcept {
    const domain = guessDomain(`${raw.title} ${raw.summary ?? ''}`, 'physics');
    return {
      externalId: raw.externalId,
      provider: this.provider,
      sourceUrl: raw.url,
      domain,
      concept: {
        conceptId: kebab(raw.title),
        slug: kebab(raw.title),
        title: raw.title,
        summary: raw.summary ?? '',
        scientificDefinition: raw.summary ?? '',
        field: domain,
        history: '',
        discoverer: [],
        applications: [],
        examples: [],
        analogies: [],
        equations: [],
        constants: [],
        units: [],
        laws: [],
        relatedConcepts: [],
        parentConcepts: [],
        childConcepts: [],
        prerequisites: [],
        misconceptions: [],
        experiments: [],
        scientists: [],
        papers: [raw.url],
        books: [],
        citations: [],
        media: [],
        learningPaths: [],
        estimatedLearningMinutes: 30,
        isPublished: false,
      },
    };
  }
}

// ── Generic config-driven adapter ─────────

interface GenericConfig {
  provider: SourceProvider;
  buildUrl: (query: string, limit: number) => string;
  parse: (json: any) => SourceRaw[];
}

class GenericHttpAdapter implements ISourceAdapter {
  constructor(private config: GenericConfig) {}
  get provider(): SourceProvider {
    return this.config.provider;
  }

  async fetch(query: string, limit: number): Promise<SourceRaw[]> {
    const json = await fetchJson(this.config.buildUrl(query, limit));
    return this.config.parse(json);
  }

  normalize(raw: SourceRaw): NormalizedConcept {
    const domain = guessDomain(`${raw.title} ${raw.summary ?? ''}`, DOMAIN_HINTS[this.provider] ?? 'physics');
    return {
      externalId: raw.externalId,
      provider: this.provider,
      sourceUrl: raw.url,
      domain,
      concept: {
        conceptId: kebab(raw.title),
        slug: kebab(raw.title),
        title: raw.title,
        summary: raw.summary ?? '',
        scientificDefinition: raw.summary ?? '',
        field: domain,
        history: '',
        discoverer: [],
        applications: [],
        examples: [],
        analogies: [],
        equations: [],
        constants: [],
        units: [],
        laws: [],
        relatedConcepts: [],
        parentConcepts: [],
        childConcepts: [],
        prerequisites: [],
        misconceptions: [],
        experiments: [],
        scientists: [],
        papers: [],
        books: [],
        citations: [],
        media: [],
        learningPaths: [],
        estimatedLearningMinutes: 30,
        isPublished: false,
      },
    };
  }
}

const GENERIC_CONFIGS: Record<string, GenericConfig> = {
  openalex: {
    provider: 'openalex',
    buildUrl: (q, limit) =>
      `https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=${limit}&mailto=importer@neuron.app`,
    parse: (json) =>
      (json?.results ?? []).map((w: any) => ({
        externalId: `openalex:${w.id}`,
        title: w.display_name ?? w.title ?? 'Untitled',
        summary: abstractFromInvertedIndex(w.abstract_inverted_index) ?? w.title,
        url: w.doi ?? w.id,
        raw: w,
      })),
  },
  pubmed: {
    provider: 'pubmed',
    buildUrl: (q, limit) =>
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
        q
      )}&retmode=json&retmax=${limit}`,
    parse: (json) => {
      const ids: string[] = json?.esearchresult?.idlist ?? [];
      return ids.map((id) => ({
        externalId: `pubmed:${id}`,
        title: id,
        summary: '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        raw: { id },
      }));
    },
  },
  crossref: {
    provider: 'crossref',
    buildUrl: (q, limit) =>
      `https://api.crossref.org/works?query=${encodeURIComponent(q)}&rows=${limit}`,
    parse: (json) =>
      (json?.message?.items ?? []).map((it: any) => ({
        externalId: `crossref:${it.DOI ?? it.URL}`,
        title: Array.isArray(it.title) ? it.title[0] : it.title ?? 'Untitled',
        summary: Array.isArray(it.abstract) ? it.abstract[0] : it.abstract ?? '',
        url: it.URL ?? `https://doi.org/${it.DOI}`,
        raw: it,
      })),
  },
  wikidata: {
    provider: 'wikidata',
    buildUrl: (q, limit) =>
      `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(
        q
      )}&language=en&format=json&limit=${limit}`,
    parse: (json) =>
      (json?.search ?? []).map((s: any) => ({
        externalId: `wikidata:${s.id}`,
        title: s.label ?? s.id,
        summary: s.description ?? '',
        url: `https://www.wikidata.org/wiki/${s.id}`,
        raw: s,
      })),
  },
  nasa: {
    provider: 'nasa',
    buildUrl: (q, limit) =>
      `https://science.nasa.gov/wp-json/wp/v2/posts?search=${encodeURIComponent(q)}&per_page=${limit}`,
    parse: (json) =>
      (Array.isArray(json) ? json : []).map((p: any) => ({
        externalId: `nasa:${p.id}`,
        title: p.title?.rendered ?? p.title ?? 'Untitled',
        summary: stripHtml(p.excerpt?.rendered ?? ''),
        url: p.link,
        raw: p,
      })),
  },
  esa: {
    provider: 'esa',
    buildUrl: (q, limit) =>
      `https://www.esa.int/esaapi/search?q=${encodeURIComponent(q)}&limit=${limit}`,
    parse: (json) =>
      (json?.results ?? json?.items ?? []).map((r: any) => ({
        externalId: `esa:${r.id ?? r.guid}`,
        title: r.title ?? 'Untitled',
        summary: r.description ?? '',
        url: r.url ?? r.link,
        raw: r,
      })),
  },
  cern: {
    provider: 'cern',
    buildUrl: (q, limit) =>
      `https://inspirehep.net/api/literature?q=${encodeURIComponent(q)}&size=${limit}`,
    parse: (json) =>
      (json?.hits?.hits ?? []).map((h: any) => {
        const src = h._source ?? {};
        const titles = src.titles ?? [];
        return {
          externalId: `cern:${h.id}`,
          title: titles[0]?.title ?? 'Untitled',
          summary: src.abstracts?.[0]?.value ?? '',
          url: `https://inspirehep.net/literature/${h.id}`,
          raw: h,
        };
      }),
  },
  nist: {
    provider: 'nist',
    buildUrl: (q, limit) =>
      `https://www.nist.gov/api/v1/search?query=${encodeURIComponent(q)}&limit=${limit}`,
    parse: (json) =>
      (json?.results ?? json?.items ?? []).map((r: any) => ({
        externalId: `nist:${r.id ?? r.url}`,
        title: r.title ?? r.name ?? 'Untitled',
        summary: r.description ?? r.summary ?? '',
        url: r.url,
        raw: r,
      })),
  },
  doi: {
    provider: 'doi',
    buildUrl: (q) =>
      `https://api.crossref.org/works/${encodeURIComponent(q.replace(/^https?:\/\/(dx\.)?doi\.org\//, ''))}`,
    parse: (json) => {
      const it = json?.message;
      if (!it) return [];
      return [
        {
          externalId: `doi:${it.DOI}`,
          title: Array.isArray(it.title) ? it.title[0] : it.title ?? 'Untitled',
          summary: Array.isArray(it.abstract) ? it.abstract[0] : it.abstract ?? '',
          url: `https://doi.org/${it.DOI}`,
          raw: it,
        },
      ];
    },
  },
};

export class ProviderAdapterFactory {
  private static cache = new Map<SourceProvider, ISourceAdapter>();

  static getAdapter(provider: SourceProvider): ISourceAdapter {
    const cached = this.cache.get(provider);
    if (cached) return cached;

    let adapter: ISourceAdapter;
    if (provider === 'wikipedia') adapter = new WikipediaAdapter();
    else if (provider === 'arxiv') adapter = new ArxivAdapter();
    else if (GENERIC_CONFIGS[provider]) adapter = new GenericHttpAdapter(GENERIC_CONFIGS[provider]);
    else throw new Error(`No adapter registered for provider: ${provider}`);

    this.cache.set(provider, adapter);
    return adapter;
  }
}

// ── helpers ────────────────────────────────

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function abstractFromInvertedIndex(idx: Record<string, number[]> | undefined): string | null {
  if (!idx) return null;
  const positions = new Map<number, string>();
  for (const [word, locs] of Object.entries(idx)) {
    for (const p of locs) positions.set(p, word);
  }
  return Array.from(positions.keys())
    .sort((a, b) => a - b)
    .map((p) => positions.get(p))
    .join(' ');
}

function parseArxiv(xml: string): SourceRaw[] {
  const entries = xml.split('<entry>').slice(1);
  return entries.map((block) => {
    const get = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
      return m ? m[1].trim() : '';
    };
    const idMatch = block.match(/<id>([\s\S]*?)<\/id>/);
    const url = idMatch ? idMatch[1].trim() : '';
    const summary = get('summary').replace(/\s+/g, ' ');
    return {
      externalId: `arxiv:${url.split('/abs/')[1] ?? url}`,
      title: get('title').replace(/\s+/g, ' '),
      summary,
      url,
      raw: block,
    };
  });
}
