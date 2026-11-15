import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { DashboardStats } from '../../types';
import { AnimatedNumber } from '../motion/AnimatedNumber';
import { Stagger } from '../motion/Reveal';
import { fadeUp } from '../motion/variants';
import { useSpotlight } from '../../hooks/useSpotlight';
import { Gavel, Radio, Timer, Sparkles } from 'lucide-react';

interface StatsTickerProps {
  stats: DashboardStats['overview'];
}

export const StatsTicker: React.FC<StatsTickerProps> = ({ stats }) => {
  const onPointerMove = useSpotlight();

  const items = [
    { label: 'Total listings', value: stats.totalAuctions, icon: Gavel, to: '/auctions', grad: 'from-emerald-500 to-teal-500' },
    { label: 'Live right now', value: stats.liveAuctions, icon: Radio, to: '/auctions?status=LIVE', grad: 'from-cyan-500 to-sky-500', live: true },
    { label: 'Closing in 24 hours', value: stats.ending24HoursAuctions ?? stats.endingTodayAuctions, icon: Timer, to: '/ending-soon', grad: 'from-amber-500 to-rose-500' },
    { label: 'Added today', value: stats.newTodayAuctions, icon: Sparkles, to: '/auctions?sortBy=newest', grad: 'from-violet-500 to-indigo-500' }
  ];

  return (
    <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" gap={0.08}>
      {items.map((it) => {
        const Icon = it.icon;
        return (
          <m.div key={it.label} variants={fadeUp} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}>
            <Link to={it.to} onPointerMove={onPointerMove} className="glass-card block rounded-2xl p-4 sm:p-5 group">
              <div className="flex items-start justify-between">
                <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${it.grad} text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </span>
                {it.live && it.value > 0 && (
                  <span className="relative flex h-2.5 w-2.5 mt-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                )}
              </div>
              <div className="mt-4 font-display text-3xl sm:text-[2rem] font-extrabold text-slate-900 dark:text-white tabular-nums">
                <AnimatedNumber value={it.value} />
              </div>
              <div className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{it.label} →</div>
            </Link>
          </m.div>
        );
      })}
    </Stagger>
  );
};
