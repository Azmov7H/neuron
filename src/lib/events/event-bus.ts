/**
 * In-Process Domain Event Bus
 * Facilitates decoupling between modules by allowing event dispatch and subscription.
 * Supports synchronous execution via publish to allow callers to await side-effects.
 */

export enum DomainEventType {
  ConversationCompleted = 'ConversationCompleted',
  UserEarnedXP = 'UserEarnedXP',
  DiscoveryCreated = 'DiscoveryCreated',
  RecommendationGenerated = 'RecommendationGenerated',
  KnowledgeUnlocked = 'KnowledgeUnlocked',
  LearningPathCompleted = 'LearningPathCompleted',
}

export interface DomainEventPayloadMap {
  [DomainEventType.ConversationCompleted]: {
    sessionId: string;
    userId: string;
    domain: string;
    userMessage: string;
    assistantMessage: string;
    conceptsList: Array<{ title: string; domain?: string }>;
    resultCarrier?: {
      addedXp?: number;
      isRankUp?: boolean;
    };
  };
  [DomainEventType.UserEarnedXP]: {
    userId: string;
    amount: number;
    domain: string;
    reason: string;
    metadata?: Record<string, unknown>;
  };
  [DomainEventType.DiscoveryCreated]: {
    userId: string;
    conceptId: string;
    concept: string;
    domain: string;
    context?: Record<string, unknown>;
  };
  [DomainEventType.RecommendationGenerated]: {
    userId: string;
    recommendationsCount: number;
  };
  [DomainEventType.KnowledgeUnlocked]: {
    userId: string;
    knowledgeId: string;
  };
  [DomainEventType.LearningPathCompleted]: {
    userId: string;
    pathId: string;
    title: string;
  };
}

export interface DomainEvent<T extends DomainEventType> {
  id: string;
  type: T;
  timestamp: Date;
  payload: DomainEventPayloadMap[T];
}

export type DomainEventListener<T extends DomainEventType> = (
  event: DomainEvent<T>
) => void | Promise<void>;

class EventBus {
  private listenersMap = new Map<DomainEventType, Array<DomainEventListener<any>>>();

  constructor() {}

  /**
   * Publish an event to all subscribers and wait for them to finish.
   */
  async publish<T extends DomainEventType>(
    type: T,
    payload: DomainEventPayloadMap[T]
  ): Promise<void> {
    const event: DomainEvent<T> = {
      id: Math.random().toString(36).substring(2, 15),
      type,
      timestamp: new Date(),
      payload,
    };

    const listeners = this.listenersMap.get(type) || [];
    for (const listener of listeners) {
      try {
        await listener(event);
      } catch (err) {
        console.error(`[EventBus] Error executing subscriber for ${type}:`, err);
      }
    }
  }

  /**
   * Subscribe to a domain event.
   */
  subscribe<T extends DomainEventType>(
    type: T,
    listener: DomainEventListener<T>
  ): void {
    if (!this.listenersMap.has(type)) {
      this.listenersMap.set(type, []);
    }
    this.listenersMap.get(type)!.push(listener);
  }

  /**
   * Clear all subscribers (useful for testing).
   */
  clearAll(): void {
    this.listenersMap.clear();
  }
}

export const eventBus = new EventBus();
