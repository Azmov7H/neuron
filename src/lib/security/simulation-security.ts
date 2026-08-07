/**
 * Simulation API Security Utilities
 * Centralized CSRF protection and validation utilities for simulation endpoints
 */

import { requireCsrfProtection } from './csrf';
import { validateSimulationRun, SimulationRunCreateSchema } from './validation';

/**
 * Apply CSRF protection to simulation mutation endpoints
 * Centralizes CSRF logic to avoid duplication across simulation APIs
 */
export function requireSimulationCsrfProtection(handler: any): any {
  return requireCsrfProtection(handler);
}