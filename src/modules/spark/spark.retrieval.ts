/**
 * Spark Retrieval Engine
 * High-efficiency text search over seeded Knowledge model in MongoDB
 */

import { Knowledge, IKnowledgeDocument } from '@/database/models/knowledge';
import { logger } from '@/lib/logger';

// Basic list of English stopwords to clean user messages before searching
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'cant', 'cannot', 'could', 'couldnt',
  'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during',
  'each',
  'few', 'for', 'from', 'further',
  'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here', 'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows',
  'i', 'id', 'ill', 'im', 'ive', 'if', 'in', 'into', 'is', 'isnt', 'it', 'its', 'itself',
  'lets',
  'me', 'more', 'most', 'mustnt', 'my', 'myself',
  'no', 'nor', 'not',
  'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such',
  'than', 'that', 'thats', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll', 'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too',
  'under', 'until', 'up', 'very',
  'was', 'wasnt', 'we', 'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while', 'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt',
  'you', 'youd', 'youll', 'youre', 'youve', 'your', 'yours', 'yourselves', 'yourself'
]);

export class SparkRetrieval {
  /**
   * Parse user query to extract relevant keywords
   */
  static extractKeywords(text: string): string[] {
    if (!text) return [];
    
    // Lowercase and remove punctuation
    const cleanText = text
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const words = cleanText.split(' ');
    
    // Filter out stopwords, numbers, and short tokens
    const keywords = words.filter(word => {
      return (
        word.length > 2 &&
        !STOPWORDS.has(word) &&
        isNaN(Number(word))
      );
    });

    // Deduplicate
    return Array.from(new Set(keywords));
  }

  /**
   * Search Knowledge Base for relevant entries based on user prompt
   */
  static async retrieveRelevantKnowledge(
    userMessage: string,
    domain?: string,
    limit: number = 3
  ): Promise<IKnowledgeDocument[]> {
    const keywords = this.extractKeywords(userMessage);
    
    if (keywords.length === 0) {
      // Fallback: If no keywords could be extracted, return trending/top domain chunks
      const query: any = {};
      if (domain) query.domain = domain.toLowerCase();
      
      return await Knowledge.find(query)
        .limit(limit)
        .lean() as unknown as IKnowledgeDocument[];
    }

    // Build compound query matches
    // 1. Text Search (if indices are established)
    // 2. OR regex matching on fields for highest recall
    const regexQueries = keywords.map(kw => ({
      $or: [
        { title: { $regex: kw, $options: 'i' } },
        { tags: { $regex: kw, $options: 'i' } },
        { relatedConcepts: { $regex: kw, $options: 'i' } },
        { explanation: { $regex: kw, $options: 'i' } }
      ]
    }));

    const query: any = { $or: regexQueries };
    
    // Filter by active domain if provided to guarantee contextual alignment
    if (domain) {
      query.domain = domain.toLowerCase();
    }

    try {
      let results = await Knowledge.find(query)
        .limit(limit)
        .lean() as unknown as IKnowledgeDocument[];

      // If search returns fewer than requested items and domain is specified,
      // fall back to getting general knowledge within the domain (broaden search)
      if (results.length < limit && domain) {
        const additionalQuery = {
          domain: domain.toLowerCase(),
          _id: { $not: { $in: results.map(r => r._id) } }
        };
        const fallbacks = await Knowledge.find(additionalQuery)
          .limit(limit - results.length)
          .lean() as unknown as IKnowledgeDocument[];
        results = [...results, ...fallbacks];
      }

      return results;
    } catch (error) {
      logger.error('[Spark Retrieval] Error retrieving knowledge chunks:', error);
      return [];
    }
  }
}
