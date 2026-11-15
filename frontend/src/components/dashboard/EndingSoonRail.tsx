import React from 'react';
import { Link } from 'react-router-dom';
import { Auction } from '../../types';
import { CountdownTimer } from '../common/CountdownTimer';
import { SourceBadge } from '../common/SourceBadge';
import { formatCompactINR } from '../../utils/formatters';
import { Clock, Flame, ChevronRight } from 'lucide-react';

interface EndingSoonRailProps {
  auctions: Auction[];
}

export const EndingSoonRail: React.FC<EndingSoonRailProps> = ({ auctions }) => {
  if (!auctions || auctions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Flame className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Ending Soon (Live Countdowns)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">Auctions closing within the next 24 hours</p>
          </div>
        </div>

        <Link
          to="/ending-soon"
          className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1"
        >
          View all ending soon <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {auctions.slice(0, 3).map((a) => (
          <div
            key={a.id}
            className="p-4 rounded-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900/90 dark:to-slate-950/80 border border-amber-500/30 dark:border-amber-500/20 hover:border-amber-500/50 shadow-sm dark:shadow-none transition flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <SourceBadge code={a.source.code} />
                <CountdownTimer endTime={a.endTime} />
              </div>
              <Link
                to={`/auctions/${encodeURIComponent(a.externalId)}`}
                className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-amber-600 dark:hover:text-amber-300 line-clamp-2 leading-tight block"
              >
                {a.title}
              </Link>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {a.location?.city ? `${a.location.city}, ` : ''}
                {a.location?.state || 'India'}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block uppercase font-medium">Starting Price</span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                  {formatCompactINR(a.startPrice)}
                </span>
              </div>
              <Link
                to={`/auctions/${encodeURIComponent(a.externalId)}`}
                className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold transition"
              >
                Inspect Lot &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
