import React, { useMemo } from 'react';
import { Particles, ParticlesProvider } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';
import { useReducedMotion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

interface ParticlesBackgroundProps {
  id: string;
  /** Particle count at a 900x900 reference area. */
  count?: number;
  className?: string;
  /** Let particles react to the cursor (grab lines). */
  interactive?: boolean;
  /** Force the dark palette (for panels that are always dark, regardless of the site theme). */
  tone?: 'auto' | 'dark';
}

/**
 * Network-style particle field (tsparticles). Theme-aware, disabled for users who prefer reduced
 * motion, and sparser on small screens. Import it lazily — it pulls in the particle engine.
 */
const ParticlesBackground: React.FC<ParticlesBackgroundProps> = ({
  id,
  count = 55,
  className = 'absolute inset-0',
  interactive = true,
  tone = 'auto'
}) => {
  const { theme } = useTheme();
  const reduceMotion = useReducedMotion();
  const isSmall = typeof window !== 'undefined' && window.innerWidth < 640;

  const options = useMemo<ISourceOptions>(() => {
    const dark = tone === 'dark' || theme === 'dark';
    const dot = dark ? ['#34d3a0', '#22d3ee', '#a78bfa'] : ['#059669', '#0891b2', '#7c3aed'];
    const line = dark ? '#34d3a0' : '#059669';
    return {
      fullScreen: { enable: false },
      background: { color: { value: 'transparent' } },
      fpsLimit: 60,
      detectRetina: true,
      pauseOnBlur: true,
      interactivity: {
        detectsOn: 'window',
        events: {
          onHover: { enable: interactive, mode: 'grab' },
          resize: { enable: true }
        },
        modes: { grab: { distance: 170, links: { opacity: dark ? 0.55 : 0.4 } } }
      },
      particles: {
        number: { value: isSmall ? Math.round(count * 0.45) : count, density: { enable: true, width: 900, height: 900 } },
        color: { value: dot },
        links: { enable: true, color: line, distance: 140, opacity: dark ? 0.16 : 0.18, width: 1 },
        move: { enable: true, speed: 0.55, direction: 'none', outModes: { default: 'out' } },
        opacity: { value: { min: dark ? 0.25 : 0.3, max: dark ? 0.7 : 0.65 } },
        size: { value: { min: 1, max: 2.6 } }
      }
    };
  }, [theme, tone, count, interactive, isSmall]);

  if (reduceMotion) return null;

  return (
    <ParticlesProvider init={async (engine) => { await loadSlim(engine); }}>
      <Particles id={id} className={className} options={options} />
    </ParticlesProvider>
  );
};

export default ParticlesBackground;
