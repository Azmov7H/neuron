/**
 * GET /api/knowledge/search/autocomplete?q=quan&domain=physics&limit=8
 * Prefix-based autocomplete across concept titles and glossary terms.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { SearchService } from '@/modules/knowledge/search.service';
import { ScientificDomain } from '@/types';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const p = new URL(request.url).searchParams;
  const q = p.get('q') ?? '';
  const domain = (p.get('domain') as ScientificDomain) ?? undefined;
  const limit = Math.min(Number(p.get('limit') ?? 8), 25);

  const suggestions = await SearchService.autocomplete(q, domain, limit);
  return ApiResponseHandler.success({ query: q, suggestions }, 'Autocomplete complete');
}

export const GET = withErrorHandling(requireAuth(getHandler));
