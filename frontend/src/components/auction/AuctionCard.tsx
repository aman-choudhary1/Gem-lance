import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Auction, AuctionStatus } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { SourceBadge } from '../common/SourceBadge';
import { CountdownTimer } from '../common/CountdownTimer';
import { useAuth } from '../../context/AuthContext';
import { useSaveAuction } from '../../hooks/useSaveAuction';
import { useSpotlight } from '../../hooks/useSpotlight';
import { CompareButton } from '../compare/CompareButton';
import { fadeUp } from '../motion/variants';
import { formatDate, decodeHtmlEntities, formatCompactTenderPrice, formatEmdAmount } from '../../utils/formatters';
import { Building2, MapPin, Bookmark, Layers, ArrowUpRight } from 'lucide-react';

interface AuctionCardProps {
  auction: Auction;
}

const ACCENT: Record<AuctionStatus, string> = {
  LIVE: 'from-emerald-400 via-emerald-500 to-cyan-400',
  ENDING_SOON: 'from-amber-400 via-orange-500 to-rose-500',
  UPCOMING: 'from-sky-400 via-indigo-400 to-violet-500',
  CLOSED: 'from-slate-400 to-slate-500',
  CANCELLED: 'from-slate-400 to-slate-500',
  UNKNOWN: 'from-slate-400 to-slate-500'
};

export const AuctionCard: React.FC<AuctionCardProps> = ({ auction }) => {
  const { savedAuctionIds } = useAuth();
  const { toggle } = useSaveAuction();
  const onPointerMove = useSpotlight();
  const [isSaving, setIsSaving] = useState(false);

  const isSaved = savedAuctionIds.has(auction.id);
  const isLiveOrEnding = auction.status === 'LIVE' || auction.status === 'ENDING_SOON';
  const isBid = auction.source.code === 'GEM_BIDS';
  const hasPrice = Number(auction.startPrice) > 0;
  const detailPath = `/auctions/${encodeURIComponent(auction.externalId)}`;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaving(true);
    try {
      await toggle(auction.id);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <m.article
      variants={fadeUp}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      onPointerMove={onPointerMove}
      className="glass-card rounded-2xl flex flex-col overflow-hidden group h-full"
    >
      {/* status accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${ACCENT[auction.status] ?? ACCENT.UNKNOWN} ${auction.status === 'ENDING_SOON' ? 'animate-gradient-pan bg-[length:200%_auto]' : ''}`} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <SourceBadge code={auction.source.code} />
            {auction.category && (
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-900/5 dark:bg-white/5 px-2 py-0.5 rounded-md truncate max-w-[9rem]">
                {auction.category.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusBadge status={auction.status} />
            <CompareButton auction={auction} />
            <m.button
              whileTap={{ scale: 0.8 }}
              onClick={handleBookmark}
              disabled={isSaving}
              aria-label={isSaved ? 'Remove from saved' : 'Save auction'}
              aria-pressed={isSaved}
              className={`relative z-10 p-1.5 rounded-lg border transition ${
                isSaved
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                  : 'text-slate-400 border-slate-200 dark:border-white/10 hover:text-emerald-600 dark:hover:text-emerald-300 hover:border-emerald-500/40'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </m.button>
          </div>
        </div>

        <div className="mb-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 tracking-wide font-semibold truncate">{auction.externalId}</span>
            {isBid && (
              <span className="text-[9px] font-bold px-1.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-300 font-mono uppercase">Bid</span>
            )}
          </div>
          <Link
            to={detailPath}
            className="block text-[15px] font-bold leading-snug text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors line-clamp-3 after:absolute after:inset-0 after:content-['']"
          >
            {decodeHtmlEntities(auction.title)}
          </Link>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mb-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{decodeHtmlEntities(auction.organization?.name || 'Government organisation')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {auction.location?.city ? `${auction.location.city}, ` : ''}
              {auction.location?.state && auction.location.state !== 'Not Specified' ? auction.location.state : 'Location in notice'}
            </span>
          </div>
          {auction.items && auction.items.length > 0 && (
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                {auction.items.length} lot item{auction.items.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-white/[0.07] space-y-3">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl p-2.5 bg-slate-900/[0.03] dark:bg-white/[0.04]">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-medium">{isBid ? 'Est. value' : 'Start price'}</span>
              <span className={hasPrice ? 'text-[15px] font-extrabold font-mono text-slate-900 dark:text-white' : 'text-xs font-semibold text-amber-600 dark:text-amber-400'}>
                {formatCompactTenderPrice(auction.startPrice)}
              </span>
            </div>
            <div className="rounded-xl p-2.5 bg-slate-900/[0.03] dark:bg-white/[0.04]">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-medium">EMD</span>
              <span className={Number(auction.emdAmount) > 0 ? 'text-[15px] font-bold font-mono text-emerald-600 dark:text-emerald-300' : 'text-xs font-semibold text-slate-500 dark:text-slate-400'}>
                {formatEmdAmount(auction.emdAmount)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 min-h-[28px]">
            {isLiveOrEnding ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">Closes</span>
                <CountdownTimer endTime={auction.endTime} />
              </div>
            ) : auction.status === 'UPCOMING' ? (
              <span className="text-[11px] text-sky-600 dark:text-sky-300 font-mono">Starts {formatDate(auction.startTime)}</span>
            ) : (
              <span className="text-[11px] text-slate-500 font-mono">Ended {formatDate(auction.endTime)}</span>
            )}
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300 group-hover:gap-1.5 transition-all">
              Details <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </m.article>
  );
};
