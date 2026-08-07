/**
 * Simulation Engine Constants
 * Centralized configuration for rendering, physics, and timing
 */

// ============================================================================
// CANVAS & RENDERING CONSTANTS
// ============================================================================

/** Canvas logical width (CSS pixels before DPI scaling) */
export const CANVAS_LOGICAL_WIDTH = 760;

/** Canvas logical height (CSS pixels before DPI scaling) */
export const CANVAS_LOGICAL_HEIGHT = 480;

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

// ============================================================================
// PARTICLE & ENTITY CONSTANTS
// ============================================================================

/** Particle array initial capacity */
export const PARTICLE_POOL_SIZE = 1000;

/** SIR Model: Susceptible particle radius */
export const SIR_PARTICLE_RADIUS_SUSCEPTIBLE = 3.5;

/** SIR Model: Infected particle radius */
export const SIR_PARTICLE_RADIUS_INFECTED = 4.5;

/** WBC particle radius */
export const WBC_RADIUS = 9;

/** WBC center nucleus radius */
export const WBC_NUCLEUS_RADIUS = 3.5;

/** Pathogen particle radius */
export const PATHOGEN_RADIUS = 2.5;

/** Bead particle radius */
export const BEAD_RADIUS = 4;

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
// COLOR PALETTES & STYLING
// ============================================================================

export const PARTICLE_COLORS = {
  SIR_SUSCEPTIBLE: '#22d3ee',
  SIR_INFECTED: '#f43f5e',
  SIR_RECOVERED: '#34d399',
  PATHOGEN: '#f43f5e',
  WBC: 'rgba(52, 211, 153, 0.35)',
  WBC_STROKE: '#34d399',
  WBC_NUCLEUS: '#047857',
  BEAD: 'rgba(244, 63, 94, 0.6)',
} as const;

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

// ============================================================================
// DOMAIN-SPECIFIC ENGINE IDS
// ============================================================================

export const DOMAIN_ICONS_MAP = {
  physics: 'Atom',
  biology: 'Compass',
  anatomy: 'Heart',
  mathematics: 'Landmark',
  quantum: 'Brain',
  space: 'Orbit',
} as const;
