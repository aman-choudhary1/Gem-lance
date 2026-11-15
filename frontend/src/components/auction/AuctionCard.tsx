import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Auction } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { SourceBadge } from '../common/SourceBadge';
import { CountdownTimer } from '../common/CountdownTimer';
import { useAuth } from '../../context/AuthContext';
import {
  formatCompactINR,
  formatDate,
  decodeHtmlEntities,
  formatCompactTenderPrice,
  formatEmdAmount
} from '../../utils/formatters';
import {
  Building2,
  MapPin,
  Bookmark,
  Layers,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface AuctionCardProps {
  auction: Auction;
}

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction }) => {
  const { user, savedAuctionIds, toggleSave } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const isSaved = savedAuctionIds.has(auction.id);

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      alert('Please sign in or use Demo Login to save auctions to your watchlist.');
      return;
    }
    setIsSaving(true);
    try {
      await toggleSave(auction.id);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const isLiveOrEnding = auction.status === 'LIVE' || auction.status === 'ENDING_SOON';

  return (
    <div className="glass-card rounded-2xl p-5 transition duration-200 flex flex-col justify-between group relative overflow-hidden">
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <SourceBadge code={auction.source.code} />
            {auction.category && (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/50">
                {auction.category.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={auction.status} />
            <button
              onClick={handleBookmark}
              disabled={isSaving}
              aria-label={isSaved ? 'Remove from saved' : 'Save auction'}
              className={`p-1.5 rounded-lg border transition ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Auction/Bid ID & Title */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 tracking-wider font-bold">
              {auction.externalId}
            </span>
            {auction.source.code === 'GEM_BIDS' && (
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-600 dark:text-teal-300 font-mono uppercase">
                Procurement
              </span>
            )}
          </div>
          <Link
            to={`/auctions/${encodeURIComponent(auction.externalId)}`}
            className="block text-base font-bold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-300"
          >
            {decodeHtmlEntities(auction.title)}
          </Link>
        </div>

        {/* Organization & Location Info */}
        <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <div className="flex items-center gap-2 line-clamp-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">{decodeHtmlEntities(auction.organization?.name || 'Government Organization')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>
              {auction.location?.city ? `${auction.location.city}, ` : ''}
              {auction.location?.state || 'India'}
            </span>
          </div>
          {auction.items && auction.items.length > 0 && (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Layers className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>{auction.items.length} Lot item{auction.items.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Financials & Action Footer */}
      <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-3">
        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/60">
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">
              {auction.source.code === 'GEM_BIDS' ? 'Est. Value' : 'Starting Price'}
            </span>
            <span
              className={`text-sm font-extrabold font-mono ${
                !auction.startPrice || Number(auction.startPrice) <= 0
                  ? 'text-amber-600 dark:text-amber-400 font-sans text-xs'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {formatCompactTenderPrice(auction.startPrice)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-medium">EMD Amount</span>
            <span
              className={`text-sm font-semibold font-mono ${
                !auction.emdAmount || Number(auction.emdAmount) <= 0
                  ? 'text-slate-500 dark:text-slate-400 font-sans text-xs'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatEmdAmount(auction.emdAmount)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          {/* Time Countdown / End Date */}
          <div>
            {isLiveOrEnding ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium">Closes in:</span>
                <CountdownTimer endTime={auction.endTime} />
              </div>
            ) : auction.status === 'UPCOMING' ? (
              <span className="text-[11px] text-blue-400 font-mono">
                Starts {formatDate(auction.startTime)}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 font-mono">
                Ended {formatDate(auction.endTime)}
              </span>
            )}
          </div>

          <Link
            to={`/auctions/${encodeURIComponent(auction.externalId)}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:translate-x-0.5 transition"
          >
            Details <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
