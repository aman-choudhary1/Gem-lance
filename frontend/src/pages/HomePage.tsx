import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auctionService } from '../services/auctionService';
import { sourceService } from '../services/sourceService';
import { StatsTicker } from '../components/dashboard/StatsTicker';
import { PopularCategories } from '../components/dashboard/PopularCategories';
import { EndingSoonRail } from '../components/dashboard/EndingSoonRail';
import { AuctionCard } from '../components/auction/AuctionCard';
import { DisclaimerBanner } from '../components/common/DisclaimerBanner';
import { AuctionCardSkeleton, StatsTickerSkeleton } from '../components/common/SkeletonLoader';
import { Search, Sparkles, ArrowRight, Gavel, Radio, ShieldCheck } from 'lucide-react';

const QUICK_SOURCES = [
  { code: '', label: 'All Sources' },
  { code: 'GEM', label: 'GeM Forward' },
  { code: 'GEM_BIDS', label: 'GeM Bids (BidPlus)' },
  { code: 'MSTC', label: 'MSTC E-Auction' },
  { code: 'BANK', label: 'Bank Auctions' },
  { code: 'PSU', label: 'PSU Portals' },
  { code: 'MOCK', label: 'Simulation Feed' }
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('');

  // Fetch Dashboard Stats
  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['auctionStats'],
    queryFn: () => auctionService.getStats(),
    staleTime: 60000
  });

  // Fetch Categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => sourceService.getCategories(),
    staleTime: 300000
  });

  // Fetch Ending Soon
  const { data: endingSoon = [] } = useQuery({
    queryKey: ['endingSoonHome'],
    queryFn: () => auctionService.getEndingSoon(24, 3),
    staleTime: 30000
  });

  // Fetch Recent Live Auctions
  const { data: recentLive, isLoading: isLiveLoading } = useQuery({
    queryKey: ['recentLiveHome'],
    queryFn: () => auctionService.getAuctions({ status: 'LIVE', limit: 6, sortBy: 'newest' }),
    staleTime: 30000
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set('search', searchTerm.trim());
    if (selectedSource === 'GEM_BIDS') {
      navigate(`/bids?${params.toString()}`);
    } else {
      if (selectedSource) params.set('source', selectedSource);
      navigate(`/auctions?${params.toString()}`);
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Hero Section */}
      <section className="relative pt-8 sm:pt-14 pb-12 rounded-3xl bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 dark:from-slate-900/90 dark:via-slate-900/40 dark:to-transparent border border-slate-200 dark:border-slate-800/80 px-4 sm:px-8 overflow-hidden shadow-sm dark:shadow-none">
        {/* Glow ambient lights */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-3xl mx-auto text-center space-y-4 mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>National Public Procurement & Auction Intelligence Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Discover Government Auctions & GeM Bids Across India
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Real-time multi-portal monitoring for public forward auctions and procurement tenders from GeM, GeM BidPlus, MSTC, PSU disposal yards, and bank repositories.
          </p>
        </div>

        {/* Global Search Box */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="space-y-3">
            <div className="relative flex items-center shadow-xl">
              <div className="absolute left-4 text-slate-400 pointer-events-none">
                <Search className="w-5 h-5 text-emerald-500" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by keyword, vehicle, e-waste, machinery, Raipur, GEM/FA/..."
                className="w-full pl-12 pr-28 py-4 bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-sm sm:text-base transition shadow-sm"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-md shadow-emerald-900/30 flex items-center gap-1.5"
              >
                Search
              </button>
            </div>

            {/* Quick Source Filter Pills */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
              <span className="text-slate-500 font-medium">Quick Filter:</span>
              {QUICK_SOURCES.map((s) => (
                <button
                  type="button"
                  key={s.code}
                  onClick={() => setSelectedSource(s.code)}
                  className={`px-3 py-1 rounded-full transition ${
                    selectedSource === s.code
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/50 font-bold'
                      : 'bg-white/80 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </form>
        </div>
      </section>

      {/* 2. Key Metrics Ticker */}
      <section>
        {isStatsLoading || !stats ? (
          <StatsTickerSkeleton />
        ) : (
          <StatsTicker stats={stats.overview} />
        )}
      </section>

      {/* 3. Statutory Compliance Disclaimer */}
      <section>
        <DisclaimerBanner />
      </section>

      {/* 4. Ending Soon Rail */}
      {endingSoon.length > 0 && (
        <section>
          <EndingSoonRail auctions={endingSoon} />
        </section>
      )}

      {/* 5. Popular Categories Grid */}
      {categories.length > 0 && (
        <section>
          <PopularCategories categories={categories} />
        </section>
      )}

      {/* 6. Live Auctions Showcase */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Live Active Auctions</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">Public bidding lots currently accepting bids on official portals</p>
            </div>
          </div>
          <Link
            to="/auctions?status=LIVE"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            View all live ({stats?.overview.liveAuctions || 0}) <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLiveLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <AuctionCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentLive?.data.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
