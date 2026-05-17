/**
 * GET /api/users/profile
 * Get current user profile (requires auth)
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { requireAuth, getAuthContext } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { User } from '@/database/models/user';
import { withErrorHandling } from '@/middleware/auth';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);

  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  await connectDB();

  const user = await User.findById(auth.userId);

  if (!user) {
    return ApiResponseHandler.notFound('User not found');
  }

  return ApiResponseHandler.success(user.toJSON(), 'Profile retrieved');
}

export const GET = withErrorHandling(requireAuth(handler));
