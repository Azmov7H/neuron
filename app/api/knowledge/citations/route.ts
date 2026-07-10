/**
 * GET /api/knowledge/citations             → list citations (optional ?conceptId=)
 * POST /api/knowledge/citations            → create citation (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { CitationService } from '@/modules/knowledge/citation.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateCitationSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const conceptId = new URL(request.url).searchParams.get('conceptId') ?? undefined;
  const citations = await CitationService.list(conceptId);
  return ApiResponseHandler.success(citations, 'Citations retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateCitationSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const citation = await CitationService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'Citation',
    entityId: citation.citationId,
  });
  return ApiResponseHandler.created(citation, 'Citation created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
