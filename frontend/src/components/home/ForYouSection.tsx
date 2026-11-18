import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { BellRing, Bookmark, Sparkles, Tags } from 'lucide-react';
import { auctionService } from '../../services/auctionService';
import { useAuth } from '../../context/AuthContext';
import { AuctionCard } from '../auction/AuctionCard';
import { AuctionCardSkeleton } from '../common/SkeletonLoader';
import { SectionHeading } from './SectionHeading';
import { stagger } from '../motion/variants';

/** Personalised picks for signed-in users: alert matches first, then notices similar to what they saved. */
export const ForYouSection: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['forYou', user?.id],
    queryFn: () => auctionService.getForYou(6),
    enabled: !!user,
    staleTime: 60000
  });

  if (!user || isError) return null;

  const picks = data?.data ?? [];
  const firstName = user.name.split(' ')[0];

  return (
    <section className="space-y-8" aria-label="Picked for you">
      <SectionHeading
        eyebrow="For you"
        title={`Picked for you, ${firstName}`}
        description="Live notices in the categories you follow, that match your alerts, or are similar to what you saved."
        action={{ to: '/interests', label: 'My interests' }}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <AuctionCardSkeleton key={i} />
          ))}
        </div>
      ) : picks.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-5">
          <span className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </span>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white">{data?.hasAlerts || data?.hasSaved || data?.hasInterests ? 'Nothing live matches right now' : 'Tell us what you buy'}</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {data?.hasAlerts || data?.hasSaved || data?.hasInterests
                ? 'We will show matches here as soon as new notices are published.'
                : 'Choose the categories you deal in and this section fills with notices picked for you.'}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/interests" className="btn-primary !py-2.5">
              <Tags className="w-4 h-4" /> Choose interests
            </Link>
            <Link to="/auctions" className="btn-ghost border border-slate-200 dark:border-white/10 !py-2.5">
              Browse
            </Link>
          </div>
        </div>
      ) : (
        <m.div variants={stagger(0.06)} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {picks.map((a) => (
            <div key={a.id} className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-1.5 self-start text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                {a.reason.type === 'alert' ? <BellRing className="w-3 h-3" /> : a.reason.type === 'interest' ? <Tags className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                {a.reason.label}
              </span>
              <div className="flex-1">
                <AuctionCard auction={a} />
              </div>
            </div>
          ))}
        </m.div>
      )}
    </section>
  );
};
