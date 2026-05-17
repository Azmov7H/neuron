/**
 * Spark Strict Response Formatter
 * Standardizes educational explanation structures and enforces a unified,
 * machine-readable JSON metadata block at the very end of all streams.
 * Parses bullet-point follow-ups and concepts dynamically from Markdown.
 */

export interface SparkMetadata {
  domain: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topics: string[];
  relatedSimulations: string[];
  sparkMode: 'scientific' | 'educational' | 'cinematic';
}

export class SparkResponseFormatter {
  private static METADATA_START = '[METADATA]';

  /**
   * Encapsulate custom explanation content with the standardized metadata block.
   */
  static formatResponse(
    explanationMarkdown: string,
    metadata: SparkMetadata
  ): string {
    const jsonString = JSON.stringify(metadata, null, 2);
    // Ensure the raw content ends with the strict [METADATA] block separated by a divider
    return `${explanationMarkdown.trim()}\n\n---\n\n${this.METADATA_START}\n${jsonString}`;
  }

  /**
   * Safely parses the metadata chunk from a full raw response.
   * Strips the raw tag blocks to yield clean content and parsed parameters.
   * Dynamically extracts follow-ups and concepts from markdown if JSON parsing is partial.
   */
  static parseResponse(rawContent: string): {
    cleanContent: string;
    metadata: SparkMetadata;
    conceptsList: Array<{ title: string; domain: string }>;
    followUpsList: string[];
  } {
    let cleanContent = rawContent;
    
    // Default fallback metadata structure
    let parsedMetadata: SparkMetadata = {
      domain: 'science',
      difficulty: 'intermediate',
      topics: [],
      relatedSimulations: [],
      sparkMode: 'educational'
    };

    const metadataIdx = rawContent.indexOf(this.METADATA_START);
    if (metadataIdx !== -1) {
      const jsonText = rawContent.substring(metadataIdx + this.METADATA_START.length).trim();
      cleanContent = rawContent.substring(0, metadataIdx).trim();
      
      // Clean trailing separator from content
      if (cleanContent.endsWith('---')) {
        cleanContent = cleanContent.substring(0, cleanContent.length - 3).trim();
      }

      try {
        const parsed = JSON.parse(jsonText);
        parsedMetadata = {
          domain: parsed.domain || 'science',
          difficulty: parsed.difficulty || 'intermediate',
          topics: parsed.topics || [],
          relatedSimulations: parsed.relatedSimulations || [],
          sparkMode: parsed.sparkMode || 'educational'
        };
      } catch (err) {
        console.error('[Spark Response Formatter] Failed to parse JSON metadata block:', err, jsonText);
      }
    }

    // Dynamic parsing of FOLLOW UPS from the markdown layer
    const followUpsList: string[] = [];
    const followUpsSectionIdx = cleanContent.indexOf('[FOLLOW UPS]');
    if (followUpsSectionIdx !== -1) {
      const followUpsText = cleanContent.substring(followUpsSectionIdx + '[FOLLOW UPS]'.length).split('\n---')[0].trim();
      const lines = followUpsText.split('\n');
      for (const line of lines) {
        const cleanLine = line.trim();
        // Match bullet points starting with -, *, or numbering (e.g. 1.)
        if (/^[-*•]\s+/.test(cleanLine) || /^\d+\.\s+/.test(cleanLine)) {
          const question = cleanLine.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
          if (question) {
            followUpsList.push(question);
          }
        }
      }
    }

    // Dynamic parsing of CONCEPTS from the markdown layer
    const conceptsList: Array<{ title: string; domain: string }> = [];
    const conceptsSectionIdx = cleanContent.indexOf('[CONCEPTS]');
    if (conceptsSectionIdx !== -1) {
      const conceptsText = cleanContent.substring(conceptsSectionIdx + '[CONCEPTS]'.length).split('\n---')[0].trim();
      const lines = conceptsText.split('\n');
      for (const line of lines) {
        const cleanLine = line.trim();
        if (/^[-*•]\s+/.test(cleanLine) || /^\d+\.\s+/.test(cleanLine)) {
          const conceptTitle = cleanLine.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim();
          if (conceptTitle) {
            conceptsList.push({
              title: conceptTitle,
              domain: parsedMetadata.domain
            });
          }
        }
      }
    }

    // Back-fill topics if they were empty in JSON but populated in CONCEPTS section
    if (parsedMetadata.topics.length === 0 && conceptsList.length > 0) {
      parsedMetadata.topics = conceptsList.map(c => c.title);
    }

    // Ensure we always have conceptsList populated
    if (conceptsList.length === 0 && parsedMetadata.topics.length > 0) {
      parsedMetadata.topics.forEach(t => {
        conceptsList.push({ title: t, domain: parsedMetadata.domain });
      });
    }

    return {
      cleanContent,
      metadata: parsedMetadata,
      conceptsList,
      followUpsList: followUpsList.length > 0 ? followUpsList : [
        'Can you explain this with a different analogy?',
        'How does this connect to real-world technology?',
        'What should I study next in this domain?'
      ]
    };
  }
}
