/**
 * POST /api/cognitive/graph/nodes/edge
 * POST add a new edge between concept nodes
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { KnowledgeGraphService } from '@/modules/cognitive-engine/knowledge-graph.service';
import { AddEdgeSchema } from '@/validations/schemas';

async function postEdgeHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const body = await request.json();
  const validation = AddEdgeSchema.safeParse(body);

  if (!validation.success) {
    return zodValidationError(validation.error);
  }

  const graph = await KnowledgeGraphService.addEdge(auth.userId, validation.data);
  return ApiResponseHandler.success(graph, 'Edge added');
}

export const POST = withErrorHandling(requireAuth(postEdgeHandler));
