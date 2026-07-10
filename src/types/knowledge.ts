import type { Types } from 'mongoose';

// ============================================
// SCIENTIFIC KNOWLEDGE ENGINE — DOMAIN TYPES
// ============================================
// Central type system for Neuron's structured scientific
// knowledge base. The LLM is a reasoning layer over this
// data, not the source of truth.

// ─────────────────────────────────────────────
// ENUMS / UNIONS
// ─────────────────────────────────────────────

export type ScientificDomain =
  | 'physics'
  | 'mathematics'
  | 'biology'
  | 'human-anatomy'
  | 'microbiology'
  | 'astronomy'
  | 'astrophysics'
  | 'quantum-mechanics'
  | 'chemistry'
  | 'earth-science'
  | 'medicine'
  | 'neuroscience'
  | 'computer-science'
  | 'artificial-intelligence'
  | 'engineering'
  | 'philosophy-of-science'
  | 'statistics'
  | 'data-science';

export const SUPPORTED_DOMAINS: readonly ScientificDomain[] = [
  'physics',
  'mathematics',
  'biology',
  'human-anatomy',
  'microbiology',
  'astronomy',
  'astrophysics',
  'quantum-mechanics',
  'chemistry',
  'earth-science',
  'medicine',
  'neuroscience',
  'computer-science',
  'artificial-intelligence',
  'engineering',
  'philosophy-of-science',
  'statistics',
  'data-science',
] as const;

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export type LearningLevel = 'k12' | 'undergraduate' | 'graduate' | 'research';

export type RelationshipType =
  | 'isPartOf'
  | 'dependsOn'
  | 'requires'
  | 'extends'
  | 'derivedFrom'
  | 'oppositeOf'
  | 'causes'
  | 'explains'
  | 'uses'
  | 'similarTo'
  | 'applicationOf'
  | 'mathematicalRepresentation'
  | 'historicallyConnected'
  | 'scientificallyConnected';

export const RELATIONSHIP_TYPES: readonly RelationshipType[] = [
  'isPartOf',
  'dependsOn',
  'requires',
  'extends',
  'derivedFrom',
  'oppositeOf',
  'causes',
  'explains',
  'uses',
  'similarTo',
  'applicationOf',
  'mathematicalRepresentation',
  'historicallyConnected',
  'scientificallyConnected',
] as const;

export type MediaKind = 'image' | 'video' | 'threeDModel' | 'simulation' | 'quiz' | 'interactive';

export type SourceProvider =
  | 'wikipedia'
  | 'wikidata'
  | 'openalex'
  | 'pubmed'
  | 'nasa'
  | 'esa'
  | 'cern'
  | 'nist'
  | 'arxiv'
  | 'crossref'
  | 'doi'
  | 'manual';

export type CitationStyle = 'apa' | 'mla' | 'bibtex' | 'chicago';

export type TimelineEra =
  | 'ancient'
  | 'classical'
  | 'medieval'
  | 'renaissance'
  | 'scientific-revolution'
  | 'enlightenment'
  | 'industrial'
  | 'modern'
  | 'contemporary';

// ─────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────

export interface IMediaReference {
  kind: MediaKind;
  url: string;
  title?: string;
  provider?: string;
  thumbnail?: string;
  durationSeconds?: number;
  license?: string;
  attribution?: string;
}

export interface IScientificExample {
  title: string;
  description: string;
  context?: string; // real-world scenario
  solution?: string;
}

export interface IAnalogy {
  analogy: string;
  explains: string; // what it explains
  targetAudience?: Difficulty;
}

export interface IMisconception {
  misconception: string;
  clarification: string;
  commonCause?: string;
}

export interface IProvenance {
  provider: SourceProvider;
  externalId: string; // e.g. Wikidata Q-id, PubMed PMID, arXiv id
  sourceUrl: string;
  importedAt?: Date;
  lastSyncedAt?: Date;
  confidence?: number; // 0-1 source reliability
  rawHash?: string; // content fingerprint for change detection
}

export interface IVersionInfo {
  version: number;
  previousVersionId?: Types.ObjectId | string;
  editedBy?: string; // userId or 'system'
  editedAt: Date;
  changeSummary?: string;
}

// ─────────────────────────────────────────────
// DOMAIN CATALOG
// ─────────────────────────────────────────────

export interface IDomainMeta {
  slug: ScientificDomain;
  name: string;
  description: string;
  parentDomain?: ScientificDomain;
  color: string; // UI accent
  icon?: string;
  conceptCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// CONCEPT (central entity)
// ─────────────────────────────────────────────

export interface IConcept {
  _id?: Types.ObjectId;
  conceptId: string; // stable semantic id, e.g. "entropy"
  slug: string; // url-safe, unique
  title: string;
  summary: string; // 1-2 sentence TL;DR
  scientificDefinition: string; // rigorous definition
  history: string; // historical development
  discoverer?: string[]; // scientist ids
  field: ScientificDomain;
  difficulty: Difficulty;
  importance: number; // 0-100
  learningLevel: LearningLevel;

  applications: string[]; // free-text application descriptions
  examples: IScientificExample[];
  analogies: IAnalogy[];

  equations: string[]; // Equation ids
  constants: string[]; // physical constant ids / names
  units: string[]; // SI units relevant
  laws: string[]; // related law ids / names

  relatedConcepts: string[]; // conceptIds
  parentConcepts: string[]; // conceptIds (broader)
  childConcepts: string[]; // conceptIds (narrower)
  prerequisites: string[]; // conceptIds required first

  misconceptions: IMisconception[];

  experiments: string[]; // Experiment ids
  scientists: string[]; // Scientist ids
  papers: string[]; // Reference ids
  books: string[]; // Reference ids
  citations: string[]; // Citation ids

  media: IMediaReference[]; // images, videos, 3D models, simulations, quiz
  matrixNodeId?: string; // Knowledge Matrix node id
  learningPaths: string[]; // NeuralPath ids

  estimatedLearningMinutes: number;

  // Semantic search support (vector-ready)
  embedding?: number[]; // populated by vector pipeline
  embeddingModel?: string;
  searchableText?: string; // denormalized text for full-text index

  provenance?: IProvenance;
  version: IVersionInfo;

  views: number;
  rating: number; // 0-5 average
  ratingCount: number;

  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// RELATIONSHIP
// ─────────────────────────────────────────────

export interface IRelationship {
  _id?: Types.ObjectId;
  sourceId: string; // conceptId
  targetId: string; // conceptId
  type: RelationshipType;
  weight: number; // 0-1 strength
  description?: string;
  bidirectional: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// TAXONOMY
// ─────────────────────────────────────────────

export interface ITaxonomyNode {
  _id?: Types.ObjectId;
  nodeId: string; // stable id
  label: string;
  domain: ScientificDomain;
  parentId?: string | null; // taxonomy node id
  conceptId?: string; // leaf nodes map to a Concept
  level: number; // depth from root
  path: string[]; // ancestor nodeIds including self
  order: number; // sibling ordering
  description?: string;
  isLeaf: boolean;
  childCount: number;
  children?: ITaxonomyNode[];
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// ENCYCLOPEDIA ARTICLE
// ─────────────────────────────────────────────

export interface IArticleSection {
  heading: string;
  content: string; // markdown / rich text
  order: number;
}

export interface IEncyclopediaArticle {
  _id?: Types.ObjectId;
  articleId: string;
  slug: string;
  title: string;
  conceptId?: string; // linked Concept
  domain: ScientificDomain;
  summary: string;
  overview: string;
  sections: IArticleSection[];
  history: string;
  proofs: string[]; // markdown proofs
  equations: string[]; // Equation ids
  animations: IMediaReference[];
  simulations: IMediaReference[];
  visualizations3D: IMediaReference[];
  realWorldApplications: string[];
  research: string[]; // Reference ids
  references: string[]; // Reference ids
  citations: string[]; // Citation ids
  relatedArticleIds: string[];
  authors: string[]; // editor userIds
  isFeatured: boolean;
  readingMinutes: number;
  views: number;
  isPublished: boolean;
  version: IVersionInfo;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// EQUATION
// ─────────────────────────────────────────────

export interface IEquationVariable {
  symbol: string; // e.g. "E"
  name: string; // e.g. "Energy"
  unit?: string;
  description?: string;
  typicalRange?: string;
}

export interface IEquation {
  _id?: Types.ObjectId;
  equationId: string;
  label: string;
  latex: string; // canonical LaTeX
  mathml?: string;
  plainText: string; // human-readable
  domain: ScientificDomain;
  conceptIds: string[]; // linked concepts
  variables: IEquationVariable[];
  constants: Array<{ symbol: string; value: string; unit?: string }>;
  unitAnalysis?: string; // dimensional analysis narrative
  derivation?: string; // markdown derivation
  examples: IScientificExample[];
  interactiveSolver?: {
    enabled: boolean;
    inputs: string[]; // variable symbols the user can vary
    outputSymbol: string;
    formula: string; // evaluable expression
  };
  graphSupport: boolean;
  simulationLinks: string[]; // Simulation ids
  citations: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// EXPERIMENT
// ─────────────────────────────────────────────

export interface IExperimentVariable {
  name: string;
  type: 'independent' | 'dependent' | 'controlled';
  unit?: string;
  description?: string;
}

export interface IExperiment {
  _id?: Types.ObjectId;
  experimentId: string;
  slug: string;
  title: string;
  domain: ScientificDomain;
  conceptIds: string[];
  purpose: string;
  equipment: string[];
  procedure: string[]; // ordered steps
  variables: IExperimentVariable[];
  theory: string;
  expectedOutcome: string;
  interactiveSimulation?: IMediaReference;
  historicalSignificance?: string;
  scientistIds: string[];
  citations: string[];
  difficulty: Difficulty;
  estimatedMinutes: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// SCIENTIST
// ─────────────────────────────────────────────

export interface IScientistTimelineEvent {
  year: number;
  description: string;
}

export interface IScientist {
  _id?: Types.ObjectId;
  scientistId: string;
  slug: string;
  name: string;
  fullName: string;
  birthYear?: number;
  deathYear?: number;
  nationality?: string[];
  biography: string;
  timeline: IScientistTimelineEvent[];
  fields: ScientificDomain[];
  majorDiscoveries: string[]; // free text
  awards: string[];
  relatedConceptIds: string[];
  relatedExperimentIds: string[];
  relatedEquationIds: string[];
  influencedBy: string[]; // scientistIds
  influenced: string[]; // scientistIds
  citations: string[];
  portraitUrl?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// TIMELINE EVENT
// ─────────────────────────────────────────────

export interface ITimelineEvent {
  _id?: Types.ObjectId;
  eventId: string;
  title: string;
  year: number; // negative for BCE
  era: TimelineEra;
  domain: ScientificDomain;
  description: string;
  conceptIds: string[];
  scientistIds: string[];
  experimentIds: string[];
  equationIds: string[];
  relatedEventIds: string[];
  significance: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// GLOSSARY
// ─────────────────────────────────────────────

export interface IGlossaryTerm {
  _id?: Types.ObjectId;
  termId: string;
  term: string;
  slug: string;
  definition: string;
  pronunciation?: string; // IPA
  synonyms: string[];
  relatedConceptIds: string[];
  domain: ScientificDomain;
  difficulty: Difficulty;
  examples: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// CITATION
// ─────────────────────────────────────────────

export interface ICitation {
  _id?: Types.ObjectId;
  citationId: string;
  type: 'article' | 'book' | 'journal' | 'web' | 'conference' | 'thesis' | 'patent' | 'dataset';
  title: string;
  authors: string[];
  year?: number;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  url?: string;
  accessedAt?: Date;
  bibtex?: string; // raw bibtex
  apa?: string; // rendered APA
  mla?: string;
  chicago?: string;
  relatedConceptIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// REFERENCE (external source link)
// ─────────────────────────────────────────────

export interface IReference {
  _id?: Types.ObjectId;
  referenceId: string;
  title: string;
  url: string;
  provider: SourceProvider;
  domain: ScientificDomain;
  description?: string;
  authors: string[];
  publishedYear?: number;
  doi?: string;
  pmid?: string;
  arxivId?: string;
  concepts: string[]; // conceptIds this reference supports
  tags: string[];
  trustScore: number; // 0-1
  isPeerReviewed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// SEARCH DTOs
// ─────────────────────────────────────────────

export interface ISearchQuery {
  q: string;
  domain?: ScientificDomain;
  difficulty?: Difficulty;
  types?: Array<'concept' | 'article' | 'equation' | 'scientist' | 'experiment' | 'glossary'>;
  limit?: number;
  offset?: number;
  includeRelationships?: boolean;
}

export interface ISearchResultItem {
  id: string;
  kind: 'concept' | 'article' | 'equation' | 'scientist' | 'experiment' | 'glossary';
  title: string;
  snippet: string;
  domain: ScientificDomain;
  difficulty?: Difficulty;
  score: number; // relevance score
  conceptId?: string;
}

export interface ISearchResponse {
  query: string;
  correctedQuery?: string; // did-you-mean
  suggestions: string[]; // autocomplete
  total: number;
  took: number; // ms
  results: ISearchResultItem[];
}

export interface IConceptRanking {
  conceptId: string;
  title: string;
  score: number;
  reasons: string[];
}

// ─────────────────────────────────────────────
// IMPORT PIPELINE DTOs
// ─────────────────────────────────────────────

export interface IImportResult {
  provider: SourceProvider;
  fetched: number;
  normalized: number;
  deduplicated: number;
  validated: number;
  created: number;
  updated: number;
  failed: number;
  errors: Array<{ externalId: string; reason: string }>;
  startedAt: Date;
  finishedAt: Date;
}

// ─────────────────────────────────────────────
// API LIST DTOs
// ─────────────────────────────────────────────

export interface IConceptTreeNode {
  conceptId: string;
  title: string;
  difficulty: Difficulty;
  children: IConceptTreeNode[];
}
