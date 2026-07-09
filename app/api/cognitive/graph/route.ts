/**
 * GET /api/cognitive/graph
 * GET user's knowledge graph
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { KnowledgeGraphService } from '@/modules/cognitive-engine/knowledge-graph.service';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const graph = await KnowledgeGraphService.getOrCreateGraph(auth.userId);
  return ApiResponseHandler.success(graph, 'Knowledge graph retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));