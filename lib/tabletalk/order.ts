import { menu } from './menu.ts';

export type DraftOrder = Record<string, number>;

export type OrderUpdate = { itemId: string; quantity: number; action: 'add' | 'set' | 'remove' };

export function updateOrder(order: DraftOrder, update: OrderUpdate): DraftOrder {
  const item = menu.find((item) => item.id === update.itemId);
  if (!item) throw new Error('That item is not on our menu.');
  if (!Number.isInteger(update.quantity) || update.quantity < 0 || update.quantity > 20)
    throw new Error('Quantity must be a whole number from 0 to 20.');
  const nextQuantity =
    update.action === 'remove'
      ? 0
      : update.action === 'add'
        ? (order[item.id] ?? 0) + update.quantity
        : update.quantity;
  if (nextQuantity > 20) throw new Error('You can add up to 20 of each item.');
  if (!item.available && nextQuantity > 0) throw new Error('That item is currently unavailable.');
  const next = { ...order };
  if (nextQuantity === 0) delete next[item.id];
  else next[item.id] = nextQuantity;
  return next;
}

export function orderSummary(order: DraftOrder) {
  const items = menu
    .filter((item) => order[item.id] > 0)
    .map((item) => ({ ...item, quantity: order[item.id], subtotal: item.price * order[item.id] }));
  return {
    items,
    total: items.reduce((total, item) => total + item.subtotal, 0),
    count: items.reduce((count, item) => count + item.quantity, 0),
    currency: 'NGN',
  };
}
