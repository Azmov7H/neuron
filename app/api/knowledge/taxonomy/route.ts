/**
 * GET /api/knowledge/taxonomy             → list taxonomy nodes (optional ?domain=)
 * POST /api/knowledge/taxonomy            → create node (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { TaxonomyService } from '@/modules/knowledge/taxonomy.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateTaxonomyNodeSchema } from '@/validations/knowledge';
import { ScientificDomain } from '@/types';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const domain = (new URL(request.url).searchParams.get('domain') as ScientificDomain) ?? undefined;
  const nodes = await TaxonomyService.list(domain);
  return ApiResponseHandler.success(nodes, 'Taxonomy nodes retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateTaxonomyNodeSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const node = await TaxonomyService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'TaxonomyNode',
    entityId: node.nodeId,
  });
  return ApiResponseHandler.created(node, 'Taxonomy node created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
