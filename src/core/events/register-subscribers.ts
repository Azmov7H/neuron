/**
 * Event Subscribers Registry
 * Registers event listeners to handle side effects across domains in a decoupled manner.
 */

import { eventBus, DomainEventType } from '@/lib/events/event-bus';
import { DiscoveryService } from '@/modules/discoveries/discoveries.service';
import { XPService } from '@/modules/evolution/xp.service';

let registered = false;

export function registerEventSubscribers(): void {
  if (registered) return;

  // 1. Register Discoveries when a conversation completes
  eventBus.subscribe(DomainEventType.ConversationCompleted, async (event) => {
    const { userId, conceptsList, sessionId, domain } = event.payload;
    if (conceptsList && conceptsList.length > 0) {
      await DiscoveryService.registerDiscoveriesFromChat(
        userId,
        conceptsList,
        sessionId,
        domain
      );
    }
  });

  // 2. Award XP when a conversation completes
  eventBus.subscribe(DomainEventType.ConversationCompleted, async (event) => {
    const { userId, sessionId, domain, resultCarrier } = event.payload;
    try {
      const evoResult = await XPService.addXP(
        userId,
        15,
        domain,
        'Spark AI Mentor Conversation',
        { sessionId }
      );
      if (resultCarrier && evoResult) {
        resultCarrier.addedXp = evoResult.addedXp;
        resultCarrier.isRankUp = evoResult.isRankUp;
      }
    } catch (err) {
      console.error('[EventBus] Error awarding conversation XP:', err);
    }
  });

  registered = true;
}

export function ensureSubscribersRegistered(): void {
  registerEventSubscribers();
}
