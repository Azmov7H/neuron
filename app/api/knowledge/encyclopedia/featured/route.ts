/**
 * GET /api/knowledge/encyclopedia/featured?domain=physics
 * List featured, published encyclopedia articles.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { EncyclopediaService } from '@/modules/knowledge/encyclopedia.service';
import { ScientificDomain } from '@/types';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const domain = (new URL(request.url).searchParams.get('domain') as ScientificDomain) ?? undefined;
  const articles = await EncyclopediaService.listFeatured(domain);
  return ApiResponseHandler.success(articles, 'Featured articles retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));
