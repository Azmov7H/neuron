/**
 * GET /api/notifications
 * Aggregates the current user's notifications from recommendation signals
 * and recent learning activity into a single lightweight feed for the
 * top-bar notification center.
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/database/connection";
import { getAuthContext, withErrorHandling, requireAuth } from "@/middleware/auth";
import { ApiResponseHandler } from "@/lib/utils/response";
import { Recommendation } from "@/database/models/recommendation";
import { EvolutionLog } from "@/database/models/evolution-log";

export interface AppNotification {
  id: string;
  type: "recommendation" | "activity";
  title: string;
  body: string;
  href?: string;
  createdAt: string;
}

export interface NotificationsResponse {
  items: AppNotification[];
  unread: number;
}

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const [recommendations, activity] = await Promise.all([
    Recommendation.find({ userId: auth.userId, expiresAt: { $gt: new Date() } })
      .sort({ relevanceScore: -1 })
      .limit(6)
      .lean(),
    EvolutionLog.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<Array<{ _id: { toString(): string }; reason?: string; xp?: number; createdAt: Date }>>(),
  ]);

  const items: AppNotification[] = [];

  for (const r of recommendations) {
    items.push({
      id: String(r._id),
      type: "recommendation",
      title: r.targetTitle,
      body: r.reason,
      href: "/dashboard/recommendations",
      createdAt: (r.createdAt as Date).toISOString(),
    });
  }

  for (const a of activity) {
    items.push({
      id: String(a._id),
      type: "activity",
      title: "Learning activity",
      body: `${a.reason ?? "Progress update"}${a.xp ? ` (+${a.xp} XP)` : ""}`,
      createdAt: a.createdAt.toISOString(),
    });
  }

  items.sort(
    (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
  );

  // Unread = recommendations the user has not yet viewed.
  const unread = recommendations.filter((r) => !r.viewed).length;

  return ApiResponseHandler.success<NotificationsResponse>({ items, unread });
}

export const GET = withErrorHandling(requireAuth(handler));
