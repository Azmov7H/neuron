/**
 * Vector Store Abstraction
 * Decouples semantic search from any specific vector database.
 * The in-memory implementation is production-safe for small deployments
 * and serves as the reference for future pgvector / Weaviate / Pinecone
 * adapters. Swap the implementation returned by `getVectorStore()` when
 * a real backend is wired up — no service code changes required.
 */

export interface VectorRecord {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface VectorHit {
  id: string;
  score: number; // 0-1 cosine similarity
  metadata?: Record<string, unknown>;
}

export interface IVectorStore {
  readonly name: string;
  isReady(): boolean;
  upsert(records: VectorRecord[]): Promise<void>;
  query(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<VectorHit[]>;
  delete(ids: string[]): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Cosine similarity between two equal-length vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * In-memory vector store using brute-force cosine similarity.
 * Suitable for ≤ ~100k vectors; for larger corpora use a real backend.
 */
export class InMemoryVectorStore implements IVectorStore {
  readonly name = 'in-memory';
  private store = new Map<string, VectorRecord>();

  isReady(): boolean {
    return true;
  }

  async upsert(records: VectorRecord[]): Promise<void> {
    for (const r of records) {
      this.store.set(r.id, r);
    }
  }

  async query(vector: number[], topK: number, filter?: Record<string, unknown>): Promise<VectorHit[]> {
    const hits: VectorHit[] = [];

    for (const record of this.store.values()) {
      if (filter && !matchesFilter(record.metadata ?? {}, filter)) continue;
      hits.push({
        id: record.id,
        score: cosineSimilarity(vector, record.values),
        metadata: record.metadata,
      });
    }

    return hits.sort((x, y) => y.score - x.score).slice(0, topK);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) this.store.delete(id);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}

function matchesFilter(metadata: Record<string, unknown>, filter: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (metadata[key] !== value) return false;
  }
  return true;
}

// ── Singleton accessor ──────────────────────
// Replace the return value with a pgvector/Weaviate-backed
// implementation to enable large-scale semantic search.

let activeStore: IVectorStore | null = null;

export function getVectorStore(): IVectorStore {
  if (!activeStore) {
    activeStore = new InMemoryVectorStore();
  }
  return activeStore;
}
