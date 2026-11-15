import React from 'react';
import { m } from 'framer-motion';
import { fadeUp } from '../motion/variants';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
  /** tailwind gradient stops for the icon tile */
  tone?: string;
}

/** Hero banner shared by every inner page. */
export const PageHeader: React.FC<PageHeaderProps> = ({ icon, title, description, eyebrow, actions, tone = 'from-emerald-500 to-cyan-500' }) => (
  <m.section variants={fadeUp} initial="hidden" animate="show" className="relative rounded-3xl gradient-border">
    <div className="inner relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8">
      <div aria-hidden className={`pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-gradient-to-br ${tone} opacity-20 blur-3xl`} />
      <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="flex items-start gap-4 min-w-0">
          <span className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tone} text-white flex items-center justify-center shadow-lg shrink-0`}>{icon}</span>
          <div className="min-w-0">
            {eyebrow && <div className="text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-1">{eyebrow}</div>}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">{title}</h1>
            {description && <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  </m.section>
);
