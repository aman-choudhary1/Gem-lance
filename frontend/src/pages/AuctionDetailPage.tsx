import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auctionService } from '../services/auctionService';
import { sourceService } from '../services/sourceService';
import { StatusBadge } from '../components/common/StatusBadge';
import { SourceBadge } from '../components/common/SourceBadge';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { CreateAlertModal } from '../components/alerts/CreateAlertModal';
import {
  formatCurrencyINR,
  formatDate,
  formatRelativeTime,
  decodeHtmlEntities,
  formatTenderPrice,
  formatEmdAmount
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import {
  ExternalLink,
  Bookmark,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Layers,
  ArrowLeft,
  Bell,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Info
} from 'lucide-react';

export const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, savedAuctionIds, toggleSave } = useAuth();
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: auction, isLoading, isError } = useQuery({
    queryKey: ['auctionDetail', id],
    queryFn: () => auctionService.getAuctionById(id!),
    enabled: !!id,
    staleTime: 30000
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => sourceService.getCategories(),
    staleTime: 300000
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: () => sourceService.getAllSources(),
    staleTime: 300000
  });

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-slate-800 rounded"></div>
        <div className="h-10 w-3/4 bg-slate-800 rounded-xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 h-64 bg-slate-800/60 rounded-2xl"></div>
          <div className="h-64 bg-slate-800/60 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !auction) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-100">Auction Notice Not Found</h2>
        <p className="text-sm text-slate-400">
          The requested auction ID ({id}) could not be located in our multi-portal index. It may have been archived or removed by the source.
        </p>
        <Link
          to="/auctions"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Explorer
        </Link>
      </div>
    );
  }

  const isSaved = savedAuctionIds.has(auction.id);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Breadcrumbs & Navigation */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <Link
          to="/auctions"
          className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Auctions
        </Link>

        <div className="flex items-center gap-2">
          <span>Last synchronized: {formatRelativeTime(auction.lastScrapedAt)}</span>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="bg-white dark:bg-gradient-to-b dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SourceBadge code={auction.source.code} />
            <StatusBadge status={auction.status} />
            {auction.category && (
              <span className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {auction.category.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center gap-1.5 text-xs font-medium"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copied Link!' : 'Share'}</span>
            </button>

            <button
              onClick={() => {
                if (!user) return alert('Please sign in or use Demo Login to bookmark this auction.');
                toggleSave(auction.id);
              }}
              className={`p-2 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium ${
                isSaved
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                  : 'bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-400' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        <div>
          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
            Auction ID: {auction.externalId}
          </div>
          <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:white leading-snug">
            {decodeHtmlEntities(auction.title)}
          </h1>
        </div>

        {/* Official Source Link & Disclaimer */}
        <div className="bg-emerald-50/60 dark:bg-slate-950/80 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                Official Portal Verification: {auction.source.name}
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                To inspect statutory notices, submit security deposits, and place valid bids, visit the official portal directly.
              </p>
            </div>
          </div>

          {auction.officialUrl && (
            <a
              href={auction.officialUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30 flex items-center gap-2 shrink-0"
            >
              <span>View on Official Portal</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {/* Grid: Financials & Schedule */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Financial Details */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
            Financial Terms
          </h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Starting Reserve Price</span>
              <span
                className={`text-lg font-black font-mono ${
                  !auction.startPrice || Number(auction.startPrice) <= 0
                    ? 'text-amber-600 dark:text-amber-400 font-sans text-base'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {formatTenderPrice(auction.startPrice)}
              </span>
              {(!auction.startPrice || Number(auction.startPrice) <= 0) && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  PAC undisclosed on source portal (Rate Contract / As per NIT)
                </span>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Earnest Money Deposit (EMD)</span>
              <span
                className={`text-lg font-bold font-mono ${
                  !auction.emdAmount || Number(auction.emdAmount) <= 0
                    ? 'text-slate-500 dark:text-slate-400 font-sans text-base'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatEmdAmount(auction.emdAmount)}
              </span>
              {(!auction.emdAmount || Number(auction.emdAmount) <= 0) && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Check tender document for exemption or itemized deposit rules
                </span>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Minimum Bid Increment</span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {auction.bidIncrement ? formatCurrencyINR(auction.bidIncrement) : 'As per Portal Rules'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <span className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">Payment Terms</span>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                100% within 7-10 working days of acceptance
              </span>
            </div>
          </div>
        </div>

        {/* Schedule & Timing */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
            Auction Schedule
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Bidding Start Time</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {formatDate(auction.startTime)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Bidding End Time</span>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                    {formatDate(auction.endTime)}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-slate-100 dark:bg-gradient-to-r dark:from-slate-950 dark:to-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Time Remaining:</span>
              <CountdownTimer endTime={auction.endTime} className="text-sm px-3 py-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Description & Overview */}
      {auction.description && (
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Auction Lot Overview
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {decodeHtmlEntities(auction.description)}
          </p>
        </div>
      )}

      {/* Itemized Breakdown Table */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Auction Items & Materials ({auction.items?.length || 0})
          </h3>
        </div>

        {auction.items && auction.items.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Item #</th>
                  <th className="py-2.5 px-3">Item Name & Specs</th>
                  <th className="py-2.5 px-3">Quantity</th>
                  <th className="py-2.5 px-3">Condition</th>
                  <th className="py-2.5 px-3 text-right">Est. Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {auction.items.map((it, idx) => (
                  <tr key={it.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-3 px-3 font-mono text-slate-400 dark:text-slate-500">#{idx + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">{it.name}</div>
                      {it.description && <p className="text-[11px] text-slate-500 dark:text-slate-400">{it.description}</p>}
                    </td>
                    <td className="py-3 px-3 font-mono font-medium text-slate-800 dark:text-slate-200">
                      {Number(it.quantity)} {it.unit || 'Nos'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {it.condition || 'Used'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-200">
                      {it.estimatedValue ? formatCurrencyINR(it.estimatedValue) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No separate item line items listed for this lot.</p>
        )}
      </div>

      {/* Organization & Location Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Publishing Organization
          </h3>
          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="text-sm font-bold text-slate-900 dark:text-white">
              {auction.organization?.name || 'Government Organization'}
            </div>
            {auction.organization?.department && (
              <div className="text-slate-500 dark:text-slate-400">Department: {auction.organization.department}</div>
            )}
            <div className="text-slate-500 dark:text-slate-400">Sourced via: {auction.source.name}</div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm dark:shadow-none">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Inspection & Lifting Location
          </h3>
          <div className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
            <div className="font-semibold text-slate-900 dark:text-white">
              {auction.location?.city ? `${auction.location.city}, ` : ''}
              {auction.location?.district ? `${auction.location.district}, ` : ''}
              {auction.location?.state || 'India'}
            </div>
            {auction.location?.address && (
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                Address: {auction.location.address}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Public Documents & Catalogues
        </h3>

        {auction.documents && auction.documents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {auction.documents.map((doc, idx) => (
              <a
                key={doc.id || idx}
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                    {doc.name}
                  </span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 shrink-0" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No public document attachments indexed for this notice. Refer to official portal.
          </p>
        )}
      </div>

      {/* Quick Alert CTA Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            <Bell className="w-4 h-4 text-emerald-400" />
            Monitor Similar Forward Auctions
          </h4>
          <p className="text-xs text-slate-400">
            Set an automated alert rule for {auction.category?.name || 'this category'} in {auction.location?.state || 'India'}.
          </p>
        </div>
        <button
          onClick={() => {
            if (!user) return alert('Please sign in or use Demo Login to create auction alerts.');
            setAlertModalOpen(true);
          }}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/40 shrink-0"
        >
          Create Alert Rule
        </button>
      </div>

      {/* Create Alert Modal */}
      <CreateAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onCreated={() => alert('Alert rule created successfully!')}
        categories={categories}
        sources={sources}
        initialValues={{
          keywords: auction.title.split(' ').slice(0, 3).join(' '),
          category: auction.category?.id,
          state: auction.location?.state,
          minPrice: Number(auction.startPrice) * 0.5,
          maxPrice: Number(auction.startPrice) * 2
        }}
      />
    </div>
  );
};
