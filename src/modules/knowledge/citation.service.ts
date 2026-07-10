/**
 * Citation Service
 * Structured bibliographic records with APA / MLA / BibTeX / Chicago
 * formatting. Acts as the canonical source for reference strings.
 */

import { Citation } from '@/database/models/knowledge/citation.model';
import { AppError } from '@/types';
import { ICitation, CitationStyle } from '@/types';
import type { CreateCitationInput } from '@/validations/knowledge';

export class CitationService {
  static async create(input: CreateCitationInput): Promise<ICitation> {
    const existing = await Citation.findOne({ citationId: input.citationId });
    if (existing) throw new AppError(409, 'Citation already exists', 'CITATION_EXISTS');

    const doc = await Citation.create(input);
    return doc.toJSON() as ICitation;
  }

  static async getByCitationId(citationId: string): Promise<ICitation> {
    const doc = await Citation.findOne({ citationId });
    if (!doc) throw new AppError(404, 'Citation not found', 'CITATION_NOT_FOUND');
    return doc.toJSON() as ICitation;
  }

  static async update(citationId: string, patch: Partial<CreateCitationInput>): Promise<ICitation> {
    if (patch.citationId) throw new AppError(400, 'citationId is immutable', 'IMMUTABLE_FIELD');
    const doc = await Citation.findOneAndUpdate({ citationId }, { $set: patch }, { new: true });
    if (!doc) throw new AppError(404, 'Citation not found', 'CITATION_NOT_FOUND');
    return doc.toJSON() as ICitation;
  }

  static async remove(citationId: string): Promise<void> {
    const res = await Citation.findOneAndDelete({ citationId });
    if (!res) throw new AppError(404, 'Citation not found', 'CITATION_NOT_FOUND');
  }

  static async list(relatedConceptId?: string): Promise<ICitation[]> {
    const query = relatedConceptId ? { relatedConceptIds: relatedConceptId } : {};
    const docs = await Citation.find(query).sort({ year: -1 }).lean();
    return docs.map((d) => d as ICitation);
  }

  /** Return a citation formatted in the requested style. */
  static async format(citationId: string, style: CitationStyle): Promise<{ citationId: string; style: CitationStyle; formatted: string }> {
    const citation = await this.getByCitationId(citationId);
    const formatted = citation[style] || citation.bibtex || citation.apa || '';
    if (!formatted && style === 'apa') {
      return { citationId, style, formatted: this.toApa(citation) };
    }
    return { citationId, style, formatted };
  }

  private static toApa(c: ICitation): string {
    const authors = c.authors.join(', ');
    const year = c.year ? `(${c.year}).` : '';
    const journal = c.journal ? ` ${c.journal},` : '';
    const vol = c.volume ? ` ${c.volume}` : '';
    const pages = c.pages ? `, ${c.pages}` : '';
    const doi = c.doi ? ` https://doi.org/${c.doi}` : '';
    return `${authors} ${year} ${c.title}.${journal}${vol}${pages}.${doi}`;
  }
}
