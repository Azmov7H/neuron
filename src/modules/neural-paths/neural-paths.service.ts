/**
 * Neural Paths Service
 * Learning path management and curriculum design
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NeuralPath } from '@/database/models/neural-path';
import { UserProgress } from '@/database/models/user-progress';
import { User } from '@/database/models/user';
import { EvolutionService } from '@/modules/evolution/evolution.service';
import { AppError } from '@/types';
import mongoose from 'mongoose';

export class NeuralPathsService {
  /**
   * Ensure database has basic neural paths for demonstration
   */
  static async seedPathsIfEmpty() {
    const count = await NeuralPath.countDocuments();
    if (count > 0) return;

    const dummyPaths = [
      {
        slug: "quantum-entanglement",
        title: "Quantum Entanglement & Spacetime",
        description: "Explore the fabric of reality through quantum mechanics and spacetime.",
        domain: "physics",
        category: "Quantum Mechanics",
        difficulty: "intermediate",
        estimatedTime: 480, // 8 Hours
        xpReward: 3200,
        chapters: [
          {
            id: "ch-1",
            title: "The Observer Effect",
            description: "Understanding measurement in quantum mechanics.",
            objectives: ["Define superposition", "Explain wave function collapse"],
            duration: 60,
            resources: [],
            concepts: ["Superposition", "Wave Function"],
            difficulty: "intermediate",
            order: 1,
          },
          {
            id: "ch-2",
            title: "Spooky Action at a Distance",
            description: "Deep dive into Bell's theorem and entanglement.",
            objectives: ["Understand non-locality"],
            duration: 120,
            resources: [],
            concepts: ["Entanglement", "Bell's Theorem"],
            difficulty: "advanced",
            order: 2,
          }
        ],
        prerequisites: [],
        difficulty_multiplier: 1.5,
        isActive: true,
      },
      {
        slug: "architecture-of-intelligence",
        title: "The Architecture of Intelligence",
        description: "From biological neural networks to artificial transformers.",
        domain: "technology",
        category: "Artificial Intelligence",
        difficulty: "advanced",
        estimatedTime: 720, // 12 Hours
        xpReward: 4500,
        chapters: [
          {
            id: "ch-1",
            title: "Biological Foundations",
            description: "How the human brain processes information.",
            objectives: ["Understand synapses", "Define neuroplasticity"],
            duration: 90,
            resources: [],
            concepts: ["Synapses", "Neuroplasticity"],
            difficulty: "intermediate",
            order: 1,
          },
          {
            id: "ch-2",
            title: "Transformers and Attention",
            description: "The mechanism behind modern LLMs.",
            objectives: ["Explain self-attention"],
            duration: 150,
            resources: [],
            concepts: ["Self-Attention", "LLMs"],
            difficulty: "advanced",
            order: 2,
          }
        ],
        prerequisites: [],
        difficulty_multiplier: 2.0,
        isActive: true,
      }
    ];

    await NeuralPath.insertMany(dummyPaths);
  }

  /**
   * Get all paths with filters
   */
  static async getPaths(filters: {
    domain?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    page?: number;
    limit?: number;
    sort?: 'popular' | 'newest' | 'difficulty';
    userId?: string;
  }) {
    await this.seedPathsIfEmpty();
    const { domain, difficulty, page = 1, limit = 10, sort = 'popular', userId } = filters;

    const query: any = { isActive: true };
    if (domain) query.domain = domain;
    if (difficulty) query.difficulty = difficulty;

    // Build sort
    let sortQuery: any = {};
    switch (sort) {
      case 'popular':
        sortQuery = { visitsCount: -1 };
        break;
      case 'newest':
        sortQuery = { createdAt: -1 };
        break;
      case 'difficulty':
        sortQuery = { difficulty: 1 };
        break;
    }

    const skip = (page - 1) * limit;
    const [paths, total] = await Promise.all([
      NeuralPath.find(query).sort(sortQuery).skip(skip).limit(limit).lean(),
      NeuralPath.countDocuments(query),
    ]);

    let progressMap = new Map();
    if (userId) {
      const progresses = await UserProgress.find({ userId }).lean();
      progressMap = new Map(progresses.map((p: any) => [p.pathId.toString(), p.overallCompletion]));
    }

    const enrichedPaths = paths.map((p: any) => ({
      ...p,
      progress: progressMap.get(p._id.toString()) || 0
    }));

    return {
      items: enrichedPaths,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get path by slug and include progress
   */
  static async getPathBySlug(slug: string, userId?: string) {
    const path = await NeuralPath.findOne({ slug, isActive: true }).lean();

    if (!path) {
      throw new AppError(404, 'Path not found', 'PATH_NOT_FOUND');
    }

    let overallCompletion = 0;
    let currentChapterId = path.chapters[0]?.id;
    let chapterProgressMap = new Map();

    if (userId) {
      const progress = await UserProgress.findOne({ userId, pathId: path._id }).lean() as any;
      if (progress) {
        overallCompletion = progress.overallCompletion;
        currentChapterId = progress.currentChapterId;
        chapterProgressMap = progress.chapterProgress instanceof Map 
          ? progress.chapterProgress 
          : new Map(Object.entries(progress.chapterProgress || {}));
      }
    }

    const currentChIndex = path.chapters.findIndex((c: any) => c.id === currentChapterId);
    
    const enrichedChapters = path.chapters.map((ch: any) => {
      const chProgress = chapterProgressMap.get(ch.id) || 0;
      const isCompleted = chProgress >= 100;
      const isUnlocked = ch.order <= (path.chapters[currentChIndex]?.order || 1) || isCompleted;

      return {
        ...ch,
        progress: chProgress,
        isCompleted,
        isUnlocked,
        isCurrent: ch.id === currentChapterId
      };
    });

    return {
      ...path,
      overallCompletion,
      chapters: enrichedChapters
    };
  }

  /**
   * Start path learning
   */
  static async startPath(userId: string, pathId: string) {
    const path = await NeuralPath.findById(pathId);

    if (!path) {
      throw new AppError(404, 'Path not found', 'PATH_NOT_FOUND');
    }

    // Check if already started
    const existingProgress = await UserProgress.findOne({ userId, pathId });

    if (existingProgress) {
      return existingProgress;
    }

    // Get first chapter
    const firstChapter = path.chapters[0];

    // Create progress record
    const progress = new UserProgress({
      userId,
      pathId,
      currentChapterId: firstChapter.id,
      chapterProgress: new Map(),
      overallCompletion: 0,
    });

    await progress.save();

    // Increment visit count
    path.visitsCount += 1;
    await path.save();

    return progress;
  }

  /**
   * Update chapter progress
   */
  static async updateChapterProgress(
    userId: string,
    pathId: string,
    chapterId: string,
    completion: number
  ) {
    if (completion < 0 || completion > 100) {
      throw new AppError(400, 'Completion must be between 0 and 100', 'INVALID_VALUE');
    }

    const progress = await UserProgress.findOne({ userId, pathId });

    if (!progress) {
      throw new AppError(404, 'Progress not found', 'PROGRESS_NOT_FOUND');
    }

    // Update chapter progress
    progress.chapterProgress.set(chapterId, completion);

    // Calculate overall completion
    const chapterValues = Array.from(progress.chapterProgress.values());
    progress.overallCompletion = Math.round(
      chapterValues.reduce((a: number, b: number) => a + b, 0) / chapterValues.length
    );

    // Mark as completed if 100%
    if (progress.overallCompletion === 100) {
      progress.completedAt = new Date();
    }

    await progress.save();

    return progress;
  }

  /**
   * Complete a chapter, update progress, and reward XP
   */
  static async completeChapter(userId: string, pathId: string, chapterId: string) {
    const path = await NeuralPath.findById(pathId);
    if (!path) throw new AppError(404, 'Path not found');

    const chapterIndex = path.chapters.findIndex((c: any) => c.id === chapterId);
    if (chapterIndex === -1) throw new AppError(404, 'Chapter not found');

    let progress: any = await UserProgress.findOne({ userId, pathId: path._id });

    const chapter = path.chapters[chapterIndex];
    const totalDuration = path.chapters.reduce((sum: number, ch: any) => sum + ch.duration, 0);
    const chapterXPReward = Math.floor((chapter.duration / totalDuration) * path.xpReward);

    if (!progress) {
      progress = new UserProgress({
        userId,
        pathId: path._id,
        currentChapterId: chapterId,
        chapterProgress: new Map(),
        overallCompletion: 0,
        xpEarned: 0,
        timeSpent: 0
      });
    }

    const chapterProgressMap = progress.chapterProgress instanceof Map 
      ? progress.chapterProgress 
      : new Map(Object.entries(progress.chapterProgress || {}));

    if (chapterProgressMap.get(chapterId) === 100) {
      return { message: 'Chapter already completed', progress };
    }

    chapterProgressMap.set(chapterId, 100);
    progress.chapterProgress = chapterProgressMap;
    progress.xpEarned += chapterXPReward;

    let completedChapters = 0;
    path.chapters.forEach((ch: any) => {
      if (chapterProgressMap.get(ch.id) === 100) completedChapters++;
    });
    progress.overallCompletion = Math.floor((completedChapters / path.chapters.length) * 100);

    if (chapterIndex + 1 < path.chapters.length) {
      progress.currentChapterId = path.chapters[chapterIndex + 1].id;
    }

    if (progress.overallCompletion === 100) {
      progress.completedAt = new Date();
    }

    // Use a transaction to ensure progress save and XP addition are atomic
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await progress.save({ session });

      const user: any = await User.findById(userId).session(session);
      let newRank = user?.rank;
      if (user) {
        const evolutionResult = await EvolutionService.addXP(
          userId,
          chapterXPReward,
          path.domain,
          `Completed chapter: ${chapter.title}`,
          { pathId: path._id, chapterId: chapter.id },
          session
        );
        newRank = evolutionResult.user.rank;
      }

      await session.commitTransaction();
      session.endSession();

      return {
        message: 'Chapter completed successfully',
        xpEarned: chapterXPReward,
        newRank: newRank,
        overallCompletion: progress.overallCompletion,
        nextChapterId: progress.currentChapterId,
      };
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  /**
   * Get path prerequisites
   */
  static async getPrerequisitePaths(pathId: string) {
    const path = await NeuralPath.findById(pathId);

    if (!path || path.prerequisites.length === 0) {
      return [];
    }

    const query: any = {
      _id: { $in: path.prerequisites },
      isActive: true,
    };

    const prerequisites = await NeuralPath.find(query).lean();

    return prerequisites;
  }
}
