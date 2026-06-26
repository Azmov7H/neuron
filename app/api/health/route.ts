import { connectDB } from '@/database/connection';
import packageJson from '@/package.json';
import { ApiResponseHandler } from '@/lib/utils/response';
import { config } from '@/config/env';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const connection = await connectDB();
    const isConnected = Boolean(connection?.readyState === 1);

    return ApiResponseHandler.success(
      {
        status: 'ok',
        uptime: process.uptime(),
        version: packageJson.version || '0.1.0',
        environment: config.server.nodeEnv,
        database: {
          connected: isConnected,
          readyState: connection?.readyState ?? 0,
        },
      },
      'Health check successful'
    );
  } catch (error) {
    logger.error('[Health] Health check failed', error);
    return ApiResponseHandler.error(
      'Health check failed. Database connectivity issue.',
      503
    );
  }
}
