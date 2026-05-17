import { NeuralPathsService } from '@/modules/neural-paths/neural-paths.service';
import { EvolutionService } from '@/modules/evolution/evolution.service';
import { SparkAIService } from '@/modules/spark-ai/spark-ai.service';
import { NeuralPath } from '@/database/models/neural-path';
import { Discovery } from '@/database/models/discovery';
import { AppError } from '@/types';

export enum ActionType {
  COMPLETE_CHAPTER = 'COMPLETE_CHAPTER',
  START_PATH = 'START_PATH',
  EXPLORE_CONCEPT = 'EXPLORE_CONCEPT',
  USE_SPARK = 'USE_SPARK'
}

export interface ActionPayload {
  type: ActionType;
  metadata: any;
}

export class ActionHandler {
  static async handleUserAction(userId: string, action: ActionPayload) {
    const { type, metadata } = action;

    switch (type) {
      case ActionType.COMPLETE_CHAPTER: {
        const { pathId, chapterId } = metadata;
        if (!pathId || !chapterId) {
          throw new AppError(400, 'pathId and chapterId are required');
        }

        // 1. Complete chapter
        const result = await NeuralPathsService.completeChapter(userId, pathId, chapterId);

        // 2. Fetch path details for domain & concepts
        const pathDetails: any = await NeuralPath.findById(pathId).lean().catch(() => null);
        const domain = pathDetails?.domain || 'general';
        
        // Find chapter concepts
        const chapter = pathDetails?.chapters?.find((c: any) => c.id === chapterId);
        const concepts = chapter?.concepts || [];

        // 3. Store concepts in Spark memory
        for (const concept of concepts) {
          await SparkAIService.storeInteraction(userId, domain, concept);
        }

        return {
          success: true,
          type,
          result,
          conceptsAdded: concepts
        };
      }

      case ActionType.START_PATH: {
        const { pathId, domain } = metadata;
        if (!pathId) {
          throw new AppError(400, 'pathId is required');
        }

        // 1. Start path
        const progress = await NeuralPathsService.startPath(userId, pathId);

        // 2. Add start path XP (+50 XP)
        const evolutionResult = await EvolutionService.addXP(
          userId,
          50,
          domain || 'general',
          'Started a new Neural Path',
          { pathId }
        );

        // 3. Store in Spark context
        await SparkAIService.storeInteraction(userId, domain || 'general', `Started path: ${pathId}`);

        return {
          success: true,
          type,
          progress,
          evolutionResult
        };
      }

      case ActionType.EXPLORE_CONCEPT: {
        const { concept, domain, pathId, chapterId } = metadata;
        if (!concept || !domain) {
          throw new AppError(400, 'concept and domain are required');
        }

        // 1. Register discovery
        const discovery = await Discovery.create({
          userId,
          conceptId: concept.toLowerCase(),
          concept,
          domain,
          context: {
            sourcePathId: pathId,
            sourceChapterId: chapterId,
          },
          userInterest: 60
        });

        // 2. Add explore XP (+25 XP)
        const evolutionResult = await EvolutionService.addXP(
          userId,
          25,
          domain,
          `Discovered concept: ${concept}`,
          { concept }
        );

        // 3. Store in Spark Context
        await SparkAIService.storeInteraction(userId, domain, concept);

        return {
          success: true,
          type,
          discovery,
          evolutionResult
        };
      }

      case ActionType.USE_SPARK: {
        const { sessionId, content, messageMetadata } = metadata;
        if (!sessionId || !content) {
          throw new AppError(400, 'sessionId and content are required');
        }

        // 1. Call Spark message handler
        const session = await SparkAIService.sendMessage(sessionId, userId, content, messageMetadata);

        // 2. Add XP for Spark interaction (+10 XP)
        const evolutionResult = await EvolutionService.addXP(
          userId,
          10,
          session.domain,
          'Engaged with Spark AI',
          { sessionId }
        );

        return {
          success: true,
          type,
          session,
          evolutionResult
        };
      }

      default:
        throw new AppError(400, 'Unsupported action type');
    }
  }
}
