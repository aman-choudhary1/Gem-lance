import React from 'react';
import { Link } from 'react-router-dom';
import { Auction } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { SourceBadge } from '../common/SourceBadge';
import { CountdownTimer } from '../common/CountdownTimer';
import { useAuth } from '../../context/AuthContext';
import { useSaveAuction } from '../../hooks/useSaveAuction';
import {
  formatCompactINR,
  formatDate,
  decodeHtmlEntities,
  formatCompactTenderPrice,
  formatEmdAmount
} from '../../utils/formatters';
import { Bookmark, ExternalLink } from 'lucide-react';

interface AuctionTableProps {
  auctions: Auction[];
}

export const AuctionTable: React.FC<AuctionTableProps> = ({ auctions }) => {
  const { savedAuctionIds } = useAuth();
  const { toggle } = useSaveAuction();

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-none transition-colors">
      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
        <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="py-3.5 px-4">Portal</th>
            <th className="py-3.5 px-4">Auction Details</th>
            <th className="py-3.5 px-4">Organization & Location</th>
            <th className="py-3.5 px-4">Starting Price</th>
            <th className="py-3.5 px-4">Status & Timeline</th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
          {auctions.map((a) => {
            const isSaved = savedAuctionIds.has(a.id);
            const isLive = a.status === 'LIVE' || a.status === 'ENDING_SOON';

            return (
              <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                {/* Portal */}
                <td className="py-4 px-4 align-top">
                  <SourceBadge code={a.source.code} />
                </td>

                {/* Auction Details */}
                <td className="py-4 px-4 align-top max-w-xs">
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                    {a.externalId}
                  </div>
                  <Link
                    to={`/auctions/${encodeURIComponent(a.externalId)}`}
                    className="font-semibold text-slate-900 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 line-clamp-2 leading-relaxed block"
                  >
                    {decodeHtmlEntities(a.title)}
                  </Link>
                  {a.category && (
                    <span className="inline-block mt-1 text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {a.category.name}
                    </span>
                  )}
                </td>

                {/* Organization & Location */}
                <td className="py-4 px-4 align-top max-w-[200px]">
                  <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{decodeHtmlEntities(a.organization?.name || 'Govt Department')}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">
                    {a.location?.city ? `${a.location.city}, ` : ''}
                    {a.location?.state || 'India'}
                  </div>
                </td>

                {/* Starting Price */}
                <td className="py-4 px-4 align-top">
                  <div
                    className={`font-bold font-mono text-sm ${
                      !a.startPrice || Number(a.startPrice) <= 0
                        ? 'text-amber-600 dark:text-amber-400 text-xs font-sans'
                        : 'text-slate-900 dark:text-slate-100'
                    }`}
                  >
                    {formatCompactTenderPrice(a.startPrice)}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    EMD: {formatEmdAmount(a.emdAmount)}
                  </div>
                </td>

                {/* Status & Timeline */}
                <td className="py-4 px-4 align-top">
                  <div className="mb-1.5">
                    <StatusBadge status={a.status} />
                  </div>
                  {isLive ? (
                    <CountdownTimer endTime={a.endTime} />
                  ) : (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {a.status === 'UPCOMING' ? `Starts ${formatDate(a.startTime)}` : `Ended ${formatDate(a.endTime)}`}
                    </div>
                  )}
                </td>

                {/* Actions */}
                <td className="py-4 px-4 align-top text-right space-x-2">
                  <button
                    onClick={() => toggle(a.id)}
                    aria-label={isSaved ? 'Remove from saved' : 'Save auction'}
                    className={`p-1.5 rounded-lg border transition ${
                      isSaved
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-400' : ''}`} />
                  </button>

                  <Link
                    to={`/auctions/${encodeURIComponent(a.externalId)}`}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition"
                  >
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
