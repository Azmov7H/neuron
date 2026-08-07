/**
 * Simulation Lifecycle Management
 * Ensures consistent state transitions throughout simulation lifecycle
 * Implements defensive checks and recovery for all simulation states
 */

import { SimulationEngine } from './engine';
import { SnapshotsManager } from './snapshots';
import { ISimulationPlugin, SimulationState } from '../types';
import { logger } from '@/lib/logger';

const DEFAULT_STATE: SimulationState = {
  timeStep: 0,
  parameters: {},
  entities: [],
  metrics: {}
};

export enum SimulationStateEnum {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  RUNNING = 'running',
  PAUSED = 'paused',
  RESETTING = 'resetting',
  DESTROYED = 'destroyed',
  ANY = 'any'
}

export interface SimulationLifecycleEvent {
  type: SimulationLifecycleEventType;
  state: SimulationState;
  timestamp: number;
  error?: Error;
}

export type SimulationLifecycleEventType =
  | 'init'
  | 'start'
  | 'pause'
  | 'resume'
  | 'reset'
  | 'update'
  | 'destroy'
  | 'error'
  | 'transition';

export interface LifecycleTransition {
  from: SimulationStateEnum;
  to: SimulationStateEnum;
  conditions: TransitionConditions;
  handler: (state: SimulationState) => SimulationState;
}

export interface TransitionConditions {
  validIf: (state: SimulationState) => boolean;
  errorIf: (state: SimulationState) => string | null;
}

export class SimulationLifecycleManager {
  private currentState: SimulationStateEnum = SimulationStateEnum.IDLE;
  private previousState: SimulationStateEnum = SimulationStateEnum.IDLE;
  private transitionHistory: SimulationLifecycleEvent[] = [];
  private stateSubscription: ((event: SimulationLifecycleEvent) => void) | null = null;
  private readonly maxHistoryLength = 50;

  // Core simulation components
  private engine: SimulationEngine | null = null;
  private snapshotsManager: SnapshotsManager | null = null;
  private plugin: ISimulationPlugin | null = null;

  // Event handling
  private eventListeners: Map<SimulationLifecycleEventType, ((event: SimulationLifecycleEvent) => void)[]> = new Map();

  // Transition management
  private transitions: LifecycleTransition[] = this.initializeTransitions();

  // State validation
  private stateValidators: Map<SimulationStateEnum, (state: SimulationState) => ValidationResult> = new Map();

  // Recovery mechanisms
  private recoveryStrategies: Map<SimulationStateEnum, () => SimulationState> = new Map();

  constructor() {
    this.initializeEventListeners();
    this.initializeStateValidators();
    this.initializeRecoveryStrategies();
  }

  public initialize(
    engine: SimulationEngine,
    snapshotsManager: SnapshotsManager,
    plugin: ISimulationPlugin
  ): void {
    this.validateInitialization(engine, snapshotsManager, plugin);

    this.engine = engine;
    this.snapshotsManager = snapshotsManager;
    this.plugin = plugin;

    this.transitionToState(SimulationStateEnum.INITIALIZING, plugin.initialize({}));

    this.currentState = SimulationStateEnum.IDLE;

    logger.info('[SimulationLifecycleManager] Lifecycle manager initialized', {
      engine: !!engine,
      snapshots: !!snapshotsManager,
      plugin: !!plugin
    });
  }

  public async start(): Promise<void> {
    return this.executeTransition('start', () => {
      if (this.currentState !== SimulationStateEnum.PAUSED) {
        if (this.currentState !== SimulationStateEnum.IDLE && this.currentState !== SimulationStateEnum.INITIALIZING) {
          throw new Error(`Cannot start simulation from state: ${this.currentState}`);
        }
      }

      if (this.currentState === SimulationStateEnum.PAUSED) {
        this.engine?.resume();
      } else {
        this.engine?.start();
      }

      return this.transitionToState(SimulationStateEnum.RUNNING, this.getCurrentEngineState());
    });
  }

  public async pause(): Promise<void> {
    await this.executeTransition('pause', () => {
      if (this.currentState !== SimulationStateEnum.RUNNING) {
        throw new Error(`Cannot pause simulation from state: ${this.currentState}`);
      }

      this.engine?.pause();
      return this.transitionToState(SimulationStateEnum.PAUSED, this.getCurrentEngineState());
    });
  }

  public async resume(): Promise<void> {
    await this.executeTransition('resume', () => {
      if (this.currentState !== SimulationStateEnum.PAUSED) {
        throw new Error(`Cannot resume simulation from state: ${this.currentState}`);
      }

      this.engine?.resume();
      return this.transitionToState(SimulationStateEnum.RUNNING, this.getCurrentEngineState());
    });
  }

  public async reset(parameters?: Record<string, number>): Promise<void> {
    await this.executeTransition('reset', () => {
      if (this.currentState === SimulationStateEnum.DESTROYED) {
        throw new Error('Cannot reset destroyed simulation');
      }

      this.transitionToState(SimulationStateEnum.RESETTING, this.getCurrentEngineState());

      if (this.engine && this.snapshotsManager && this.plugin) {
        const resetState = this.engine.reset(parameters);
        this.snapshotsManager.clear();
        this.snapshotsManager.record(resetState);

        this.validateResetState(resetState);

        return this.transitionToState(SimulationStateEnum.RUNNING, resetState);
      }

      throw new Error('Cannot reset: simulation not properly initialized');
    });
  }

  public async destroy(): Promise<void> {
    await this.executeTransition('destroy', () => {
      if (this.currentState === SimulationStateEnum.DESTROYED) {
        return this.transitionToState(SimulationStateEnum.DESTROYED, DEFAULT_STATE);
      }

      this.cleanupSimulationResources();

      this.engine?.destroy();
      this.snapshotsManager?.clear();

      return this.transitionToState(SimulationStateEnum.DESTROYED, DEFAULT_STATE);
    });
  }

  public updateState(deltaTime: number): void {
    if (this.currentState !== SimulationStateEnum.RUNNING) {
      return;
    }

    try {
      const newState = this.updateEngineState(deltaTime);
      this.transitionToState(SimulationStateEnum.RUNNING, newState);

      this.updateSnapshots(newState);
      this.updateHistory(newState);

      this.validateCurrentState(newState);
    } catch (error) {
      this.handleLifecycleError(error as Error, 'update');
    }
  }

  private async executeTransition(eventType: SimulationLifecycleEventType, transitionHandler: () => SimulationState): Promise<void> {
    this.validateTransitionPreconditions(eventType);

    const fromState = this.currentState;

    try {
      const newState = transitionHandler();

      this.recordTransition(eventType, fromState, newState, null);

      this.notifyEventListeners(eventType, newState);

      logger.debug('[SimulationLifecycleManager] Transition completed', {
        from: fromState,
        to: this.currentState,
        eventType
      });
    } catch (error) {
      this.handleLifecycleError(error as Error, eventType);
      throw error;
    }
  }

  private transitionToState(newStateEnum: SimulationStateEnum, stateData: SimulationState): SimulationState {
    this.validateTransitionStateData(newStateEnum, stateData);

    const oldState = this.currentState;
    this.currentState = newStateEnum;
    this.previousState = oldState;

    this.recordTransition('transition', oldState, newStateEnum, null);
    this.notifyEventListeners('transition', stateData);

    return stateData;
  }

  private updateEngineState(deltaTime: number): SimulationState {
    if (!this.engine) {
      throw new Error('Engine not initialized');
    }

    if (this.engine.isRunning) {
      return this.engine.getState();
    } else {
      return this.getCurrentEngineState();
    }
  }

  private validateTransitionPreconditions(eventType: SimulationLifecycleEventType): void {
    const transition = this.transitions.find(t => t.conditions.validIf(this.getCurrentEngineState()));
    if (!transition) {
      throw new Error(`Invalid simulation state for ${eventType} transition`);
    }
  }

  private validateTransitionStateData(stateEnum: SimulationStateEnum, stateData: SimulationState): void {
    const validator = this.stateValidators.get(stateEnum);
    if (validator) {
      const result = validator(stateData);
      if (!result.isValid) {
        logger.warn('[SimulationLifecycleManager] State validation failed', {
          state: stateEnum,
          errors: result.errors
        });
      }
    }
  }

  private getCurrentEngineState(): SimulationState {
    return this.engine ? this.engine.getState() : DEFAULT_STATE;
  }

  private recordTransition(
    eventType: SimulationLifecycleEventType,
    fromState: SimulationStateEnum | SimulationState,
    toState: SimulationStateEnum | SimulationState,
    error: Error | null
  ): void {
    const event: SimulationLifecycleEvent = {
      type: eventType,
      state: typeof toState === 'object' ? (toState as SimulationState) : this.getCurrentEngineState(),
      timestamp: Date.now(),
      error: error ?? undefined
    };

    this.transitionHistory.push(event);

    if (this.transitionHistory.length > this.maxHistoryLength) {
      this.transitionHistory.shift();
    }

    if (this.stateSubscription) {
      try {
        this.stateSubscription(event);
      } catch (subscriptionError) {
        logger.error('[SimulationLifecycleManager] State subscription error:', subscriptionError);
      }
    }
  }

  private notifyEventListeners(eventType: SimulationLifecycleEventType, state: SimulationState): void {
    const listeners = this.eventListeners.get(eventType) || [];
    const event: SimulationLifecycleEvent = {
      type: eventType,
      state,
      timestamp: Date.now()
    };

    for (const listener of listeners) {
      try {
        listener(event);
      } catch (listenerError) {
        logger.error(`[SimulationLifecycleManager] Event listener error for ${eventType}:`, listenerError);
      }
    }
  }

  private updateSnapshots(state: SimulationState): void {
    if (this.snapshotsManager) {
      try {
        this.snapshotsManager.record(state);
      } catch (snapshotError) {
        logger.error('[SimulationLifecycleManager] Snapshot update error:', snapshotError);
      }
    }
  }

  private updateHistory(state: SimulationState): void {
    if (this.snapshotsManager) {
      try {
        const historySize = this.snapshotsManager.getHistory().length;
        if (historySize > 1000) {
          logger.warn('[SimulationLifecycleManager] Large simulation history:', { size: historySize });
        }
      } catch (historyError) {
        logger.error('[SimulationLifecycleManager] History update error:', historyError);
      }
    }
  }

  private initializeTransitions(): LifecycleTransition[] {
    return [
      {
        from: SimulationStateEnum.IDLE,
        to: SimulationStateEnum.INITIALIZING,
        conditions: {
          validIf: () => true,
          errorIf: () => null
        },
        handler: (state) => state
      },
      {
        from: SimulationStateEnum.INITIALIZING,
        to: SimulationStateEnum.IDLE,
        conditions: {
          validIf: (state) => !!this.plugin,
          errorIf: (state) => this.plugin ? null : 'Plugin not available'
        },
        handler: (state) => state
      },
      {
        from: SimulationStateEnum.IDLE,
        to: SimulationStateEnum.RUNNING,
        conditions: {
          validIf: (state) => !!this.plugin && state.timeStep === 0,
          errorIf: (state) => !!this.plugin && state.timeStep === 0 ? null : 'Plugin or timeStep invalid'
        },
        handler: (state) => state
      },
      {
        from: SimulationStateEnum.RUNNING,
        to: SimulationStateEnum.PAUSED,
        conditions: {
          validIf: (state) => this.engine?.isRunning || false,
          errorIf: (state) => this.engine?.isRunning || false ? null : 'Engine not running'
        },
        handler: (state) => state
      },
      {
        from: SimulationStateEnum.PAUSED,
        to: SimulationStateEnum.RUNNING,
        conditions: {
          validIf: (state) => !this.engine?.isRunning || false,
          errorIf: (state) => !this.engine?.isRunning || false ? null : 'Engine already running'
        },
        handler: (state) => state
      },
      {
        from: SimulationStateEnum.RUNNING,
        to: SimulationStateEnum.RESETTING,
        conditions: {
          validIf: (state) => true,
          errorIf: (state) => null
        },
        handler: (state) => state
      },
      {
        from: SimulationStateEnum.RESETTING,
        to: SimulationStateEnum.RUNNING,
        conditions: {
          validIf: (state) => true,
          errorIf: (state) => null
        },
        handler: (state) => state
      },
      {
        from: SimulationStateEnum.ANY,
        to: SimulationStateEnum.DESTROYED,
        conditions: {
          validIf: (state) => true,
          errorIf: (state) => null
        },
        handler: (state) => state
      }
    ];
  }

  private initializeEventListeners(): void {
    this.eventListeners.set('init', []);
    this.eventListeners.set('start', []);
    this.eventListeners.set('pause', []);
    this.eventListeners.set('resume', []);
    this.eventListeners.set('reset', []);
    this.eventListeners.set('update', []);
    this.eventListeners.set('destroy', []);
    this.eventListeners.set('error', []);
    this.eventListeners.set('transition', []);
  }

  private initializeStateValidators(): void {
    this.stateValidators.set(SimulationStateEnum.IDLE, this.validateIdleState.bind(this));
    this.stateValidators.set(SimulationStateEnum.INITIALIZING, this.validateInitializingState.bind(this));
    this.stateValidators.set(SimulationStateEnum.RUNNING, this.validateRunningState.bind(this));
    this.stateValidators.set(SimulationStateEnum.PAUSED, this.validatePausedState.bind(this));
    this.stateValidators.set(SimulationStateEnum.RESETTING, this.validateResettingState.bind(this));
    this.stateValidators.set(SimulationStateEnum.DESTROYED, this.validateDestroyedState.bind(this));
  }

  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies.set(SimulationStateEnum.INITIALIZING, this.recoverInitializingState.bind(this));
    this.recoveryStrategies.set(SimulationStateEnum.RUNNING, this.recoverRunningState.bind(this));
    this.recoveryStrategies.set(SimulationStateEnum.PAUSED, this.recoverPausedState.bind(this));
    this.recoveryStrategies.set(SimulationStateEnum.RESETTING, this.recoverResetState.bind(this));
    this.recoveryStrategies.set(SimulationStateEnum.DESTROYED, this.recoverDestroyedState.bind(this));
  }

  private validateIdleState(state: SimulationState): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: ['Simulation is idle']
    };
  }

  private validateInitializingState(state: SimulationState): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: ['Simulation is still being initialized']
    };
  }

  private validateRunningState(state: SimulationState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (state.timeStep < 0) {
      errors.push('Invalid timeStep value');
    }

    if (!state.parameters || typeof state.parameters !== 'object') {
      errors.push('Invalid parameters');
    }

    if (!state.metrics || typeof state.metrics !== 'object') {
      warnings.push('Metrics not properly initialized');
    }

    if (!Array.isArray(state.entities)) {
      errors.push('Entities not properly initialized');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validatePausedState(state: SimulationState): ValidationResult {
    const baseValidation = this.validateRunningState(state);
    return {
      ...baseValidation,
      warnings: [...baseValidation.warnings, 'Simulation is paused']
    };
  }

  private validateResettingState(state: SimulationState): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: ['Simulation is resetting']
    };
  }

  private validateDestroyedState(state: SimulationState): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: ['Simulation is destroyed']
    };
  }

  private validateInitialization(
    engine: SimulationEngine,
    snapshotsManager: SnapshotsManager,
    plugin: ISimulationPlugin
  ): void {
    if (!engine) {
      throw new Error('Engine is required for initialization');
    }

    if (!snapshotsManager) {
      throw new Error('Snapshots manager is required for initialization');
    }

    if (!plugin) {
      throw new Error('Plugin is required for initialization');
    }
  }

  private validateResetState(state: SimulationState): void {
    const errors: string[] = [];

    if (state.timeStep !== 0) {
      errors.push('Reset state timeStep should be 0');
    }

    if (!state.parameters || Object.keys(state.parameters).length === 0) {
      errors.push('Reset state should have parameters');
    }

    if (state.entities.length !== 0) {
      errors.push('Reset state entities should be empty');
    }

    if (Object.keys(state.metrics).length !== 0) {
      errors.push('Reset state metrics should be empty or zero');
    }

    if (errors.length > 0) {
      logger.warn('[SimulationLifecycleManager] Reset state validation warnings:', errors);
    }
  }

  private validateCurrentState(state: SimulationState): void {
    const validation = this.stateValidators.get(this.currentState);
    if (validation) {
      const result = validation(state);
      if (!result.isValid && result.errors.length > 0) {
        logger.warn('[SimulationLifecycleManager] State validation warnings:', result.errors);
      }
    }
  }

  private handleLifecycleError(error: Error, context: string): void {
    logger.error(`[SimulationLifecycleManager] Error in ${context}:`, error);

    const recoveryStrategy = this.recoveryStrategies.get(this.currentState);
    if (recoveryStrategy) {
      try {
        const recoveredState = recoveryStrategy();
        this.transitionToState(this.currentState, recoveredState);
        logger.info('[SimulationLifecycleManager] Recovered from error', {
          originalError: error.message,
          recoverySuccessful: !!recoveredState
        });
      } catch (recoveryError) {
        logger.error('[SimulationLifecycleManager] Recovery failed:', recoveryError);
      }
    }

    this.notifyEventListeners('error', DEFAULT_STATE);
  }

  private recoverInitializingState(): SimulationState {
    return DEFAULT_STATE;
  }

  private recoverRunningState(): SimulationState {
    if (this.plugin && this.engine?.isRunning) {
      return this.engine.getState();
    }
    return DEFAULT_STATE;
  }

  private recoverPausedState(): SimulationState {
    if (this.plugin) {
      return this.engine?.getState() || DEFAULT_STATE;
    }
    return DEFAULT_STATE;
  }

  private recoverResetState(): SimulationState {
    if (this.plugin && this.snapshotsManager) {
      const state = this.engine?.getState() || DEFAULT_STATE;
      this.snapshotsManager.record(state);
      return state;
    }
    return DEFAULT_STATE;
  }

  private recoverDestroyedState(): SimulationState {
    return DEFAULT_STATE;
  }

  private cleanupSimulationResources(): void {
    this.eventListeners.clear();
    this.transitions = [];
    this.stateValidators.clear();
    this.recoveryStrategies.clear();

    if (this.engine) {
      this.engine.destroy();
    }

    if (this.snapshotsManager) {
      this.snapshotsManager.clear();
    }

    this.engine = null;
    this.snapshotsManager = null;
    this.plugin = null;
  }

  public subscribeToStateChanges(callback: (event: SimulationLifecycleEvent) => void): () => void {
    this.stateSubscription = callback;

    return () => {
      if (this.stateSubscription === callback) {
        this.stateSubscription = null;
      }
    };
  }

  public subscribeToEvents(eventType: SimulationLifecycleEventType, callback: (event: SimulationLifecycleEvent) => void): () => void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }

    const listeners = this.eventListeners.get(eventType);
    listeners?.push(callback);

    return () => {
      const index = listeners?.indexOf(callback);
      if (index !== -1 && index !== undefined) {
        listeners?.splice(index, 1);
      }
    };
  }

  public getCurrentState(): SimulationStateEnum {
    return this.currentState;
  }

  public getPreviousState(): SimulationStateEnum {
    return this.previousState;
  }

  public getTransitionHistory(): SimulationLifecycleEvent[] {
    return [...this.transitionHistory];
  }

  public isValidTransition(from: SimulationStateEnum, to: SimulationStateEnum): boolean {
    const transition = this.transitions.find(t => t.from === from && t.to === to);
    return !!transition;
  }

  public getAvailableTransitions(currentState: SimulationStateEnum): SimulationStateEnum[] {
    const transitions = this.transitions.filter(t => {
      if (t.from === SimulationStateEnum.ANY) return true;
      return t.from === currentState;
    });
    return transitions.map(t => t.to);
  }

  public validateState(state: SimulationState): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  public cleanup(): void {
    this.eventListeners.clear();
    this.transitions = [];
    this.stateValidators.clear();
    this.recoveryStrategies.clear();

    this.cleanupSimulationResources();

    this.transitionHistory = [];
    this.stateSubscription = null;

    this.currentState = SimulationStateEnum.IDLE;
    this.previousState = SimulationStateEnum.IDLE;
  }
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}