import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { savedService } from '../services/savedService';
import { useAuth } from '../context/AuthContext';
import { demoLoginEnabled } from '../config/demo';
import { AuctionCard } from '../components/auction/AuctionCard';
import { EmptyState } from '../components/common/EmptyState';
import { AuctionCardSkeleton } from '../components/common/SkeletonLoader';
import { PageHeader } from '../components/ui/PageHeader';
import { stagger } from '../components/motion/variants';
import { Bookmark, Lock } from 'lucide-react';

export const SavedAuctionsPage: React.FC = () => {
  const { user, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const { data: savedList = [], isLoading } = useQuery({
    queryKey: ['savedAuctionsPage', user?.id],
    queryFn: () => savedService.getSavedAuctions(),
    enabled: !!user,
    staleTime: 10000
  });

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Sign in to see your watchlist</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Save notices, track their deadlines and get alerts when similar ones appear.</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/login" state={{ from: { pathname: '/saved' } }} className="btn-primary">
            Sign in
          </Link>
          {demoLoginEnabled && (
            <button onClick={() => loginAsDemo('BUYER')} className="btn-ghost border border-slate-200 dark:border-white/10">
              Try demo buyer
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Bookmark className="w-6 h-6 fill-white/90" />}
        eyebrow="Your watchlist"
        title="Saved notices"
        description="Notices you have bookmarked across all portals. Keep an eye on the closing countdowns."
        tone="from-emerald-500 to-teal-500"
        actions={
          !isLoading && (
            <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
              {savedList.length} saved
            </span>
          )
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : savedList.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8 text-emerald-500" />}
          title="Your watchlist is empty"
          description="Tap the bookmark on any notice to save it here for quick access."
          actionLabel="Explore auctions"
          onAction={() => navigate('/auctions')}
        />
      ) : (
        <m.div variants={stagger(0.04)} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedList.map((item) => (
            <AuctionCard key={item.id} auction={item.auction} />
          ))}
        </m.div>
      )}
    </div>
  );
};
