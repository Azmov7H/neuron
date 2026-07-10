/**
 * GET /api/knowledge/domains             → list scientific domains (catalog)
 * POST /api/knowledge/domains            → create domain (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { DomainService } from '@/modules/knowledge/domain.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateDomainSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const includeInactive = new URL(request.url).searchParams.get('all') === 'true';
  const domains = await DomainService.list(!includeInactive);
  return ApiResponseHandler.success(domains, 'Domains retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateDomainSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const domain = await DomainService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'Domain',
    entityId: domain.slug,
  });
  return ApiResponseHandler.created(domain, 'Domain created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
