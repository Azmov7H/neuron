/**
 * Spark Context Engine
 * Aggregates all learner parameters, neural path curriculum progress,
 * and cognitive traits to inject into LLM prompts.
 */

import { User } from '@/database/models/user';
import { NeuralPath } from '@/database/models/neural-path';
import { UserProgress } from '@/database/models/user-progress';
import { Discovery } from '@/database/models/discovery';
import { Types } from 'mongoose';

export interface LearningContext {
  student: {
    username: string;
    totalXP: number;
    level: number;
    rank: string;
    streak: number;
    cognitiveProfile?: {
      learningStyle: string;
      strengths: string[];
      weaknesses: string[];
      focusAreas: string[];
    };
  };
  path?: {
    title: string;
    description: string;
    difficulty: string;
  };
  chapter?: {
    title: string;
    description: string;
    explanation: string;
    objectives: string[];
    concepts: string[];
    difficulty: string;
  };
  recentConcepts: string[];
}

export class SparkContext {
  /**
   * Aggregate complete learning context for a student within a session/domain
   */
  static async aggregateContext(
    userId: string,
    domain: string,
    contextData?: { currentPathId?: string; currentChapterId?: string }
  ): Promise<LearningContext> {
    const userObjectId = new Types.ObjectId(userId);

    // 1. Fetch user profile
    const user = await User.findById(userObjectId).lean();
    if (!user) {
      throw new Error('User not found during context aggregation');
    }

    // Determine domain level & mastery
    const domainProgression = user.domains?.find(d => d.domain.toLowerCase() === domain.toLowerCase());
    const domainLevel = domainProgression ? domainProgression.level : 0;

    // 2. Fetch path and chapter context if provided
    let pathDetails: LearningContext['path'] = undefined;
    let chapterDetails: LearningContext['chapter'] = undefined;

    const pathId = contextData?.currentPathId;
    const chapterId = contextData?.currentChapterId;

    if (pathId) {
      try {
        const path = await NeuralPath.findById(new Types.ObjectId(pathId)).lean();
        if (path) {
          pathDetails = {
            title: path.title,
            description: path.description,
            difficulty: path.difficulty,
          };

          // If a chapter is selected, extract it from the path chapters list
          if (chapterId) {
            const chapter = path.chapters?.find(ch => ch.id === chapterId);
            if (chapter) {
              chapterDetails = {
                title: chapter.title,
                description: chapter.description,
                explanation: chapter.explanation,
                objectives: chapter.objectives || [],
                concepts: chapter.concepts || [],
                difficulty: chapter.difficulty || path.difficulty,
              };
            }
          }
        }
      } catch (err) {
        console.error('[Spark Context] Error loading path/chapter details:', err);
      }
    }

    // 3. Get recent concepts discovered by user in this domain
    let recentConcepts: string[] = [];
    try {
      const discoveries = await Discovery.find({
        userId: userObjectId,
        domain: domain.toLowerCase()
      })
        .sort({ discoveredAt: -1 })
        .limit(10)
        .select('concept')
        .lean();

      recentConcepts = discoveries.map(d => d.concept);
    } catch (err) {
      console.error('[Spark Context] Error loading discovered concepts:', err);
    }

    // 4. Build aggregated context payload
    return {
      student: {
        username: user.username,
        totalXP: user.totalXP,
        level: domainLevel,
        rank: user.rank || 'Explorer',
        streak: user.streak || 0,
        cognitiveProfile: user.cognitiveProfile ? {
          learningStyle: user.cognitiveProfile.learningStyle || 'reading-writing',
          strengths: user.cognitiveProfile.strengths || [],
          weaknesses: user.cognitiveProfile.weaknesses || [],
          focusAreas: user.cognitiveProfile.focusAreas || [],
        } : undefined
      },
      path: pathDetails,
      chapter: chapterDetails,
      recentConcepts
    };
  }
}
