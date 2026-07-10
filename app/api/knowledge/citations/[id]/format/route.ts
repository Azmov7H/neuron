/**
 * GET /api/knowledge/citations/[id]/format?style=apa
 * Return a citation formatted in the requested style (apa|mla|bibtex|chicago).
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { CitationService } from '@/modules/knowledge/citation.service';
import { CitationFormatSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  const validation = CitationFormatSchema.safeParse({
    citationId: id,
    style: new URL(request.url).searchParams.get('style') ?? undefined,
  });
  if (!validation.success) return zodValidationError(validation.error);

  const formatted = await CitationService.format(validation.data.citationId, validation.data.style);
  return ApiResponseHandler.success(formatted, 'Citation formatted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
