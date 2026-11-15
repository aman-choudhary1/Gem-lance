import React from 'react';
import { m, useScroll, useSpring } from 'framer-motion';

/** Thin aurora progress bar pinned to the top of the viewport. */
export const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, restDelta: 0.001 });
  return (
    <m.div
      aria-hidden
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] bg-aurora-gradient"
    />
  );
};
