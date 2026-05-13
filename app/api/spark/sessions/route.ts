/**
 * POST /api/spark/sessions
 * Create a new Spark AI session
 */

import { NextRequest } from 'next/server';
import { connectDB } from '@/database/connection';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { CreateSparkSessionSchema } from '@/validations/schemas';
import { SparkAIService } from '@/modules/spark-ai/spark-ai.service';

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);

  if (!auth) {
    return ApiResponseHandler.unauthorized();
  }

  await connectDB();

  try {
    const body = await request.json();
    const validated = CreateSparkSessionSchema.parse(body);

    const session = await SparkAIService.createSession(
      auth.userId,
      validated.domain,
      {
        currentPathId: validated.currentPathId,
        currentChapterId: validated.currentChapterId,
      }
    );

    return ApiResponseHandler.created(session, 'Session created');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return ApiResponseHandler.badRequest('Invalid input');
    }
    throw error;
  }
}

export const POST = withErrorHandling(requireAuth(handler));
