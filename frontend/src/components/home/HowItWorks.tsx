import React from 'react';
import { m } from 'framer-motion';
import { BellRing, ExternalLink, Search } from 'lucide-react';
import { Stagger } from '../motion/Reveal';
import { fadeUp } from '../motion/variants';

const STEPS = [
  {
    icon: Search,
    title: 'Search every portal at once',
    text: 'One search box and smart filters across GeM, CPP, MSTC and state portals — by item, state, price or closing time.',
    grad: 'from-emerald-500 to-teal-500'
  },
  {
    icon: BellRing,
    title: 'Save lots and set alerts',
    text: 'Bookmark what matters and create alert rules. New matching notices show up in your notifications automatically.',
    grad: 'from-cyan-500 to-sky-500'
  },
  {
    icon: ExternalLink,
    title: 'Bid on the official portal',
    text: 'Every listing links straight to the original notice. We never place bids or ask for your portal credentials.',
    grad: 'from-violet-500 to-indigo-500'
  }
];

export const HowItWorks: React.FC = () => (
  <Stagger className="relative grid md:grid-cols-3 gap-4 sm:gap-6" gap={0.12}>
    {/* connector line (desktop) */}
    <m.div
      aria-hidden
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1.2, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="hidden md:block absolute top-[3.1rem] left-[16%] right-[16%] h-px origin-left bg-gradient-to-r from-emerald-500/50 via-cyan-400/50 to-violet-500/50"
    />
    {STEPS.map((s, i) => {
      const Icon = s.icon;
      return (
        <m.div key={s.title} variants={fadeUp} className="relative rounded-3xl p-6 sm:p-7 glass-card">
          <div className="flex items-center gap-4 mb-5">
            <span className={`relative w-[3.1rem] h-[3.1rem] rounded-2xl bg-gradient-to-br ${s.grad} text-white flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6" />
            </span>
            <span className="font-display text-5xl font-extrabold text-slate-900/[0.07] dark:text-white/[0.08] leading-none select-none">0{i + 1}</span>
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white mb-2">{s.title}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{s.text}</p>
        </m.div>
      );
    })}
  </Stagger>
);
