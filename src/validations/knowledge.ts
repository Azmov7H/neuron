/**
 * Knowledge Validation Schemas
 * Zod v4 schemas for the Scientific Knowledge Engine.
 * Naming: <Entity>Schema for full create, <Entity>UpdateSchema for partials.
 */

import { z } from 'zod';
import {
  SUPPORTED_DOMAINS,
  RELATIONSHIP_TYPES,
  ScientificDomain,
  RelationshipType,
  Difficulty,
  LearningLevel,
  TimelineEra,
  SourceProvider,
  CitationStyle,
} from '@/types';

// ── Reusable enums ────────────────────────

const DOMAIN = z.enum(SUPPORTED_DOMAINS as unknown as [ScientificDomain, ...ScientificDomain[]]);
const DIFFICULTY = z.enum(['beginner', 'intermediate', 'advanced']);
const LEARNING_LEVEL = z.enum(['k12', 'undergraduate', 'graduate', 'research']);
const RELATIONSHIP = z.enum(RELATIONSHIP_TYPES as unknown as [RelationshipType, ...RelationshipType[]]);
const MEDIA_KIND = z.enum(['image', 'video', 'threeDModel', 'simulation', 'quiz', 'interactive']);
const TIMELINE_ERA = z.enum([
  'ancient',
  'classical',
  'medieval',
  'renaissance',
  'scientific-revolution',
  'enlightenment',
  'industrial',
  'modern',
  'contemporary',
] as unknown as [TimelineEra, ...TimelineEra[]]);
const SOURCE_PROVIDER = z.enum([
  'wikipedia',
  'wikidata',
  'openalex',
  'pubmed',
  'nasa',
  'esa',
  'cern',
  'nist',
  'arxiv',
  'crossref',
  'doi',
  'manual',
] as unknown as [SourceProvider, ...SourceProvider[]]);
const CITATION_TYPE = z.enum([
  'article',
  'book',
  'journal',
  'web',
  'conference',
  'thesis',
  'patent',
  'dataset',
]);
const CITATION_STYLE = z.enum(['apa', 'mla', 'bibtex', 'chicago']);

// ── Shared sub-objects ─────────────────────

const MediaReferenceSchema = z.object({
  kind: MEDIA_KIND,
  url: z.string().url(),
  title: z.string().optional(),
  provider: z.string().optional(),
  thumbnail: z.string().url().optional(),
  durationSeconds: z.number().int().min(0).optional(),
  license: z.string().optional(),
  attribution: z.string().optional(),
});

const ScientificExampleSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  context: z.string().optional(),
  solution: z.string().optional(),
});

const AnalogySchema = z.object({
  analogy: z.string().min(1),
  explains: z.string().min(1),
  targetAudience: DIFFICULTY.optional(),
});

const MisconceptionSchema = z.object({
  misconception: z.string().min(1),
  clarification: z.string().min(1),
  commonCause: z.string().optional(),
});

// ── CONCEPT ────────────────────────────────

export const CreateConceptSchema = z.object({
  conceptId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'conceptId must be kebab-case'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(1000),
  scientificDefinition: z.string().min(1),
  history: z.string().optional().default(''),
  discoverer: z.array(z.string()).optional().default([]),
  field: DOMAIN,
  difficulty: DIFFICULTY.optional().default('beginner'),
  importance: z.number().min(0).max(100).optional().default(50),
  learningLevel: LEARNING_LEVEL.optional().default('undergraduate'),
  applications: z.array(z.string()).optional().default([]),
  examples: z.array(ScientificExampleSchema).optional().default([]),
  analogies: z.array(AnalogySchema).optional().default([]),
  equations: z.array(z.string()).optional().default([]),
  constants: z.array(z.string()).optional().default([]),
  units: z.array(z.string()).optional().default([]),
  laws: z.array(z.string()).optional().default([]),
  relatedConcepts: z.array(z.string()).optional().default([]),
  parentConcepts: z.array(z.string()).optional().default([]),
  childConcepts: z.array(z.string()).optional().default([]),
  prerequisites: z.array(z.string()).optional().default([]),
  misconceptions: z.array(MisconceptionSchema).optional().default([]),
  experiments: z.array(z.string()).optional().default([]),
  scientists: z.array(z.string()).optional().default([]),
  papers: z.array(z.string()).optional().default([]),
  books: z.array(z.string()).optional().default([]),
  citations: z.array(z.string()).optional().default([]),
  media: z.array(MediaReferenceSchema).optional().default([]),
  matrixNodeId: z.string().optional(),
  learningPaths: z.array(z.string()).optional().default([]),
  estimatedLearningMinutes: z.number().int().min(0).optional().default(30),
  isPublished: z.boolean().optional().default(false),
  provenance: z
    .object({
      provider: SOURCE_PROVIDER,
      externalId: z.string(),
      sourceUrl: z.string().url(),
      importedAt: z.coerce.date().optional(),
      lastSyncedAt: z.coerce.date().optional(),
      confidence: z.number().min(0).max(1).optional(),
      rawHash: z.string().optional(),
    })
    .optional(),
});
export type CreateConceptInput = z.infer<typeof CreateConceptSchema>;

export const UpdateConceptSchema = CreateConceptSchema.partial().omit({ conceptId: true, slug: true });
export type UpdateConceptInput = z.infer<typeof UpdateConceptSchema>;

// ── RELATIONSHIP ───────────────────────────

export const CreateRelationshipSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
  type: RELATIONSHIP,
  weight: z.number().min(0).max(1).optional().default(0.5),
  description: z.string().optional(),
  bidirectional: z.boolean().optional().default(false),
});
export type CreateRelationshipInput = z.infer<typeof CreateRelationshipSchema>;

// ── TAXONOMY ──────────────────────────────

export const CreateTaxonomyNodeSchema = z.object({
  nodeId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'nodeId must be kebab-case'),
  label: z.string().min(1).max(200),
  domain: DOMAIN,
  parentId: z.string().nullable().optional(),
  conceptId: z.string().optional(),
  level: z.number().int().min(0).optional(), // computed from parent when omitted
  path: z.array(z.string()).optional(), // [root, ..., self]; computed when omitted
  order: z.number().int().min(0).optional().default(0),
  description: z.string().optional(),
  isLeaf: z.boolean().optional().default(false),
});
export type CreateTaxonomyNodeInput = z.infer<typeof CreateTaxonomyNodeSchema>;

// ── DOMAIN ─────────────────────────────────

export const CreateDomainSchema = z.object({
  slug: DOMAIN,
  name: z.string().min(1).max(100),
  description: z.string().optional().default(''),
  parentDomain: DOMAIN.optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a hex value'),
  icon: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});
export type CreateDomainInput = z.infer<typeof CreateDomainSchema>;

// ── ENCYCLOPEDIA ─────────────────────────

export const ArticleSectionSchema = z.object({
  heading: z.string().min(1),
  content: z.string().min(1),
  order: z.number().int().min(0).optional().default(0),
});

export const CreateArticleSchema = z.object({
  articleId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'articleId must be kebab-case'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  title: z.string().min(1).max(200),
  conceptId: z.string().optional(),
  domain: DOMAIN,
  summary: z.string().min(1),
  overview: z.string().min(1),
  sections: z.array(ArticleSectionSchema).optional().default([]),
  history: z.string().optional().default(''),
  proofs: z.array(z.string()).optional().default([]),
  equations: z.array(z.string()).optional().default([]),
  animations: z.array(MediaReferenceSchema).optional().default([]),
  simulations: z.array(MediaReferenceSchema).optional().default([]),
  visualizations3D: z.array(MediaReferenceSchema).optional().default([]),
  realWorldApplications: z.array(z.string()).optional().default([]),
  research: z.array(z.string()).optional().default([]),
  references: z.array(z.string()).optional().default([]),
  citations: z.array(z.string()).optional().default([]),
  relatedArticleIds: z.array(z.string()).optional().default([]),
  authors: z.array(z.string()).optional().default([]),
  isFeatured: z.boolean().optional().default(false),
  readingMinutes: z.number().int().min(0).optional().default(0),
  isPublished: z.boolean().optional().default(false),
});
export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;

export const UpdateArticleSchema = CreateArticleSchema.partial().omit({ articleId: true, slug: true });
export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;

// ── EQUATION ───────────────────────────────

export const EquationVariableSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  unit: z.string().optional(),
  description: z.string().optional(),
  typicalRange: z.string().optional(),
});

export const CreateEquationSchema = z.object({
  equationId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'equationId must be kebab-case'),
  label: z.string().min(1),
  latex: z.string().min(1),
  mathml: z.string().optional(),
  plainText: z.string().min(1),
  domain: DOMAIN,
  conceptIds: z.array(z.string()).optional().default([]),
  variables: z.array(EquationVariableSchema).optional().default([]),
  constants: z
    .array(z.object({ symbol: z.string(), value: z.string(), unit: z.string().optional() }))
    .optional()
    .default([]),
  unitAnalysis: z.string().optional(),
  derivation: z.string().optional(),
  examples: z.array(ScientificExampleSchema).optional().default([]),
  interactiveSolver: z
    .object({
      enabled: z.boolean().default(false),
      inputs: z.array(z.string()).default([]),
      outputSymbol: z.string(),
      formula: z.string(),
    })
    .optional(),
  graphSupport: z.boolean().optional().default(false),
  simulationLinks: z.array(z.string()).optional().default([]),
  citations: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional().default(false),
});
export type CreateEquationInput = z.infer<typeof CreateEquationSchema>;

// ── EXPERIMENT ────────────────────────────

export const ExperimentVariableSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['independent', 'dependent', 'controlled']),
  unit: z.string().optional(),
  description: z.string().optional(),
});

export const CreateExperimentSchema = z.object({
  experimentId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'experimentId must be kebab-case'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  title: z.string().min(1),
  domain: DOMAIN,
  conceptIds: z.array(z.string()).optional().default([]),
  purpose: z.string().min(1),
  equipment: z.array(z.string()).optional().default([]),
  procedure: z.array(z.string()).min(1),
  variables: z.array(ExperimentVariableSchema).optional().default([]),
  theory: z.string().min(1),
  expectedOutcome: z.string().min(1),
  interactiveSimulation: MediaReferenceSchema.optional(),
  historicalSignificance: z.string().optional(),
  scientistIds: z.array(z.string()).optional().default([]),
  citations: z.array(z.string()).optional().default([]),
  difficulty: DIFFICULTY.optional().default('beginner'),
  estimatedMinutes: z.number().int().min(0).optional().default(0),
  isPublished: z.boolean().optional().default(false),
});
export type CreateExperimentInput = z.infer<typeof CreateExperimentSchema>;

// ── SCIENTIST ─────────────────────────────

export const CreateScientistSchema = z.object({
  scientistId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'scientistId must be kebab-case'),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  name: z.string().min(1),
  fullName: z.string().min(1),
  birthYear: z.number().int().optional(),
  deathYear: z.number().int().optional(),
  nationality: z.array(z.string()).optional().default([]),
  biography: z.string().min(1),
  timeline: z
    .array(z.object({ year: z.number().int(), description: z.string().min(1) }))
    .optional()
    .default([]),
  fields: z.array(DOMAIN).min(1),
  majorDiscoveries: z.array(z.string()).optional().default([]),
  awards: z.array(z.string()).optional().default([]),
  relatedConceptIds: z.array(z.string()).optional().default([]),
  relatedExperimentIds: z.array(z.string()).optional().default([]),
  relatedEquationIds: z.array(z.string()).optional().default([]),
  influencedBy: z.array(z.string()).optional().default([]),
  influenced: z.array(z.string()).optional().default([]),
  citations: z.array(z.string()).optional().default([]),
  portraitUrl: z.string().url().optional(),
  isPublished: z.boolean().optional().default(false),
});
export type CreateScientistInput = z.infer<typeof CreateScientistSchema>;

// ── TIMELINE ──────────────────────────────

export const CreateTimelineEventSchema = z.object({
  eventId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'eventId must be kebab-case'),
  title: z.string().min(1),
  year: z.number().int(),
  era: TIMELINE_ERA,
  domain: DOMAIN,
  description: z.string().min(1),
  conceptIds: z.array(z.string()).optional().default([]),
  scientistIds: z.array(z.string()).optional().default([]),
  experimentIds: z.array(z.string()).optional().default([]),
  equationIds: z.array(z.string()).optional().default([]),
  relatedEventIds: z.array(z.string()).optional().default([]),
  significance: z.number().min(0).max(100).optional().default(50),
});
export type CreateTimelineEventInput = z.infer<typeof CreateTimelineEventSchema>;

// ── GLOSSARY ──────────────────────────────

export const CreateGlossaryTermSchema = z.object({
  termId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'termId must be kebab-case'),
  term: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'slug must be kebab-case'),
  definition: z.string().min(1),
  pronunciation: z.string().optional(),
  synonyms: z.array(z.string()).optional().default([]),
  relatedConceptIds: z.array(z.string()).optional().default([]),
  domain: DOMAIN,
  difficulty: DIFFICULTY.optional().default('beginner'),
  examples: z.array(z.string()).optional().default([]),
  isPublished: z.boolean().optional().default(false),
});
export type CreateGlossaryTermInput = z.infer<typeof CreateGlossaryTermSchema>;

// ── CITATION ──────────────────────────────

export const CreateCitationSchema = z.object({
  citationId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'citationId must be kebab-case'),
  type: CITATION_TYPE,
  title: z.string().min(1),
  authors: z.array(z.string()).min(1),
  year: z.number().int().optional(),
  publisher: z.string().optional(),
  journal: z.string().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
  url: z.string().url().optional(),
  accessedAt: z.coerce.date().optional(),
  bibtex: z.string().optional(),
  apa: z.string().optional(),
  mla: z.string().optional(),
  chicago: z.string().optional(),
  relatedConceptIds: z.array(z.string()).optional().default([]),
});
export type CreateCitationInput = z.infer<typeof CreateCitationSchema>;

// ── REFERENCE ──────────────────────────────

export const CreateReferenceSchema = z.object({
  referenceId: z.string().min(1).regex(/^[a-z0-9-]+$/, 'referenceId must be kebab-case'),
  title: z.string().min(1),
  url: z.string().url(),
  provider: SOURCE_PROVIDER,
  domain: DOMAIN,
  description: z.string().optional(),
  authors: z.array(z.string()).optional().default([]),
  publishedYear: z.number().int().optional(),
  doi: z.string().optional(),
  pmid: z.string().optional(),
  arxivId: z.string().optional(),
  concepts: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  trustScore: z.number().min(0).max(1).optional().default(0.5),
  isPeerReviewed: z.boolean().optional().default(false),
});
export type CreateReferenceInput = z.infer<typeof CreateReferenceSchema>;

// ── SEARCH ────────────────────────────────

export const SearchQuerySchema = z.object({
  q: z.string().min(1),
  domain: DOMAIN.optional(),
  difficulty: DIFFICULTY.optional(),
  types: z
    .array(z.enum(['concept', 'article', 'equation', 'scientist', 'experiment', 'glossary']))
    .optional(),
  limit: z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().int().min(1).max(100).optional().default(10)),
  offset: z.preprocess((v) => (typeof v === 'string' ? Number(v) : v), z.number().int().min(0).optional().default(0)),
  includeRelationships: z
    .preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean().optional().default(false)),
});
export type SearchQueryInput = z.infer<typeof SearchQuerySchema>;

// ── IMPORT ────────────────────────────────

export const ImportRequestSchema = z.object({
  provider: SOURCE_PROVIDER,
  domain: DOMAIN.optional(),
  query: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional().default(50),
  dryRun: z.boolean().optional().default(false),
});
export type ImportRequestInput = z.infer<typeof ImportRequestSchema>;

// ── CITATION FORMAT ──────────────────────

export const CitationFormatSchema = z.object({
  citationId: z.string().min(1),
  style: CITATION_STYLE.optional().default('apa'),
});
export type CitationFormatInput = z.infer<typeof CitationFormatSchema>;
