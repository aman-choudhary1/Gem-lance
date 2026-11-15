import type { Variants, Transition } from 'framer-motion';

export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const spring: Transition = { type: 'spring', stiffness: 380, damping: 30 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } }
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4 } }
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.45, ease: EASE_OUT } }
};

export const stagger = (gap = 0.07, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } }
});
