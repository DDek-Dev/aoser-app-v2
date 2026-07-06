import { createContext, useContext } from 'react';

export const VisibleItemsContext = createContext<Set<string>>(new Set());

export function useIsItemVisible(itemId: string): boolean {
  const visibleIds = useContext(VisibleItemsContext);
  return visibleIds.has(itemId);
}