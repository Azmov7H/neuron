/**
 * GET /api/knowledge/glossary/random?domain=physics&count=3
 * Return random published glossary terms (e.g., word-of-the-day).
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { GlossaryService } from '@/modules/knowledge/glossary.service';
import { ScientificDomain } from '@/types';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const p = new URL(request.url).searchParams;
  const domain = (p.get('domain') as ScientificDomain) ?? undefined;
  const count = Math.min(Math.max(Number(p.get('count') ?? 1), 1), 20);
  const terms = await GlossaryService.random(domain, count);
  return ApiResponseHandler.success(terms, 'Random glossary terms retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));
