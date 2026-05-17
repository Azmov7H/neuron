/**
 * Neural Paths Service
 * Learning path management and curriculum design
 */

import { NeuralPath } from '@/database/models/neural-path';
import { UserProgress } from '@/database/models/user-progress';
import { AppError } from '@/types';

export class NeuralPathsService {
  /**
   * Get all paths with filters
   */
  static async getPaths(filters: {
    domain?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    page?: number;
    limit?: number;
    sort?: 'popular' | 'newest' | 'difficulty';
  }) {
    const { domain, difficulty, page = 1, limit = 10, sort = 'popular' } = filters;

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

    return {
      items: paths,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get path by slug
   */
  static async getPathBySlug(slug: string) {
    const path = await NeuralPath.findOne({ slug, isActive: true });

    if (!path) {
      throw new AppError(404, 'Path not found', 'PATH_NOT_FOUND');
    }

    return path;
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
      chapterValues.reduce((a, b) => a + b, 0) / chapterValues.length
    );

    // Mark as completed if 100%
    if (progress.overallCompletion === 100) {
      progress.completedAt = new Date();
    }

    await progress.save();

    return progress;
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
