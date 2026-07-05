/**
 * Response Parser Service
 * Parses raw completion text into structured layout components and metadata objects.
 */

import { SparkResponseFormatter, SparkMetadata } from './spark.responseFormatter';

export interface ParsedResponse {
  cleanContent: string;
  metadata: SparkMetadata;
  conceptsList: Array<{ title: string; domain: string }>;
  followUpsList: string[];
}

export class ResponseParser {
  /**
   * Parse raw completion text.
   */
  static parse(rawContent: string): ParsedResponse {
    return SparkResponseFormatter.parseResponse(rawContent);
  }
}
