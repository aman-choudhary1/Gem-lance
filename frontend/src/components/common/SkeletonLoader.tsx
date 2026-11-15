import React from 'react';

const bar = 'rounded-md bg-slate-200/80 dark:bg-white/[0.07] relative overflow-hidden';
const Shimmer: React.FC = () => <span className="absolute inset-0 shimmer" aria-hidden />;
const Bar: React.FC<{ className: string }> = ({ className }) => (
  <div className={`${bar} ${className}`}>
    <Shimmer />
  </div>
);

export const AuctionCardSkeleton: React.FC = () => (
  <div className="glass-card rounded-2xl overflow-hidden" role="status" aria-label="Loading auction">
    <div className="h-1 w-full bg-slate-200 dark:bg-white/10" />
    <div className="p-5 space-y-4">
      <div className="flex justify-between items-center">
        <Bar className="h-5 w-20" />
        <Bar className="h-5 w-20 !rounded-full" />
      </div>
      <div className="space-y-2">
        <Bar className="h-3 w-28" />
        <Bar className="h-5 w-full" />
        <Bar className="h-5 w-3/5" />
      </div>
      <div className="space-y-2">
        <Bar className="h-3.5 w-2/3" />
        <Bar className="h-3.5 w-1/2" />
      </div>
      <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-slate-200/70 dark:border-white/[0.07]">
        <Bar className="h-12 !rounded-xl" />
        <Bar className="h-12 !rounded-xl" />
      </div>
      <div className="flex justify-between items-center">
        <Bar className="h-6 w-28" />
        <Bar className="h-4 w-16" />
      </div>
    </div>
  </div>
);

export const StatsTickerSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" role="status" aria-label="Loading statistics">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="glass-card rounded-2xl p-5 space-y-3">
        <Bar className="h-9 w-9 !rounded-xl" />
        <Bar className="h-7 w-24" />
        <Bar className="h-3 w-20" />
      </div>
    ))}
  </div>
);
