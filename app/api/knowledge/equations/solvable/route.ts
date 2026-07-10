/**
 * GET /api/knowledge/equations/solvable
 * List equations with an enabled interactive solver.
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, withErrorHandling, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { EquationService } from '@/modules/knowledge/equation.service';

async function getHandler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();
  await connectDB();

  const equations = await EquationService.listSolvable();
  return ApiResponseHandler.success(equations, 'Solvable equations retrieved');
}

export const GET = withErrorHandling(requireAuth(getHandler));
