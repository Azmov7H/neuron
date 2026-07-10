/**
 * GET /api/knowledge/taxonomy/[nodeId]/children
 * Direct children of a taxonomy node.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { TaxonomyService } from '@/modules/knowledge/taxonomy.service';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { nodeId } = await params;
  const children = await TaxonomyService.getChildren(nodeId);
  return ApiResponseHandler.success(children, 'Taxonomy children retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));
