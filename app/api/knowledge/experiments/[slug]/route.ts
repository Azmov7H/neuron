/**
 * GET /api/knowledge/experiments/[slug]      → experiment by slug
 * PUT /api/knowledge/experiments/[slug]      → update (contributor+)
 * DELETE /api/knowledge/experiments/[slug]   → delete (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { ExperimentService } from '@/modules/knowledge/experiment.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateExperimentSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const experiment = await ExperimentService.getBySlug(slug);
  return ApiResponseHandler.success(experiment, 'Experiment retrieved');
}

async function putHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const experiment = await ExperimentService.getBySlug(slug);

  const body = await request.json();
  const validation = CreateExperimentSchema.partial().safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const updated = await ExperimentService.update(experiment.experimentId, validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'update',
    entity: 'Experiment',
    entityId: experiment.experimentId,
  });
  return ApiResponseHandler.success(updated, 'Experiment updated');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { slug } = await params;
  const experiment = await ExperimentService.getBySlug(slug);
  await ExperimentService.remove(experiment.experimentId);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'Experiment',
    entityId: experiment.experimentId,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Experiment deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireRole('contributor')(requireAuth(putHandler)));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
