/**
 * GET /api/dock
 * Returns recent persisted "processes" (simulation runs) for the bottom dock.
 * The dock surfaces activity; live in-session runs are layered on top client-side.
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/database/connection";
import { getAuthContext, withErrorHandling, requireAuth } from "@/middleware/auth";
import { ApiResponseHandler } from "@/lib/utils/response";
import { SimulationRun } from "@/database/models/simulation-run";
import mongoose from "mongoose";

export interface DockItemDTO {
  id: string;
  label: string;
  status: "running" | "paused" | "done" | "error";
  progress?: number;
  href?: string;
}

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const runs = await SimulationRun.find({
    userId: new mongoose.Types.ObjectId(auth.userId),
  })
    .sort({ timestamp: -1 })
    .limit(8)
    .lean();

  const items: DockItemDTO[] = runs.map((r) => ({
    id: String(r._id),
    label: `${r.domain} · ${r.aiInterpretation.metadata.simulationType}`,
    status: "done",
    progress: 100,
    href: "/dashboard/simulations",
  }));

  return ApiResponseHandler.success({ items });
}

export const GET = withErrorHandling(requireAuth(handler));
