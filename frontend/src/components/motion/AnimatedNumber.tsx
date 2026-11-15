import React, { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

/** Counts up from 0 to `value` the first time it scrolls into view. */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 1.4, className, suffix }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setDisplay(Math.round(v))
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {display.toLocaleString('en-IN')}
      {suffix}
    </span>
  );
};
