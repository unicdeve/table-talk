'use client';

import { useState } from 'react';

import { MenuSection } from '@/components/menu-section';
import { OrderPanel } from '@/components/order-panel';
import VoiceAssistant from '@/components/voice-assistant';
import { TableTalkStoreContext } from '@/hooks/use-tabletalk-store';
import { createTableTalkStore } from '@/lib/tabletalk/store';

export default function TableTalk() {
  const [store] = useState(createTableTalkStore);

  return (
    <TableTalkStoreContext value={store}>
      <main className="mx-auto flex max-w-344 flex-col gap-6 px-5 py-6.25 md:grid md:grid-cols-[minmax(0,1fr)_315px] md:gap-5.5 md:px-7 md:pt-9.5 md:pb-7.5 lg:grid-cols-[minmax(0,1fr)_355px] lg:gap-8.5">
        <MenuSection />
        {/* On mobile the aside dissolves so the voice panel can sit above the menu. */}
        <aside className="contents md:flex md:flex-col md:gap-5">
          <VoiceAssistant className="-order-1 md:order-0" />
          <OrderPanel className="order-1 md:order-0" />
        </aside>
      </main>
    </TableTalkStoreContext>
  );
}
