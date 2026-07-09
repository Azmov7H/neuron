/**
 * POST /api/cognitive/graph/nodes
 * POST add a new concept node to the knowledge graph
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext, withErrorHandling } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { KnowledgeGraphService } from '@/modules/cognitive-engine/knowledge-graph.service';
import { AddKnowledgeNodeSchema, AddEdgeSchema } from '@/validations/schemas';

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  const body = await request.json();
  const validation = AddKnowledgeNodeSchema.safeParse(body);

  if (!validation.success) {
    return zodValidationError(validation.error);
  }

  const graph = await KnowledgeGraphService.addConceptNode(auth.userId, validation.data);
  return ApiResponseHandler.success(graph, 'Concept node added');
}

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

export const POST = withErrorHandling(requireAuth(postHandler));
export const EDGE = withErrorHandling(requireAuth(postEdgeHandler));