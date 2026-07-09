import { UserMemory } from '@/database/models/user-memory';
import { Discovery } from '@/database/models/discovery';
import { UpdateUserMemoryInput, RecordInteractionInput } from '@/validations/schemas';

export class UserMemoryService {
  /**
   * Get or create user memory
   */
  static async getOrCreateMemory(userId: string) {
    let memory = await UserMemory.findOne({ userId });

    if (!memory) {
      memory = await UserMemory.create({
        userId,
        recentConcepts: [],
        longTermInterests: [],
        masteredConcepts: [],
        conceptRelationships: {},
        currentLearningGoal: '',
        currentChapterId: '',
        activeSimulations: [],
        interactionHistory: [],
        commonMistakes: [],
        preferredExplanationStyle: 'text',
        knowledgeGaps: [],
        futureRecommendations: [],
      });
    }

    return memory;
  }

  /**
   * Update user memory
   */
  static async updateMemory(userId: string, input: UpdateUserMemoryInput) {
    const memory = await this.getOrCreateMemory(userId);

    const updates: Record<string, unknown> = { lastUpdated: new Date() };

    if (input.currentLearningGoal !== undefined) updates['currentLearningGoal'] = input.currentLearningGoal;
    if (input.currentPathId !== undefined) updates['currentPathId'] = input.currentPathId;
    if (input.currentChapterId !== undefined) updates['currentChapterId'] = input.currentChapterId;
    if (input.preferredExplanationStyle !== undefined) updates['preferredExplanationStyle'] = input.preferredExplanationStyle;
    if (input.knowledgeGaps !== undefined) updates['knowledgeGaps'] = input.knowledgeGaps;

    const updated = await UserMemory.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true, upsert: true }
    );

    return updated;
  }

  /**
   * Record user interaction
   */
  static async recordInteraction(userId: string, input: RecordInteractionInput) {
    const memory = await this.getOrCreateMemory(userId);

    const interaction = {
      type: input.type,
      targetId: input.targetId,
      timestamp: new Date(),
      duration: input.duration || 0,
      outcome: input.outcome || 'completed',
      metadata: input.metadata || {},
    };

    const updated = await UserMemory.findOneAndUpdate(
      { userId },
      {
        $push: { interactionHistory: interaction },
        $inc: { 'version': 1 },
        $set: { lastUpdated: new Date() },
      },
      { new: true }
    );

    return updated;
  }

  /**
   * Get recent concepts from discoveries
   */
  static async syncRecentConcepts(userId: string) {
    const recentDiscoveries = await Discovery.find({ userId })
      .sort({ discoveredAt: -1 })
      .limit(20)
      .select('concept domain importance discoveredAt');

    const concepts = recentDiscoveries.map((d) => ({
      concept: d.concept,
      domain: d.domain,
      importance: d.importance,
      firstDiscovered: d.discoveredAt,
      lastRevisited: d.discoveredAt,
      revisitCount: 1,
      relatedConcepts: d.relatedConcepts || [],
    }));

    const updated = await UserMemory.findOneAndUpdate(
      { userId },
      {
        $set: { recentConcepts: concepts, lastUpdated: new Date() },
      },
      { new: true, upsert: true }
    );

    return updated;
  }

  /**
   * Add common mistake
   */
  static async addMistake(userId: string, concept: string, mistake: string) {
    const existing = await UserMemory.findOne({
      userId,
      'commonMistakes.concept': concept,
      'commonMistakes.mistake': mistake,
    });

    let updated;
    if (existing) {
      updated = await UserMemory.findOneAndUpdate(
        {
          userId,
          'commonMistakes.concept': concept,
          'commonMistakes.mistake': mistake,
        },
        {
          $inc: { 'commonMistakes.$.frequency': 1 },
          $set: { 'commonMistakes.$.correctedAt': new Date() },
        },
        { new: true }
      );
    } else {
      updated = await UserMemory.findOneAndUpdate(
        { userId },
        {
          $push: {
            commonMistakes: {
              concept,
              mistake,
              correctedAt: new Date(),
              frequency: 1,
            },
          },
          $set: { lastUpdated: new Date() },
        },
        { new: true, upsert: true }
      );
    }

    return updated;
  }

  /**
   * Get user's long-term interests
   */
  static async getLongTermInterests(userId: string, limit = 10) {
    const memory = await this.getOrCreateMemory(userId);
    return memory.longTermInterests.slice(0, limit);
  }
}