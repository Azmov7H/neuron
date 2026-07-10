/**
 * GET /api/knowledge/search?q=...&domain=physics&types=concept,equation&limit=10&offset=0&includeRelationships=true
 * Cross-collection scientific search with ranking, autocomplete, did-you-mean.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { SearchService } from '@/modules/knowledge/search.service';
import { SearchQuerySchema } from '@/validations/knowledge';

function parseQuery(request: NextRequest) {
  const p = new URL(request.url).searchParams;
  const types = p.get('types')?.split(',').filter(Boolean);
  return {
    q: p.get('q') ?? '',
    domain: p.get('domain') ?? undefined,
    difficulty: p.get('difficulty') ?? undefined,
    types: types?.length ? types : undefined,
    limit: p.get('limit') ?? undefined,
    offset: p.get('offset') ?? undefined,
    includeRelationships: p.get('includeRelationships') ?? undefined,
  };
}

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const validation = SearchQuerySchema.safeParse(parseQuery(request));
  if (!validation.success) return zodValidationError(validation.error);

  const results = await SearchService.search(validation.data);
  return ApiResponseHandler.success(results, 'Search complete');
}

export const GET = withErrorHandling(requireAuth(getHandler));
