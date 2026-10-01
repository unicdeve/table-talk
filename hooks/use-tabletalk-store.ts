import { createContext, use } from 'react';

import type { TableTalkStore } from '@/lib/tabletalk/store';

// Each <TableTalk> mount owns its store, so server renders never share client state.
export const TableTalkStoreContext = createContext<TableTalkStore | null>(null);

export function useTableTalkStore() {
  const store = use(TableTalkStoreContext);
  if (!store) throw new Error('useTableTalkStore must be used inside <TableTalk>.');

  return store;
}
