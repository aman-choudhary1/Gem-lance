import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowRight, CalendarClock, FileText, Flame, Radio, TrendingUp } from 'lucide-react';
import { auctionService } from '../../services/auctionService';
import { Auction } from '../../types';
import { AuctionCard } from '../auction/AuctionCard';
import { AuctionCardSkeleton } from '../common/SkeletonLoader';
import { stagger } from '../motion/variants';

interface Tab {
  id: string;
  label: string;
  hint: string;
  icon: React.ElementType;
  /** Where "View all" goes. */
  to: string;
  fetch: () => Promise<Auction[]>;
}

const TABS: Tab[] = [
  {
    id: 'live',
    label: 'Live auctions',
    hint: 'Open for bidding right now',
    icon: Radio,
    to: '/auctions?status=LIVE',
    fetch: async () => (await auctionService.getAuctions({ status: 'LIVE,ENDING_SOON', sortBy: 'newest', limit: 6 })).data
  },
  {
    id: 'ending',
    label: 'Ending soon',
    hint: 'Closing within 24 hours',
    icon: Flame,
    to: '/ending-soon',
    fetch: () => auctionService.getEndingSoon(24, 6)
  },
  {
    id: 'bids',
    label: 'Latest bids',
    hint: 'Newest GeM procurement bids',
    icon: FileText,
    to: '/bids',
    fetch: async () => (await auctionService.getAuctions({ source: 'GEM_BIDS', status: 'LIVE,ENDING_SOON', sortBy: 'newest', limit: 6 })).data
  },
  {
    id: 'value',
    label: 'High value',
    hint: 'Largest published prices',
    icon: TrendingUp,
    to: '/auctions?status=LIVE,ENDING_SOON&sortBy=highestPrice',
    fetch: async () => (await auctionService.getAuctions({ status: 'LIVE,ENDING_SOON', sortBy: 'highestPrice', limit: 6 })).data
  },
  {
    id: 'upcoming',
    label: 'Starting soon',
    hint: 'Opening in the coming days',
    icon: CalendarClock,
    to: '/auctions?status=UPCOMING',
    fetch: async () => (await auctionService.getAuctions({ status: 'UPCOMING', sortBy: 'newest', limit: 6 })).data
  }
];

/**
 * Tabbed discovery: one click switches between the lists people actually want
 * (live, closing soon, latest bids, high value, upcoming).
 */
export const DiscoverTabs: React.FC = () => {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['discover', tab.id],
    queryFn: tab.fetch,
    staleTime: 30000
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div role="tablist" aria-label="Discover" className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-900/[0.05] dark:bg-white/[0.05] overflow-x-auto no-scrollbar max-w-full">
          {TABS.map((t) => {
            const on = t.id === active;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                role="tab"
                id={`tab-${t.id}`}
                aria-selected={on}
                aria-controls="discover-panel"
                onClick={() => setActive(t.id)}
                className={`relative shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${on ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
              >
                {on && <m.span layoutId="discover-pill" className="absolute inset-0 rounded-xl bg-white dark:bg-slate-700/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                <Icon className={`relative w-4 h-4 ${on ? 'text-emerald-500' : ''}`} />
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>

        <Link to={tab.to} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-300 shrink-0">
          View all {tab.label.toLowerCase()}
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 -mt-2">{tab.hint}</p>

      <div id="discover-panel" role="tabpanel" aria-labelledby={`tab-${tab.id}`} className="min-h-[26rem]">
        <AnimatePresence mode="wait" initial={false}>
          <m.div key={tab.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <AuctionCardSkeleton key={i} />
                ))}
              </div>
            ) : isError ? (
              <div className="rounded-2xl p-10 text-center glass-panel">
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Couldn't load this list.</p>
                <button onClick={() => refetch()} className="btn-primary">Try again</button>
              </div>
            ) : !data || data.length === 0 ? (
              <div className="rounded-2xl p-12 text-center glass-panel">
                <p className="font-display font-bold text-slate-900 dark:text-white mb-1">Nothing here right now</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">New notices appear as portals publish them.</p>
                <Link to="/auctions" className="btn-primary">Browse all auctions</Link>
              </div>
            ) : (
              <m.div variants={stagger(0.06)} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.slice(0, 6).map((a) => (
                  <AuctionCard key={a.id} auction={a} />
                ))}
              </m.div>
            )}
          </m.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
