import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { ArrowRight, Building2, FileText, Layers } from 'lucide-react';
import { auctionService } from '../../services/auctionService';
import { CountdownTimer } from '../common/CountdownTimer';
import { Reveal, Stagger } from '../motion/Reveal';
import { fadeUp } from '../motion/variants';
import { decodeHtmlEntities } from '../../utils/formatters';

/** Dedicated section for GeM procurement bids: a pitch on the left, the newest open bids as compact rows on the right. */
export const BidsSpotlight: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['bidsSpotlight'],
    queryFn: () => auctionService.getAuctions({ source: 'GEM_BIDS', status: 'LIVE,ENDING_SOON', sortBy: 'endingSoon', limit: 5 }),
    staleTime: 30000
  });
  const bids = data?.data ?? [];
  const total = data?.pagination.total ?? 0;

  return (
    <section className="relative overflow-hidden rounded-[2rem] gradient-border">
      <div className="inner grid lg:grid-cols-5 gap-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <Reveal className="lg:col-span-2 relative p-7 sm:p-10 flex flex-col justify-between gap-8 overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-gradient-to-br from-teal-500/30 to-sky-500/20 blur-3xl" aria-hidden />
          <div className="relative space-y-4">
            <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-sky-500 text-white flex items-center justify-center shadow-glow">
              <FileText className="w-6 h-6" />
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">Sell to the government?<br />Start with open bids.</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              Browse GeM procurement bids and reverse auctions by item, ministry or state — sorted by what closes first so you never miss a deadline.
            </p>
          </div>
          <div className="relative flex flex-wrap items-center gap-3">
            <Link to="/bids" className="btn-primary">
              Explore {total > 0 ? `${total.toLocaleString('en-IN')} ` : ''}open bids <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/alerts" className="btn-ghost border border-slate-200 dark:border-white/10">Get bid alerts</Link>
          </div>
        </Reveal>

        <div className="lg:col-span-3 p-4 sm:p-6 lg:border-l border-slate-200/70 dark:border-white/[0.07]">
          <div className="flex items-center justify-between px-2 pb-3">
            <h3 className="font-display font-bold text-slate-900 dark:text-white">Closing soonest</h3>
            <Link to="/bids?sortBy=endingSoon" className="text-xs font-semibold text-emerald-600 dark:text-emerald-300 hover:underline">See all</Link>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-[4.5rem] rounded-2xl bg-slate-200/70 dark:bg-white/[0.05] relative overflow-hidden">
                  <span className="absolute inset-0 shimmer" />
                </div>
              ))}
            </div>
          ) : bids.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-500 dark:text-slate-400">No open bids at the moment.</div>
          ) : (
            <Stagger className="space-y-2" gap={0.06}>
              {bids.map((b) => (
                <m.div key={b.id} variants={fadeUp}>
                  <Link
                    to={`/auctions/${encodeURIComponent(b.externalId)}`}
                    className="group flex items-center gap-4 p-3.5 rounded-2xl border border-transparent hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] transition-colors"
                  >
                    <span className="hidden sm:flex w-10 h-10 rounded-xl bg-slate-900/5 dark:bg-white/[0.06] items-center justify-center text-slate-500 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors shrink-0">
                      <Layers className="w-5 h-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                        {decodeHtmlEntities(b.title)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 min-w-0">
                        <Building2 className="w-3 h-3 shrink-0" />
                        <span className="truncate">{decodeHtmlEntities(b.organization?.name || 'Government of India')}</span>
                      </span>
                    </span>
                    <CountdownTimer endTime={b.endTime} className="shrink-0" />
                  </Link>
                </m.div>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </section>
  );
};
