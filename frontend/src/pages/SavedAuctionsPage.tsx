import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { savedService } from '../services/savedService';
import { useAuth } from '../context/AuthContext';
import { demoLoginEnabled } from '../config/demo';
import { AuctionCard } from '../components/auction/AuctionCard';
import { EmptyState } from '../components/common/EmptyState';
import { AuctionCardSkeleton } from '../components/common/SkeletonLoader';
import { Bookmark, Lock } from 'lucide-react';

export const SavedAuctionsPage: React.FC = () => {
  const { user, loginAsDemo } = useAuth();

  const { data: savedList = [], isLoading } = useQuery({
    queryKey: ['savedAuctionsPage', user?.id],
    queryFn: () => savedService.getSavedAuctions(),
    enabled: !!user,
    staleTime: 10000
  });

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl inline-block text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-none">
          <Lock className="w-8 h-8 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Sign in to Access Saved Watchlist</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Save high-priority auctions to your personal watchlist, monitor status updates, and configure custom alerts.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          {demoLoginEnabled && (
            <button
              onClick={() => loginAsDemo('BUYER')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
            >
              One-Click Demo Buyer
            </button>
          )}
          <Link
            to="/login"
            state={{ from: { pathname: '/saved' } }}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2 shadow-sm dark:shadow-none transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Bookmark className="w-6 h-6 fill-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Saved Auction Watchlist</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Personal monitored collection of bookmarked forward auctions across all portals.
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : savedList.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8 text-slate-500" />}
          title="Your watchlist is empty"
          description="You haven't bookmarked any auctions yet. Click the bookmark icon on any auction card to save it here for fast monitoring."
          actionLabel="Explore Auctions"
          onAction={() => (window.location.href = '/auctions')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedList.map((item) => (
            <AuctionCard key={item.id} auction={item.auction} />
          ))}
        </div>
      )}
    </div>
  );
};
