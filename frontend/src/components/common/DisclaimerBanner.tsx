import React from 'react';
import { Info } from 'lucide-react';

export const DisclaimerBanner: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 text-xs text-slate-400 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Official Portal Notice:</span> AuctionLens is an independent search and monitoring aggregator. This platform is not affiliated with GeM, MSTC, or government bodies. Always verify terms and submit bids directly on the official source portal.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50 dark:from-slate-900 dark:via-slate-800/80 dark:to-slate-900 border border-emerald-200/80 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 shadow-sm dark:shadow-lg transition-colors">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Independent Intelligence & Discovery Platform
            <span className="text-[10px] bg-emerald-500/15 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-mono uppercase font-semibold">
              Public Data Only
            </span>
          </h4>
          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            AuctionLens aggregates publicly published notices across GeM Forward Auction, MSTC, and state auction portals. We do not participate in bidding, handle user credentials, or replace the official portals. Please use the "View on Official Portal" link on every auction to review statutory notices and place authentic bids.
          </p>
        </div>
      </div>
    </div>
  );
};
