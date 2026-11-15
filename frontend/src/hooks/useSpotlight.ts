import { useCallback } from 'react';
import type React from 'react';

/** Feeds the cursor position into --mx/--my so `.glass-card` can paint a following glow. */
export function useSpotlight() {
  return useCallback((e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    el.style.setProperty('--my', `${e.clientY - rect.top}px`);
  }, []);
}
