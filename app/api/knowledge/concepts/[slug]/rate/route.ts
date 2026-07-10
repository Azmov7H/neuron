/**
 * POST /api/knowledge/concepts/[slug]/rate
 * Submit a 0–5 rating (any authenticated user). Body: { "value": 4 }
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { ConceptService } from '@/modules/knowledge/concept.service';

async function postHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const concept = await ConceptService.getBySlug(slug);
  const body = await request.json().catch(() => ({}));
  const value = Number(body?.value);
  if (Number.isNaN(value)) return ApiResponseHandler.badRequest('value must be a number');

  const updated = await ConceptService.rate(concept.conceptId, value);
  return ApiResponseHandler.success(updated, 'Rating recorded');
}

export const POST = withErrorHandling(requireAuth(postHandler));
