import { batch, observable } from '@legendapp/state';

import { type Category, searchMenu } from './menu.ts';
import {
  type DraftOrder,
  type OrderSummary,
  type OrderUpdate,
  orderSummary,
  updateOrder,
} from './order.ts';

export type CategoryFilter = Category | 'All';

export type TranscriptMessage = { id: string; role: 'user' | 'agent'; text: string };

export type OrderChangeResult =
  ({ success: true } & OrderSummary) | { success: false; error: string };

export type TableTalkStore = ReturnType<typeof createTableTalkStore>;

const TRANSCRIPT_LIMIT = 100;

/**
 * Client state for one TableTalk workspace. Observables update synchronously, so the voice
 * agent's back-to-back tool calls always build on the latest committed order, never on the
 * last rendered one.
 */
export function createTableTalkStore() {
  const state$ = observable({
    order: {} as DraftOrder,
    notice: '',
    menu: { category: 'All' as CategoryFilter, vegetarian: false, highlighted: [] as string[] },
    voice: { messages: [] as TranscriptMessage[], error: '', starting: false, accessCode: '' },
  });

  const summary$ = observable(() => orderSummary(state$.order.get()));

  const menuItems$ = observable(() => {
    const { category, vegetarian } = state$.menu.get();
    return searchMenu({ category: category === 'All' ? undefined : category, vegetarian });
  });

  function commitOrder(next: DraftOrder, message: string) {
    batch(() => {
      state$.order.set(next);
      state$.notice.set(message);
    });
  }

  function changeOrder(update: OrderUpdate): OrderChangeResult {
    let next: DraftOrder;
    try {
      next = updateOrder(state$.order.peek(), update);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update the order.';
      state$.notice.set(message);
      return { success: false, error: message };
    }

    commitOrder(next, 'Draft order updated.');

    return { success: true, ...orderSummary(next) };
  }

  function clearOrder() {
    commitOrder({}, 'Draft order cleared.');
  }

  function showRecommendations(ids: string[]) {
    // Clear filters so every recommended item is visible.
    state$.menu.set({ category: 'All', vegetarian: false, highlighted: ids });
  }

  function receiveMessage(message: TranscriptMessage) {
    state$.voice.messages.set(upsertMessage(state$.voice.messages.peek(), message));
  }

  return {
    state$,
    summary$,
    menuItems$,
    changeOrder,
    clearOrder,
    showRecommendations,
    receiveMessage,
  };
}

/** Replace a message that the SDK re-sent with the same event ID, otherwise append it. */
function upsertMessage(current: TranscriptMessage[], next: TranscriptMessage) {
  const index = current.findIndex((item) => item.id === next.id);
  const messages =
    index >= 0 ? current.map((item, i) => (i === index ? next : item)) : [...current, next];
    
  return messages.slice(-TRANSCRIPT_LIMIT);
}
