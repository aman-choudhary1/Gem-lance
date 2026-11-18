import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const COMPARE_MAX = 4;
const STORAGE_KEY = 'auctionlens_compare';

export interface CompareItem {
  id: string;
  externalId: string;
  title: string;
}

interface CompareContextType {
  items: CompareItem[];
  has: (id: string) => boolean;
  isFull: boolean;
  /** Returns false when the list is already full and the item was not added. */
  toggle: (item: CompareItem) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const read = (): CompareItem[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed)
      ? parsed.filter((i) => i && typeof i.id === 'string' && typeof i.externalId === 'string').slice(0, COMPARE_MAX)
      : [];
  } catch {
    return [];
  }
};

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CompareItem[]>(read);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable: comparison still works for this tab */
    }
  }, [items]);

  const toggle = useCallback((item: CompareItem) => {
    let added = true;
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev.filter((i) => i.id !== item.id);
      if (prev.length >= COMPARE_MAX) {
        added = false;
        return prev;
      }
      return [...prev, { id: item.id, externalId: item.externalId, title: item.title }];
    });
    return added;
  }, []);

  const value = useMemo<CompareContextType>(
    () => ({
      items,
      has: (id) => items.some((i) => i.id === id),
      isFull: items.length >= COMPARE_MAX,
      toggle,
      remove: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
      clear: () => setItems([])
    }),
    [items, toggle]
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('useCompare must be used within a CompareProvider');
  return ctx;
};
