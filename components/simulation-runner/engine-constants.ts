/**
 * Simulation Engine Constants
 * Centralized configuration for rendering, physics, and timing
 */

// ============================================================================
// CANVAS & RENDERING CONSTANTS
// ============================================================================

/** Grid cell size for background grid overlay */
export const GRID_CELL_SIZE = 16;

/** Background grid opacity color */
export const GRID_COLOR = 'rgba(255, 255, 255, 0.012)';

/** Canvas background color */
export const CANVAS_BG_COLOR = '#030305';

/** Grid line width */
export const GRID_LINE_WIDTH = 1;

// ============================================================================
// ANIMATION & TIMING CONSTANTS
// ============================================================================

/** Telemetry sync throttle: max updates per second (100ms = 10 FPS) */
export const TELEMETRY_SYNC_INTERVAL_MS = 100;

/** Minimum frame duration to allow */
export const MIN_DELTA_TIME_MS = 8;

/** Maximum frame duration cap */
export const MAX_DELTA_TIME_MS = 50;

/**
 * Normalised orbital render speed (RF-2). ω = ORBIT_RENDER_SPEED · √(M/a³),
 * calibrated so the default orbit (a = 10, M = 120) keeps its pre-fix visual
 * pacing. Visual behaviour only; telemetry is unchanged.
 */
export const ORBIT_RENDER_SPEED = 0.057;

/**
 * Nominal engine timestep (one classic 60Hz frame).
 * Used as the safe first-frame delta and as the engine time unit: physics
 * constants remain calibrated in "1/60 s ticks" and delta-time scales them.
 */
export const ENGINE_TIMESTEP_MS = 1000 / 60;

/** Engine clock scale: simulation seconds → 60Hz ticks (draw master clock). */
export const ENGINE_TICKS_PER_SECOND = 60;

// ============================================================================
// PHYSICS PARAMETERS
// ============================================================================

/** Gravity constant for orbital calculations */
export const GRAVITY_CONSTANT = 9.8;

/** Motion box initial X position */
export const MOTION_BOX_START_X = 60;

/** Motion box velocity damping */
export const MOTION_VELOCITY_DAMPING = 0.03;

/** Axon signal animation speed multiplier */
export const AXON_SIGNAL_BASE_SPEED = 2.0;

/** Maximum axon progress before reset */
export const AXON_PROGRESS_MAX_OFFSET = 50;

// ============================================================================
// INITIAL POPULATION DEFAULTS
// ============================================================================

export const DEFAULT_POPULATIONS = {
  WBC_COUNT: 15,
  PATHOGEN_COUNT: 40,
  SIR_PARTICLES: 120,
  GALTON_BEADS: 200,
  NETWORK_NODES: 30,
} as const;
