import React, { useEffect, useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'framer-motion';

interface RotatingWordProps {
  words: string[];
  interval?: number;
  className?: string;
}

/** Cycles through words with a blur/slide transition. Width is reserved by the longest word. */
export const RotatingWord: React.FC<RotatingWordProps> = ({ words, interval = 2600, className }) => {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || words.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval, reduce]);

  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '');

  return (
    <span className="relative inline-grid justify-items-center align-bottom overflow-hidden" aria-live="polite">
      {/* invisible sizer so the layout never jumps */}
      <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden>
        {longest}
      </span>
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={words[index]}
          className={`col-start-1 row-start-1 whitespace-nowrap ${className ?? ''}`}
          initial={{ y: '70%', opacity: 0, filter: 'blur(6px)' }}
          animate={{ y: '0%', opacity: 1, filter: 'blur(0px)' }}
          exit={{ y: '-70%', opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {words[index]}
        </m.span>
      </AnimatePresence>
    </span>
  );
};
