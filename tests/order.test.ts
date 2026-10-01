import assert from 'node:assert/strict';
import test from 'node:test';

import { searchMenu } from '../lib/tabletalk/menu.ts';
import { updateOrder, orderSummary } from '../lib/tabletalk/order.ts';
import { updateToolSchema } from '../lib/tabletalk/tool-schemas.ts';

test('adds, sets and removes items without mutating the original order', () => {
  const original = { jollof: 1 };
  const added = updateOrder(original, { itemId: 'jollof', action: 'add', quantity: 2 });
  assert.deepEqual(original, { jollof: 1 });
  assert.deepEqual(added, { jollof: 3 });
  const changed = updateOrder(added, { itemId: 'jollof', action: 'set', quantity: 1 });
  assert.deepEqual(changed, { jollof: 1 });
  assert.deepEqual(updateOrder(changed, { itemId: 'jollof', action: 'remove', quantity: 0 }), {});
});
test('totals use menu prices and multiple item quantities', () => {
  const result = orderSummary({ jollof: 2, zobo: 1 });
  assert.equal(result.total, 10500);
  assert.equal(result.count, 3);
  assert.equal(result.currency, 'NGN');
});
test('rejects unknown items, unavailable items and invalid quantities', () => {
  assert.throws(() => updateOrder({}, { itemId: 'invented', action: 'add', quantity: 1 }));
  assert.throws(() => updateOrder({}, { itemId: 'fish', action: 'add', quantity: 1 }));
  for (const quantity of [-1, 0.5, 21, NaN])
    assert.throws(() => updateOrder({}, { itemId: 'jollof', action: 'add', quantity }));
  assert.throws(() =>
    updateOrder({ jollof: 20 }, { itemId: 'jollof', action: 'add', quantity: 1 }),
  );
});
test('search respects dietary, budget, category and text constraints', () => {
  const results = searchMenu({ vegetarian: true, maxPrice: 5000, category: 'Mains' });
  assert.deepEqual(
    results.map((item) => item.id),
    ['jollof', 'beans'],
  );
  assert.deepEqual(
    searchMenu({ query: 'hibiscus' }).map((item) => item.id),
    ['zobo'],
  );
});
test('agent payload rejects prices, totals, invalid actions and noninteger quantities', () => {
  assert.equal(
    updateToolSchema.safeParse({ itemId: 'jollof', action: 'add', quantity: 1, price: 1 }).success,
    false,
  );
  assert.equal(
    updateToolSchema.safeParse({ itemId: 'jollof', action: 'purchase', quantity: 1 }).success,
    false,
  );
  assert.equal(
    updateToolSchema.safeParse({ itemId: 'jollof', action: 'add', quantity: 1.5 }).success,
    false,
  );
});
