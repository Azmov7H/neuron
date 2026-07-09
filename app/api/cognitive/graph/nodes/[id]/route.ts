/**
 * GET /api/cognitive/graph/nodes/[id]
 * GET concept node by ID
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { KnowledgeGraphService } from '@/modules/cognitive-engine/knowledge-graph.service';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const { id } = await params;
  const node = await KnowledgeGraphService.getNode(auth.userId, id);

  if (!node) {
    return ApiResponseHandler.notFound('Concept not found');
  }

  return ApiResponseHandler.success(node, 'Concept node retrieved');
}

async function getRelatedHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const { id } = await params;
  const related = await KnowledgeGraphService.getRelatedNodes(auth.userId, id);

  return ApiResponseHandler.success(related, 'Related concepts retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const RELATED = withErrorHandling(requireAuth(getRelatedHandler));