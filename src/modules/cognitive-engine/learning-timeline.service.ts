import { LearningTimeline } from '@/database/models/learning-timeline';
import { AddTimelineNodeInput } from '@/validations/schemas';

export class LearningTimelineService {
  /**
   * Get or create learning timeline for user
   */
  static async getOrCreateTimeline(userId: string) {
    let timeline = await LearningTimeline.findOne({ userId });

    if (!timeline) {
      timeline = await LearningTimeline.create({
        userId,
        domains: {},
        overallProgress: 0,
        totalConcepts: 0,
        masteredConcepts: 0,
        currentFocus: '',
      });
    }

    return timeline;
  }

  /**
   * Add concept node to timeline
   */
  static async addConceptNode(userId: string, input: AddTimelineNodeInput) {
    const timeline = await this.getOrCreateTimeline(userId);

    const node = {
      conceptId: input.conceptId,
      concept: input.concept,
      domain: input.domain,
      level: input.level || 1,
      position: input.position || { x: 0, y: 0 },
      discoveredAt: new Date(),
      masteredAt: undefined,
      dependencies: input.dependencies || [],
    };

    const domainData = timeline.domains.get(input.domain) || {
      conceptNodes: [],
      progressionPath: [],
      milestones: [],
    };

    domainData.conceptNodes.push(node);
    if (!domainData.progressionPath.includes(input.conceptId)) {
      domainData.progressionPath.push(input.conceptId);
    }

    timeline.domains.set(input.domain, domainData);
    timeline.totalConcepts = (timeline.totalConcepts || 0) + 1;

    await timeline.save();
    return timeline;
  }

  /**
   * Mark concept as mastered
   */
  static async markMastered(userId: string, conceptId: string) {
    const timeline = await this.getOrCreateTimeline(userId);

    let updated = false;
    const domains = timeline.domains;

    for (const [domainName, domainData] of domains.entries()) {
      const node = domainData.conceptNodes.find((n: { conceptId: string }) => n.conceptId === conceptId);
      if (node && !node.masteredAt) {
        node.masteredAt = new Date();
        domainData.milestones.push({
          conceptId,
          achievedAt: new Date(),
          evidence: [],
        });
        timeline.masteredConcepts = (timeline.masteredConcepts || 0) + 1;
        updated = true;
      }
    }

    if (updated) {
      const totalConcepts = timeline.totalConcepts || 1;
      timeline.overallProgress = Math.round((timeline.masteredConcepts / totalConcepts) * 100);
      await timeline.save();
    }

    return timeline;
  }

  /**
   * Get domain progression
   */
  static async getDomainProgression(userId: string, domain: string) {
    const timeline = await this.getOrCreateTimeline(userId);
    const domainData = timeline.domains.get(domain);

    if (!domainData) {
      return {
        conceptNodes: [],
        progressionPath: [],
        milestones: [],
        progress: 0,
      };
    }

    const total = domainData.conceptNodes.length;
    const mastered = domainData.conceptNodes.filter((n: { masteredAt?: Date }) => n.masteredAt).length;
    const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;

    return {
      ...domainData,
      progress,
    };
  }

  /**
   * Get overall timeline summary
   */
  static async getSummary(userId: string) {
    const timeline = await this.getOrCreateTimeline(userId);

    return {
      overallProgress: timeline.overallProgress,
      totalConcepts: timeline.totalConcepts,
      masteredConcepts: timeline.masteredConcepts,
      currentFocus: timeline.currentFocus,
      domains: Array.from(timeline.domains.keys()),
    };
  }
}