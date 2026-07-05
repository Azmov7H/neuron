/**
 * Discovery Service
 * Core business operations for user concept discoveries.
 */

import { DiscoveryRepository } from './discoveries.repository';
import { logger } from '@/lib/logger';

export class DiscoveryService {
  /**
   * Registers newly discussed concepts as unique discoveries for the student.
   */
  static async registerDiscoveriesFromChat(
    userId: string,
    conceptsList: Array<{ title: string; domain?: string }>,
    sessionId: string,
    domain: string
  ): Promise<void> {
    for (const concept of conceptsList) {
      try {
        const conceptId = concept.title.toLowerCase().replace(/\s+/g, '-');
        const existingDiscovery = await DiscoveryRepository.findByConceptId(userId, conceptId);

        if (!existingDiscovery) {
          await DiscoveryRepository.create({
            userId,
            conceptId,
            concept: concept.title,
            domain: concept.domain || domain,
            importance: 50,
            context: {
              fromSparkSession: sessionId,
            },
            userInterest: 75,
          });

          await DiscoveryRepository.addToUserProfile(userId, concept.title);
        }
      } catch (err) {
        logger.error('[DiscoveryService] Error registering concept discovery:', err);
      }
    }
  }

  /**
   * Retrieve all concept discoveries made by the user.
   */
  static async getUserDiscoveries(userId: string) {
    return await DiscoveryRepository.findUserDiscoveries(userId);
  }
}
