import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auctionService } from '../services/auctionService';
import { AuctionCard } from '../components/auction/AuctionCard';
import { AuctionCardSkeleton } from '../components/common/SkeletonLoader';
import { EmptyState } from '../components/common/EmptyState';
import { Clock, Flame, Zap } from 'lucide-react';

const TIME_WINDOWS = [
  { hours: 1, label: 'Next 1 Hour' },
  { hours: 6, label: 'Next 6 Hours' },
  { hours: 24, label: 'Next 24 Hours' },
  { hours: 72, label: 'Next 3 Days' }
];

export const EndingSoonPage: React.FC = () => {
  const [selectedHours, setSelectedHours] = useState(24);

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['endingSoonPage', selectedHours],
    queryFn: () => auctionService.getEndingSoon(selectedHours, 50),
    staleTime: 15000
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/20 p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-2xl">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Ending Soon Auctions</h1>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Live government forward auctions approaching immediate closing deadlines with real-time countdown clocks.
            </p>
          </div>
        </div>

        {/* Time Window Tabs */}
        <div className="flex items-center gap-2 flex-wrap pt-2">
          {TIME_WINDOWS.map((w) => (
            <button
              key={w.hours}
              onClick={() => setSelectedHours(w.hours)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                selectedHours === w.hours
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-900/40'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {w.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <EmptyState
          icon={<Zap className="w-8 h-8 text-amber-600 dark:text-amber-400" />}
          title="No auctions closing in this timeframe"
          description={`There are currently no live forward auctions ending within the selected window (${selectedHours} hours). Select a wider window to view upcoming deadlines.`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {auctions.map((auction) => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      )}
    </div>
  );
};
