const SENSITIVE_KEY_PATTERNS = [/password/i, /token/i, /jwt/i, /api[-_]?key/i, /authorization/i, /secret/i];
const TOKEN_LIKE_PATTERN = /^(Bearer\s+)?[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
const UPSTREAM_KEY_PATTERN = /(sk-|utk-|upstash|authorization=|api_key=|api-key=)/i;

const isDevelopment = process.env.NODE_ENV !== 'production';

function isSensitiveKey(key: string) {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function maskValue(value: unknown) {
  return typeof value === 'string' ? '***' : '***';
}

function sanitizeString(value: string) {
  if (TOKEN_LIKE_PATTERN.test(value.trim())) {
    return '***';
  }

  if (UPSTREAM_KEY_PATTERN.test(value)) {
    return '***';
  }

  return value;
}

function sanitizeObject(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeObject(item));
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: sanitizeString(value.message),
      ...(isDevelopment ? { stack: value.stack } : {}),
    };
  }

  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      sanitized[key] = isSensitiveKey(key) ? maskValue(item) : sanitizeObject(item);
    }
    return sanitized;
  }

  return value;
}

function formatValue(value: unknown): string {
  const sanitized = sanitizeObject(value);
  if (typeof sanitized === 'string') {
    return sanitized;
  }

  try {
    return JSON.stringify(sanitized, null, isDevelopment ? 2 : 0);
  } catch {
    return String(sanitized);
  }
}

function buildMessage(level: string, args: unknown[]) {
  return args.map((arg) => formatValue(arg)).join(' ');
}

function output(level: 'info' | 'warn' | 'error' | 'debug', args: unknown[]) {
  const message = buildMessage(level, args);

  if (isDevelopment) {
    const prefix = `[${level.toUpperCase()}]`;
    if (level === 'warn') {
      console.warn(prefix, message);
    } else if (level === 'error') {
      console.error(prefix, message);
    } else {
      console.log(prefix, message);
    }
    return;
  }

  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    environment: process.env.NODE_ENV || 'unknown',
  };
  console.log(JSON.stringify(logEntry));
}

export const logger = {
  info: (...args: unknown[]) => output('info', args),
  warn: (...args: unknown[]) => output('warn', args),
  error: (...args: unknown[]) => output('error', args),
  debug: (...args: unknown[]) => output('debug', args),
};
