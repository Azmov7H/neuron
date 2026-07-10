/**
 * GET /api/knowledge/concepts/[slug]/relationships?type=dependsOn
 * List concepts directly related to this concept (optionally by type).
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ConceptService } from '@/modules/knowledge/concept.service';
import { RelationshipType } from '@/types';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const concept = await ConceptService.getBySlug(slug);
  const type = (new URL(request.url).searchParams.get('type') as RelationshipType) ?? undefined;
  const related = await ConceptService.getRelated(concept.conceptId, type);
  return ApiResponseHandler.success(related, 'Related concepts retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));
