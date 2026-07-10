/**
 * GET /api/knowledge/taxonomy/[nodeId]      → node by nodeId
 * DELETE /api/knowledge/taxonomy/[nodeId]   → delete (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { TaxonomyService } from '@/modules/knowledge/taxonomy.service';
import { AuditService } from '@/modules/audit/audit.service';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { nodeId } = await params;
  const node = await TaxonomyService.getByNodeId(nodeId);
  return ApiResponseHandler.success(node, 'Taxonomy node retrieved');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { nodeId } = await params;
  await TaxonomyService.getByNodeId(nodeId);
  await TaxonomyService.remove(nodeId);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'TaxonomyNode',
    entityId: nodeId,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Taxonomy node deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
