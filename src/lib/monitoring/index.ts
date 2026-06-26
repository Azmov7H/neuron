import { config } from '@/config/env';
import { logger } from '@/lib/logger';

export const monitoringConfig = {
  sentryDsn: config.monitoring.sentryDsn,
  otelEnabled: config.monitoring.enableOpenTelemetry,
};

export function initMonitoring() {
  logger.info('[Monitoring] Initialization complete', {
    sentryEnabled: Boolean(monitoringConfig.sentryDsn),
    openTelemetryEnabled: monitoringConfig.otelEnabled,
  });
}

export function captureException(error: unknown, context?: string) {
  logger.error('[Monitoring] Captured exception', { context, error });
}
