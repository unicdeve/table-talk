import assert from 'node:assert/strict';
import test from 'node:test';

import { createTableTalkStore } from '../lib/tabletalk/store.ts';

test('back-to-back order changes build on the latest committed order', () => {
  const store = createTableTalkStore();
  store.changeOrder({ itemId: 'jollof', action: 'add', quantity: 1 });
  const result = store.changeOrder({ itemId: 'jollof', action: 'add', quantity: 2 });
  assert.deepEqual(store.state$.order.get(), { jollof: 3 });
  assert.equal(result.success && result.count, 3);
  assert.equal(store.summary$.get().total, store.summary$.get().items[0].price * 3);
  assert.equal(store.state$.notice.get(), 'Draft order updated.');
});
test('rejected changes keep the order and report the reason', () => {
  const store = createTableTalkStore();
  store.changeOrder({ itemId: 'jollof', action: 'add', quantity: 1 });
  const result = store.changeOrder({ itemId: 'invented', action: 'add', quantity: 1 });
  assert.deepEqual(result, { success: false, error: 'That item is not on our menu.' });
  assert.deepEqual(store.state$.order.get(), { jollof: 1 });
  assert.equal(store.state$.notice.get(), 'That item is not on our menu.');
});
test('clearing empties the order and summary', () => {
  const store = createTableTalkStore();
  store.changeOrder({ itemId: 'zobo', action: 'add', quantity: 2 });
  store.clearOrder();
  assert.deepEqual(store.state$.order.get(), {});
  assert.equal(store.summary$.get().count, 0);
  assert.equal(store.state$.notice.get(), 'Draft order cleared.');
});
test('recommendations highlight items and reset filters without touching the order', () => {
  const store = createTableTalkStore();
  store.state$.menu.assign({ category: 'Drinks', vegetarian: true });
  assert.ok(store.menuItems$.get().every((item) => item.category === 'Drinks'));
  store.showRecommendations(['jollof', 'beans']);
  assert.deepEqual(store.state$.menu.get(), {
    category: 'All',
    vegetarian: false,
    highlighted: ['jollof', 'beans'],
  });
  assert.ok(store.menuItems$.get().some((item) => item.category !== 'Drinks'));
  assert.deepEqual(store.state$.order.get(), {});
});
test('transcript replaces re-sent messages and keeps the latest 100', () => {
  const store = createTableTalkStore();
  store.receiveMessage({ id: 'agent-1', role: 'agent', text: 'Hel' });
  store.receiveMessage({ id: 'agent-1', role: 'agent', text: 'Hello' });
  assert.deepEqual(store.state$.voice.messages.get(), [
    { id: 'agent-1', role: 'agent', text: 'Hello' },
  ]);
  for (let i = 0; i < 105; i++) store.receiveMessage({ id: `user-${i}`, role: 'user', text: 'Hi' });
  const messages = store.state$.voice.messages.get();
  assert.equal(messages.length, 100);
  assert.equal(messages.at(-1)?.id, 'user-104');
});
