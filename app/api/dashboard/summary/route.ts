/**
 * GET /api/dashboard/summary
 * Returns all dynamic dashboard data in a single request.
 * Aggregates: user stats, active learning path, weekly progress, recent discoveries.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { User } from '@/database/models/user';
import { UserProgress } from '@/database/models/user-progress';
import { NeuralPath } from '@/database/models/neural-path';
import { Discovery } from '@/database/models/discovery';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  // ── 1. User stats ──────────────────────────────────────────────────────────
  const user = await User.findById(auth.userId).lean();
  if (!user) return ApiResponseHandler.notFound('User not found');

  // ── 2. Most recent active learning progress ────────────────────────────────
  const latestProgress = await UserProgress.findOne({ userId: auth.userId })
    .sort({ lastAccessedAt: -1 })
    .lean();

  let activePath: DashboardSummary['activePath'] = null;

  if (latestProgress) {
    const path = await NeuralPath.findById(latestProgress.pathId).lean();

    if (path) {
      // Build milestone list from path chapters
      const milestones = path.chapters.map((chapter) => {
        const chapterProgress = latestProgress.chapterProgress instanceof Map
          ? latestProgress.chapterProgress.get(chapter.id)
          : (latestProgress.chapterProgress as Record<string, number>)?.[chapter.id];

        const pct = chapterProgress ?? 0;
        const isCompleted = pct >= 100;
        const isCurrent = chapter.id === latestProgress.currentChapterId;

        return {
          label: chapter.title,
          completed: isCompleted,
          current: isCurrent && !isCompleted,
        };
      });

      const currentChapter = path.chapters.find(
        (c) => c.id === latestProgress.currentChapterId
      );

      activePath = {
        pathId: String(latestProgress.pathId),
        title: path.title,
        domain: path.domain,
        currentChapterTitle: currentChapter?.title ?? 'Getting Started',
        overallCompletion: latestProgress.overallCompletion,
        milestones,
      };
    }
  }

  // ── 3. Weekly XP & stats ───────────────────────────────────────────────────
  // Weekly XP: sum of XP earned across all progress records updated this week
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const weeklyProgressRecords = await UserProgress.find({
    userId: auth.userId,
    lastAccessedAt: { $gte: oneWeekAgo },
  }).lean();

  const weeklyXP = weeklyProgressRecords.reduce((sum, p) => sum + (p.xpEarned ?? 0), 0);
  const conceptsMastered = (user.discoveredConcepts ?? []).length;

  // ── 4. Recent discoveries ──────────────────────────────────────────────────
  const rawDiscoveries = await Discovery.find({ userId: auth.userId })
    .sort({ discoveredAt: -1 })
    .limit(5)
    .lean();

  const recentDiscoveries = rawDiscoveries.map((d) => ({
    concept: d.concept,
    domain: d.domain,
    discoveredAt: d.discoveredAt,
  }));

  // ── 5. Compose response ────────────────────────────────────────────────────
  const summary: DashboardSummary = {
    user: {
      username: user.username,
      rank: user.rank,
      totalXP: user.totalXP,
      streak: user.streak,
    },
    activePath,
    weeklyStats: {
      weeklyXP,
      conceptsMastered,
      // Cognitive velocity: simple ratio vs last week (placeholder formula)
      cognitiveVelocityLabel:
        weeklyXP > 0 ? `+${Math.min(Math.round((weeklyXP / 500) * 10), 99)}%` : '—',
    },
    recentDiscoveries,
  };

  return ApiResponseHandler.success(summary, 'Dashboard summary retrieved');
}

export const GET = withErrorHandling(requireAuth(handler));

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DashboardSummary {
  user: {
    username: string;
    rank: string;
    totalXP: number;
    streak: number;
  };
  activePath: {
    pathId: string;
    title: string;
    domain: string;
    currentChapterTitle: string;
    overallCompletion: number;
    milestones: Array<{ label: string; completed: boolean; current: boolean }>;
  } | null;
  weeklyStats: {
    weeklyXP: number;
    conceptsMastered: number;
    cognitiveVelocityLabel: string;
  };
  recentDiscoveries: Array<{
    concept: string;
    domain: string;
    discoveredAt: Date;
  }>;
}
