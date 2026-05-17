import { NextRequest } from 'next/server';
import { getAuthContext, withErrorHandling, requireAuth } from '@/middleware/auth';
import { ApiResponseHandler } from '@/lib/utils/response';
import { EvolutionService } from '@/modules/evolution/evolution.service';
import { connectDB } from '@/database/connection';
import { z } from 'zod';

const AddXpSchema = z.object({
  amount: z.number().positive(),
  domain: z.string().min(1),
  reason: z.string().min(1),
  metadata: z.any().optional(),
});

async function handler(request: NextRequest) {
  const auth = getAuthContext(request);
  if (!auth) return ApiResponseHandler.unauthorized();

  await connectDB();

  let body;
  try {
    body = await request.json();
  } catch {
    return ApiResponseHandler.badRequest('Invalid JSON body');
  }

  const result = AddXpSchema.safeParse(body);
  if (!result.success) {
    return ApiResponseHandler.badRequest('Invalid payload');
  }

  const { amount, domain, reason, metadata } = result.data;

  const response = await EvolutionService.addXP(auth.userId, amount, domain, reason, metadata);
  // Auto-update streak when gaining XP
  await EvolutionService.updateStreak(auth.userId);

  return ApiResponseHandler.success(response, 'XP added successfully');
}

export const POST = withErrorHandling(requireAuth(handler));
