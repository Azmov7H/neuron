import { NextRequest } from 'next/server';
import { withErrorHandling, requireAuth, withRateLimit } from '@/middleware/auth';
import { requireSimulationCsrfProtection } from '@/lib/security/simulation-security';
import { ApiResponseHandler } from '@/lib/utils/response';
import { NlInterpretationRequestSchema } from '@/lib/simulation/schemas';
import { NaturalLanguageInterpreter } from '@/lib/simulation/nl-interpreter.service';

async function handler(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ApiResponseHandler.badRequest('Invalid request body');
  }

  const parsed = NlInterpretationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return ApiResponseHandler.badRequest(
      parsed.error.issues[0]?.message ?? 'Invalid natural-language request'
    );
  }

  const result = await NaturalLanguageInterpreter.interpret({
    text: parsed.data.text,
    domainHint: parsed.data.domainHint,
  });

  return ApiResponseHandler.success(result);
}

export const POST = withErrorHandling(
  requireSimulationCsrfProtection(requireAuth(withRateLimit(handler)))
);