/**
 * Environment Configuration
 * Centralized environment variable management with validation
 */

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value && value.trim() !== '') {
    return value;
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  throw new Error(`Missing required environment variable: ${key}`);
};

const nodeEnv = getEnv('NODE_ENV', 'development');

export const config = {
  // Database
  database: {
    mongodb: {
      uri: getEnv('MONGODB_URI', 'mongodb://localhost:27017/neuron'),
      dbName: getEnv('MONGODB_DB_NAME', 'neuron'),
      // Connection pool settings
      maxPoolSize: parseInt(getEnv('MONGODB_MAX_POOL_SIZE', '10')),
      minPoolSize: parseInt(getEnv('MONGODB_MIN_POOL_SIZE', '5')),
    },
  },

  // Authentication
  auth: {
    jwtSecret: getEnv('JWT_SECRET'),
    jwtExpiration: getEnv('JWT_EXPIRATION', '24h'),
    refreshTokenSecret: getEnv('REFRESH_TOKEN_SECRET'),
    refreshTokenExpiration: getEnv('REFRESH_TOKEN_EXPIRATION', '7d'),
    bcryptRounds: parseInt(getEnv('BCRYPT_ROUNDS', '12')),
  },

  // AI/LLM Integration
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
    openaiModel: getEnv('OPENAI_MODEL', 'gpt-4-turbo'),
    embeddingModel: getEnv('EMBEDDING_MODEL', 'text-embedding-3-small'),
  },

  // Server
  server: {
    nodeEnv,
    port: parseInt(getEnv('PORT', '3000')),
    dashboardSecret:
      nodeEnv === 'production'
        ? getEnv('DASHBOARD_SECRET')
        : process.env.DASHBOARD_SECRET?.trim() || 'development-dashboard-secret',
    isDevelopment: nodeEnv === 'development',
    isProduction: nodeEnv === 'production',
  },

  // Caching
  cache: {
    redisUrl: process.env.REDIS_URL ?? '',
    enableRedis: getEnv('ENABLE_REDIS', 'false') === 'true',
    ttl: {
      user: parseInt(getEnv('CACHE_TTL_USER', '3600')), // 1 hour
      recommendations: parseInt(getEnv('CACHE_TTL_RECOMMENDATIONS', '1800')), // 30 min
      paths: parseInt(getEnv('CACHE_TTL_PATHS', '7200')), // 2 hours
    },
  },

  // Features
  features: {
    enableSparkAI: getEnv('ENABLE_SPARK_AI', 'true') === 'true',
    enableRecommendations: getEnv('ENABLE_RECOMMENDATIONS', 'true') === 'true',
    enableAnalytics: getEnv('ENABLE_ANALYTICS', 'true') === 'true',
  },
};

if (config.features.enableSparkAI && !config.ai.openaiApiKey) {
  throw new Error('ENABLE_SPARK_AI is enabled but OPENAI_API_KEY is not configured.');
}

if (config.cache.enableRedis && !config.cache.redisUrl) {
  throw new Error('ENABLE_REDIS is enabled but REDIS_URL is not configured.');
}
