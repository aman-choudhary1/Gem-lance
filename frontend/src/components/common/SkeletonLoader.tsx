import React from 'react';

export const AuctionCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-5 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
        <div className="h-5 w-24 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
      </div>
      <div className="space-y-2">
        <div className="h-5 w-4/5 bg-slate-100 dark:bg-slate-800 rounded"></div>
        <div className="h-3.5 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-lg"></div>
        <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-lg"></div>
      </div>
      <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-800/80">
        <div className="h-4 w-32 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
        <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
      </div>
    </div>
  );
};

export const StatsTickerSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
          <div className="h-3.5 w-16 bg-slate-100 dark:bg-slate-800 rounded"></div>
          <div className="h-7 w-20 bg-slate-100 dark:bg-slate-800 rounded"></div>
        </div>
      ))}
    </div>
  );
};
