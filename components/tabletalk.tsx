'use client';

import { useState } from 'react';

import { type CategoryFilter, MenuSection } from '@/components/menu-section';
import { OrderPanel } from '@/components/order-panel';
import VoiceAssistant from '@/components/voice-assistant';
import { useDraftOrder } from '@/hooks/use-draft-order';
import { searchMenu } from '@/lib/tabletalk/menu';
import { orderSummary } from '@/lib/tabletalk/order';

export default function TableTalk() {
  const { order, notice, change, clear } = useDraftOrder();
  const [category, setCategory] = useState<CategoryFilter>('All');
  const [vegetarian, setVegetarian] = useState(false);
  const [highlighted, setHighlighted] = useState<string[]>([]);

  const summary = orderSummary(order);
  const items = searchMenu({ category: category === 'All' ? undefined : category, vegetarian });

  function showRecommendations(ids: string[]) {
    setHighlighted(ids);
    // Clear filters so every recommended item is visible.
    setCategory('All');
    setVegetarian(false);
  }

  return (
    <main className="mx-auto flex max-w-344 flex-col gap-6 px-5 py-6.25 md:grid md:grid-cols-[minmax(0,1fr)_315px] md:gap-5.5 md:px-7 md:pt-9.5 md:pb-7.5 lg:grid-cols-[minmax(0,1fr)_355px] lg:gap-8.5">
      <MenuSection
        items={items}
        highlighted={highlighted}
        category={category}
        vegetarian={vegetarian}
        onCategoryChange={setCategory}
        onVegetarianChange={setVegetarian}
        onAdd={(item) => change({ itemId: item.id, quantity: 1, action: 'add' })}
      />
      {/* On mobile the aside dissolves so the voice panel can sit above the menu. */}
      <aside className="contents md:flex md:flex-col md:gap-5">
        <VoiceAssistant
          order={order}
          onUpdate={change}
          onHighlight={showRecommendations}
          className="-order-1 md:order-0"
        />
        <OrderPanel
          summary={summary}
          notice={notice}
          onChange={change}
          onClear={clear}
          className="order-1 md:order-0"
        />
      </aside>
    </main>
  );
}
