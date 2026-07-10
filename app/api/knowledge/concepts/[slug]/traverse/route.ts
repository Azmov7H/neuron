/**
 * GET /api/knowledge/concepts/[slug]/traverse?direction=out&maxDepth=2
 * BFS traversal over the relationship graph from this concept.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ConceptService } from '@/modules/knowledge/concept.service';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const concept = await ConceptService.getBySlug(slug);
  const url = new URL(request.url);
  const direction = (url.searchParams.get('direction') as 'out' | 'in' | 'both') ?? 'out';
  const maxDepth = Number(url.searchParams.get('maxDepth') ?? 2);

  const results = await ConceptService.traverse(concept.conceptId, direction, maxDepth);
  return ApiResponseHandler.success(results, 'Traversal complete');
}

export const GET = withErrorHandling(requireAuth(getHandler));
