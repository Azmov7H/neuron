/**
 * GET /api/knowledge/equations/[id]         → equation by equationId
 * PUT /api/knowledge/equations/[id]         → update (contributor+)
 * DELETE /api/knowledge/equations/[id]      → delete (admin)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, requireRole, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler, zodValidationError } from '@/lib/utils/response';
import { EquationService } from '@/modules/knowledge/equation.service';
import { AuditService } from '@/modules/audit/audit.service';
import { CreateEquationSchema } from '@/validations/knowledge';

async function getHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  const equation = await EquationService.getByEquationId(id);
  return ApiResponseHandler.success(equation, 'Equation retrieved');
}

async function putHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  await EquationService.getByEquationId(id);

  const body = await request.json();
  const validation = CreateEquationSchema.partial().safeParse(body);
  if (!validation.success) return zodValidationError(validation.error);

  const updated = await EquationService.update(id, validation.data);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'update',
    entity: 'Equation',
    entityId: id,
  });
  return ApiResponseHandler.success(updated, 'Equation updated');
}

async function deleteHandler(request: NextRequest, { params }: any) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const { id } = await params;
  await EquationService.getByEquationId(id);
  await EquationService.remove(id);
  await AuditService.log({
    context: AuditService.fromRequest(request, auth.userId, auth.role),
    action: 'delete',
    entity: 'Equation',
    entityId: id,
  });
  return ApiResponseHandler.success({ deleted: true }, 'Equation deleted');
}

export const GET = withErrorHandling(requireAuth(getHandler));
export const PUT = withErrorHandling(requireRole('contributor')(requireAuth(putHandler)));
export const DELETE = withErrorHandling(requireRole('admin')(requireAuth(deleteHandler)));
