/**
 * POST /api/knowledge/concepts/[slug]/publish
 * Toggle published state (curator+). Body: { "isPublished": true }
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ConceptService } from '@/modules/knowledge/concept.service';
import { AuditService } from '@/modules/audit/audit.service';

async function postHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const concept = await ConceptService.getBySlug(slug);
  const body = await request.json().catch(() => ({}));
  const isPublished = body?.isPublished === true;

  const updated = await ConceptService.setPublished(concept.conceptId, isPublished);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: isPublished ? 'publish' : 'unpublish',
    entity: 'Concept',
    entityId: concept.conceptId,
  });
  return ApiResponseHandler.success(updated, `Concept ${isPublished ? 'published' : 'unpublished'}`);
}

export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
