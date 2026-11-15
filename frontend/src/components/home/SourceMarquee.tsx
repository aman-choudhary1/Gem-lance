import React from 'react';

const SOURCES = [
  'GeM Forward Auction',
  'GeM BidPlus',
  'CPP Portal',
  'Defence Procurement',
  'MSTC',
  'Maharashtra',
  'Uttar Pradesh',
  'Tamil Nadu',
  'Kerala',
  'Haryana',
  'Punjab',
  'West Bengal',
  'Madhya Pradesh',
  'Rajasthan',
  'Odisha',
  'Chhattisgarh',
  'Himachal Pradesh',
  'Jammu & Kashmir',
  'Delhi',
  'Goa'
];

const DOTS = ['bg-emerald-400', 'bg-cyan-400', 'bg-violet-400', 'bg-amber-400'];

/** Infinite, pausable ticker of the portals the platform aggregates. Duplicated list = seamless loop. */
export const SourceMarquee: React.FC = () => (
  <div className="relative" aria-label="Portals we aggregate">
    <p className="text-center text-[11px] uppercase tracking-[0.22em] font-semibold text-slate-500 dark:text-slate-400 mb-4">Aggregating public notices from</p>
    <div className="marquee-mask overflow-hidden group">
      <div className="flex w-max gap-3 animate-marquee group-hover:[animation-play-state:paused]">
        {[...SOURCES, ...SOURCES].map((name, i) => (
          <span
            key={`${name}-${i}`}
            aria-hidden={i >= SOURCES.length}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap bg-white/70 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${DOTS[i % DOTS.length]}`} />
            {name}
          </span>
        ))}
      </div>
    </div>
  </div>
);
