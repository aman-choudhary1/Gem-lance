import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { Clock, Flame, RefreshCw, Zap } from 'lucide-react';
import { auctionService } from '../services/auctionService';
import { AuctionCard } from '../components/auction/AuctionCard';
import { AuctionCardSkeleton } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import { AnimatedNumber } from '../components/motion/AnimatedNumber';
import { stagger } from '../components/motion/variants';

const TIME_WINDOWS = [
  { hours: 1, label: '1 hour' },
  { hours: 6, label: '6 hours' },
  { hours: 24, label: '24 hours' },
  { hours: 72, label: '3 days' }
];

export const EndingSoonPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedHours, setSelectedHours] = useState(24);

  const { data: auctions = [], isLoading, isFetching, dataUpdatedAt } = useQuery({
    queryKey: ['endingSoonPage', selectedHours],
    queryFn: () => auctionService.getEndingSoon(selectedHours, 50),
    staleTime: 15000,
    refetchInterval: 30000 // countdown pages should stay fresh without a manual reload
  });

  const windowLabel = TIME_WINDOWS.find((w) => w.hours === selectedHours)?.label ?? `${selectedHours} hours`;

  return (
    <div className="space-y-6 pb-8">
      <section className="relative rounded-3xl gradient-border">
        <div className="inner relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8">
          <div className="pointer-events-none absolute -top-24 -right-16 w-80 h-80 rounded-full bg-gradient-to-br from-amber-500 to-rose-500 opacity-20 blur-3xl" aria-hidden />
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-lg shrink-0">
                <Flame className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Ending soon</h1>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed">
                  Live notices closing within your chosen window, soonest first, with real-time countdowns. Don't miss a deadline.
                </p>
              </div>
            </div>

            <div role="tablist" aria-label="Closing window" className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/[0.05] dark:bg-white/[0.06] w-max max-w-full overflow-x-auto no-scrollbar">
              {TIME_WINDOWS.map((w) => {
                const on = w.hours === selectedHours;
                return (
                  <button
                    key={w.hours}
                    role="tab"
                    aria-selected={on}
                    onClick={() => setSelectedHours(w.hours)}
                    className={`relative shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${on ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    {on && <m.span layoutId="ending-window" className="absolute inset-0 rounded-lg bg-white dark:bg-slate-700/80 shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <Clock className={`relative w-3.5 h-3.5 ${on ? 'text-amber-500' : ''}`} />
                    <span className="relative">{w.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400" aria-live="polite">
        <span>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{isLoading ? '…' : <AnimatedNumber value={auctions.length} duration={0.7} />}</span> closing in the next {windowLabel}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin text-emerald-500' : ''}`} />
          {dataUpdatedAt ? `Updated ${new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Updating…'}
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <EmptyState
          icon={<Zap className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
          title="Nothing closing in this window"
          description={`No live notices end within the next ${windowLabel}. Try a wider window, or browse everything that's open.`}
          actionLabel="Browse live auctions"
          onAction={() => navigate('/auctions?status=LIVE')}
        />
      ) : (
        <m.div key={selectedHours} variants={stagger(0.04)} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </m.div>
      )}

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Want the full list with filters? <Link to="/auctions?status=LIVE,ENDING_SOON&sortBy=endingSoon" className="font-semibold text-emerald-600 dark:text-emerald-300 hover:underline">Open the explorer</Link>.
      </p>
    </div>
  );
};
