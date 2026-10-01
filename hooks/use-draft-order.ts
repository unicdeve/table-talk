import { useRef, useState } from 'react';

import {
  type DraftOrder,
  type OrderSummary,
  type OrderUpdate,
  orderSummary,
  updateOrder,
} from '@/lib/tabletalk/order';

export type OrderChangeResult =
  ({ success: true } & OrderSummary) | { success: false; error: string };

export function useDraftOrder() {
  const [order, setOrder] = useState<DraftOrder>({});
  const [notice, setNotice] = useState('');
  // The voice agent can call tools back to back before React re-renders, so each
  // change builds on the latest committed order rather than the last rendered one.
  const latestOrder = useRef(order);

  function commit(next: DraftOrder, message: string) {
    latestOrder.current = next;
    setOrder(next);
    setNotice(message);
  }

  function change(update: OrderUpdate): OrderChangeResult {
    let next: DraftOrder;
    try {
      next = updateOrder(latestOrder.current, update);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not update the order.';
      setNotice(message);
      return { success: false, error: message };
    }
    commit(next, 'Draft order updated.');
    return { success: true, ...orderSummary(next) };
  }

  function clear() {
    commit({}, 'Draft order cleared.');
  }

  return { order, notice, change, clear };
}
