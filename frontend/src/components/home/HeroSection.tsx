import React, { Suspense, lazy, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, BellRing, Search, ShieldCheck, Sparkles, Timer } from 'lucide-react';
import { Auction } from '../../types';
import { RotatingWord } from '../motion/RotatingWord';
import { CountdownTimer } from '../common/CountdownTimer';
import { fadeUp, stagger } from '../motion/variants';
import { decodeHtmlEntities, formatCompactTenderPrice } from '../../utils/formatters';

// The particle engine is split into its own chunk and loaded after first paint.
const ParticlesBackground = lazy(() => import('../effects/ParticlesBackground'));

const WORDS = ['vehicles', 'scrap & metal', 'machinery', 'property', 'IT equipment', 'furniture'];

const POPULAR = [
  { label: 'Vehicles', search: 'vehicle' },
  { label: 'Scrap', search: 'scrap' },
  { label: 'Machinery', search: 'machine' },
  { label: 'E-waste', search: 'e-waste' },
  { label: 'Land & property', search: 'land' }
];

interface HeroSectionProps {
  totalSources?: number;
  liveCount?: number;
  /** Real lots shown as floating preview cards on wide screens. */
  featured?: Auction[];
}

type SearchMode = 'auctions' | 'bids';

export const HeroSection: React.FC<HeroSectionProps> = ({ totalSources, liveCount, featured = [] }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('auctions');

  const go = (search: string, m: SearchMode = mode) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    navigate(`/${m === 'bids' ? 'bids' : 'auctions'}${params.toString() ? `?${params}` : ''}`);
  };

  const [a, b] = featured;

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-slate-200/80 dark:border-white/[0.08] bg-gradient-to-b from-white/80 to-white/40 dark:from-slate-900/70 dark:to-slate-950/40 backdrop-blur-sm">
      {/* ambient layers */}
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60rem] h-[34rem] rounded-full bg-gradient-to-r from-emerald-500/25 via-cyan-400/20 to-violet-500/25 blur-3xl animate-aurora-drift" />
        <Suspense fallback={null}>
          <ParticlesBackground id="hero-particles" count={60} />
        </Suspense>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/70 dark:from-slate-950/70 to-transparent" />
      </div>

      {/* floating real-data preview cards (wide screens only) */}
      {a && <FloatingLot auction={a} className="hidden 2xl:block absolute left-8 top-32 w-64 animate-float-slow" />}
      {b && <FloatingLot auction={b} className="hidden 2xl:block absolute right-8 top-48 w-64 animate-float [animation-delay:-2.5s]" />}

      <m.div variants={stagger(0.09, 0.05)} initial="hidden" animate="show" className="relative px-5 sm:px-10 pt-14 sm:pt-20 pb-20 sm:pb-24 max-w-4xl mx-auto text-center">
        <m.div variants={fadeUp} className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          {totalSources ? `${totalSources} portals tracked` : 'Government auction intelligence'}
          {liveCount ? <span className="opacity-60">·</span> : null}
          {liveCount ? <span>{liveCount.toLocaleString('en-IN')} live now</span> : null}
        </m.div>

        <m.h1 variants={fadeUp} className="mt-6 text-[1.95rem] leading-[1.1] sm:text-6xl font-extrabold text-slate-900 dark:text-white">
          Find government{' '}
          <span className="block sm:inline">
            <RotatingWord words={WORDS} className="text-gradient pb-1" />
          </span>{' '}
          auctions
          <span className="block">& bids across India</span>
        </m.h1>

        <m.p variants={fadeUp} className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Search public notices from GeM, CPP, MSTC and state portals in one place. Filter, save, set alerts — then bid on the official site.
        </m.p>

        {/* Smart search */}
        <m.div variants={fadeUp} className="mt-9 max-w-2xl mx-auto">
          <div className="gradient-border !rounded-[1.4rem] shadow-glow-lg">
            <div className="inner !rounded-[calc(1.4rem-1px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-2">
              <div role="tablist" aria-label="Search in" className="flex items-center gap-1 p-1 mb-1.5 w-max rounded-xl bg-slate-900/[0.05] dark:bg-white/[0.06]">
                {([['auctions', 'Auctions'], ['bids', 'GeM Bids']] as const).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={mode === v}
                    onClick={() => setMode(v)}
                    className={`relative px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${mode === v ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    {mode === v && <m.span layoutId="hero-mode" className="absolute inset-0 rounded-lg bg-white dark:bg-slate-700 shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span className="relative">{label}</span>
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  go(query);
                }}
                role="search"
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-emerald-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-label="Search auctions and bids"
                    placeholder={mode === 'bids' ? 'Laptop, ambulance, ministry, bid number…' : 'Vehicle, scrap, machinery, city, lot ID…'}
                    className="w-full pl-12 pr-3 py-4 rounded-2xl bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
                  />
                </div>
                <button type="submit" className="btn-primary !rounded-2xl !px-5 sm:!px-7 !py-3.5 shrink-0">
                  Search <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Popular:</span>
            {POPULAR.map((p) => (
              <m.button
                key={p.label}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => go(p.search, 'auctions')}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/70 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 hover:text-emerald-700 dark:hover:text-emerald-300 backdrop-blur transition-colors"
              >
                {p.label}
              </m.button>
            ))}
          </div>
        </m.div>

        {/* Trust row */}
        <m.ul variants={fadeUp} className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-600 dark:text-slate-400">
          {[
            { icon: ShieldCheck, text: 'Public notices only' },
            { icon: BellRing, text: 'In-app alerts for new matches' },
            { icon: Timer, text: 'Live closing countdowns' },
            { icon: Sparkles, text: 'No bidding on our site' }
          ].map(({ icon: I, text }) => (
            <li key={text} className="flex items-center gap-2">
              <I className="w-4 h-4 text-emerald-500" />
              {text}
            </li>
          ))}
        </m.ul>
      </m.div>
    </section>
  );
};

const FloatingLot: React.FC<{ auction: Auction; className?: string }> = ({ auction, className = '' }) => (
  <Link
    to={`/auctions/${encodeURIComponent(auction.externalId)}`}
    className={`${className} text-left rounded-2xl p-3.5 glass-panel shadow-glow-lg hover:scale-[1.03] transition-transform`}
    aria-label={`Preview: ${decodeHtmlEntities(auction.title)}`}
  >
    <div className="flex items-center justify-between mb-2">
      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[8rem]">{auction.source.code}</span>
      <CountdownTimer endTime={auction.endTime} showIcon={false} className="!text-[10px]" />
    </div>
    <div className="text-[13px] font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">{decodeHtmlEntities(auction.title)}</div>
    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
      <span className="truncate">{auction.location?.state && auction.location.state !== 'Not Specified' ? auction.location.state : 'India'}</span>
      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatCompactTenderPrice(auction.startPrice)}</span>
    </div>
  </Link>
);
