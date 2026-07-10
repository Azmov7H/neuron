/**
 * GET /api/knowledge/timeline             → list/filter timeline events
 * POST /api/knowledge/timeline            → create event (curator+)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { TimelineService, TimelineFilter } from '@/modules/knowledge/timeline.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateTimelineEventSchema } from '@/validations/knowledge';
import { ScientificDomain, TimelineEra } from '@/types';

function parseFilter(request: NextRequest): TimelineFilter {
  const p = new URL(request.url).searchParams;
  const filter: Record<string, unknown> = {};
  if (p.get('era')) filter.era = p.get('era') as TimelineEra;
  if (p.get('domain')) filter.domain = p.get('domain') as ScientificDomain;
  if (p.get('minYear')) filter.minYear = Number(p.get('minYear'));
  if (p.get('maxYear')) filter.maxYear = Number(p.get('maxYear'));
  if (p.get('significanceMin')) filter.significanceMin = Number(p.get('significanceMin'));
  if (p.get('page')) filter.page = Number(p.get('page'));
  if (p.get('pageSize')) filter.pageSize = Number(p.get('pageSize'));
  return filter as TimelineFilter;
}

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const filter = parseFilter(request);
  const { items, total } = await TimelineService.list(filter);
  const page = filter.page ?? 1;
  const pageSize = Math.min(filter.pageSize ?? 50, 200);
  return ApiResponseHandler.paginated(items, total, page, pageSize, 'Timeline events retrieved');
}

async function postHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const body = await request.json();
  const validation = CreateTimelineEventSchema.safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const event = await TimelineService.create(validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'create',
    entity: 'TimelineEvent',
    entityId: event.eventId,
  });
  return ApiResponseHandler.created(event, 'Timeline event created');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const POST = withErrorHandling(requireRole('curator')(requireAuth(postHandler)));
