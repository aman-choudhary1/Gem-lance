import React from 'react';
import { m } from 'framer-motion';
import { EASE_OUT, fadeUp, stagger } from './variants';

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}

/** Fades + slides content in once it scrolls into view. */
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, y = 24, className }) => (
  <m.div
    className={className}
    initial={{ opacity: 0, y }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.6, delay, ease: EASE_OUT }}
  >
    {children}
  </m.div>
);

interface StaggerProps {
  children: React.ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
  /** Animate on mount instead of on scroll (use for above-the-fold content). */
  immediate?: boolean;
}

/** Container that staggers any direct <StaggerItem> children. */
export const Stagger: React.FC<StaggerProps> = ({ children, className, gap = 0.07, delay = 0, immediate }) => (
  <m.div
    className={className}
    variants={stagger(gap, delay)}
    initial="hidden"
    {...(immediate ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '-60px' } })}
  >
    {children}
  </m.div>
);

export const StaggerItem: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <m.div className={className} variants={fadeUp}>
    {children}
  </m.div>
);
