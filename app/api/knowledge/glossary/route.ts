/**
 * GET /api/knowledge/glossary             → list/filter glossary terms
 * POST /api/knowledge/glossary            → create term (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { GlossaryService, GlossaryFilter } from '@/modules/knowledge/glossary.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateGlossaryTermSchema } from '@/validations/knowledge';
import { Difficulty, ScientificDomain } from '@/types';

function parseFilter(request: NextRequest): GlossaryFilter {
  const p = new URL(request.url).searchParams;
  const filter: Record<string, unknown> = {};
  if (p.get('domain')) filter.domain = p.get('domain') as ScientificDomain;
  if (p.get('difficulty')) filter.difficulty = p.get('difficulty') as Difficulty;
  if (p.get('isPublished')) filter.isPublished = p.get('isPublished') === 'true';
  if (p.get('search')) filter.search = p.get('search')!;
  if (p.get('page')) filter.page = Number(p.get('page'));
  if (p.get('pageSize')) filter.pageSize = Number(p.get('pageSize'));
  return filter as GlossaryFilter;
}

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const filter = parseFilter(request);
  const { items, total } = await GlossaryService.list(filter);
  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 50, 200);
  return ApiResponseHandler.paginated(items, total, page, pageSize, 'Glossary terms retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateGlossaryTermSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const term = await GlossaryService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'GlossaryTerm',
    entityId: term.termId,
  });
  return ApiResponseHandler.created(term, 'Glossary term created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
