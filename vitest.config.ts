import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.{ts,tsx}'],
    // Env guardrails for server modules imported under test (config/env
    // refuses to boot without these, and ENABLE_SPARK_AI would demand a key).
    env: {
      NODE_ENV: 'test',
      ENABLE_SPARK_AI: 'false',
      JWT_SECRET: 'test-jwt-secret',
      REFRESH_TOKEN_SECRET: 'test-refresh-secret',
    },
  },
  resolve: {
    // Vite 8 native tsconfig paths support — resolves `@/` per tsconfig.json.
    tsconfigPaths: true,
  },
});