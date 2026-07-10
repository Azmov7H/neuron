/**
 * GET /api/knowledge/taxonomy/tree?nodeId=...
 * Build a nested taxonomy tree. When nodeId is omitted, all roots are built.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { TaxonomyService } from '@/modules/knowledge/taxonomy.service';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const nodeId = new URL(request.url).searchParams.get('nodeId') ?? undefined;
  const tree = await TaxonomyService.buildTree(nodeId);
  return ApiResponseHandler.success(tree, 'Taxonomy tree retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));
