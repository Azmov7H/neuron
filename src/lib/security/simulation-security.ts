/**
 * Simulation API Security Utilities
 * Centralized CSRF protection for simulation mutation endpoints
 */

import { requireCsrfProtection, RouteHandler } from './csrf';

/**
 * Apply CSRF protection to simulation mutation endpoints
 * Centralizes CSRF logic to avoid duplication across simulation APIs
 */
export function requireSimulationCsrfProtection(handler: RouteHandler): RouteHandler {
  return requireCsrfProtection(handler);
}