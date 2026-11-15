import { useEffect } from 'react';
import type { RefObject } from 'react';

/** Calls `handler` on any pointer press outside `ref` or when Escape is pressed. */
export function useClickOutside(ref: RefObject<HTMLElement>, handler: () => void, active = true) {
  useEffect(() => {
    if (!active) return;
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handler();
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, handler, active]);
}
