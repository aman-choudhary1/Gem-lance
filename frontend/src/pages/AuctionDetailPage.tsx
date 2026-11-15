import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { auctionService } from '../services/auctionService';
import { sourceService } from '../services/sourceService';
import { StatusBadge } from '../components/common/StatusBadge';
import { SourceBadge } from '../components/common/SourceBadge';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { EmptyState } from '../components/common/EmptyState';
import { CreateAlertModal } from '../components/alerts/CreateAlertModal';
import { Panel } from '../components/ui/Panel';
import { Stagger, StaggerItem } from '../components/motion/Reveal';
import { EASE_OUT } from '../components/motion/variants';
import {
  formatCurrencyINR,
  formatDate,
  formatRelativeTime,
  decodeHtmlEntities,
  formatTenderPrice,
  formatEmdAmount,
  formatCompactTenderPrice
} from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useSaveAuction } from '../hooks/useSaveAuction';
import type { Auction } from '../types';
import {
  ExternalLink,
  Bookmark,
  Building2,
  MapPin,
  CalendarDays,
  CalendarPlus,
  FileText,
  Layers,
  ArrowLeft,
  Bell,
  Share2,
  ShieldCheck,
  AlertTriangle,
  Check,
  Wallet,
  Coins,
  TrendingUp,
  ChevronDown,
  Tag
} from 'lucide-react';

const hasValue = (v: number | string | null | undefined) => v !== null && v !== undefined && Number(v) > 0;

/** Builds a downloadable .ics so the closing deadline lands in the user's calendar. */
function downloadIcs(a: Auction) {
  const fmt = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AuctionLens//EN',
    'BEGIN:VEVENT',
    `UID:${a.id}@auctionlens`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(new Date(new Date(a.endTime).getTime() - 3600_000).toISOString())}`,
    `DTEND:${fmt(a.endTime)}`,
    `SUMMARY:${esc('Closing: ' + decodeHtmlEntities(a.title).slice(0, 120))}`,
    `DESCRIPTION:${esc(`${a.source.name} — ${a.officialUrl ?? window.location.href}`)}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Closes in 24 hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([body], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `auction-${a.externalId || a.id}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

const FactTile: React.FC<{ icon: React.ReactNode; label: string; value: string; note?: string; muted?: boolean; accent?: boolean }> = ({
  icon,
  label,
  value,
  note,
  muted,
  accent
}) => (
  <div className="rounded-xl p-4 bg-slate-900/[0.03] dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06]">
    <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
      <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
      {label}
    </div>
    <div
      className={`mt-1.5 font-extrabold leading-tight ${muted ? 'text-base text-amber-600 dark:text-amber-400' : accent ? 'text-xl text-emerald-600 dark:text-emerald-400 font-mono' : 'text-xl text-slate-900 dark:text-white font-mono'}`}
    >
      {value}
    </div>
    {note && <p className="mt-1 text-[11px] leading-snug text-slate-500 dark:text-slate-400">{note}</p>}
  </div>
);

const DetailSkeleton: React.FC = () => (
  <div className="max-w-6xl mx-auto space-y-5" aria-busy="true">
    <div className="h-4 w-32 rounded bg-slate-200 dark:bg-white/10" />
    <div className="h-44 rounded-3xl bg-slate-200/70 dark:bg-white/[0.05] relative overflow-hidden">
      <div className="absolute inset-0 shimmer" />
    </div>
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        <div className="h-48 rounded-2xl bg-slate-200/70 dark:bg-white/[0.05]" />
        <div className="h-64 rounded-2xl bg-slate-200/70 dark:bg-white/[0.05]" />
      </div>
      <div className="h-80 rounded-2xl bg-slate-200/70 dark:bg-white/[0.05]" />
    </div>
  </div>
);

export const AuctionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, savedAuctionIds } = useAuth();
  const { toggle } = useSaveAuction();
  const { showToast } = useToast();
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { data: auction, isLoading, isError } = useQuery({
    queryKey: ['auctionDetail', id],
    queryFn: () => auctionService.getAuctionById(id!),
    enabled: !!id,
    staleTime: 30000
  });

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => sourceService.getCategories(), staleTime: 300000 });
  const { data: sources = [] } = useQuery({ queryKey: ['sources'], queryFn: () => sourceService.getAllSources(), staleTime: 300000 });

  const categorySlug = auction?.category?.slug;
  const { data: similar = [] } = useQuery({
    queryKey: ['similarAuctions', auction?.id, categorySlug],
    queryFn: async () => {
      const res = await auctionService.getAuctions({ category: categorySlug, status: 'LIVE,ENDING_SOON', sortBy: 'endingSoon', limit: 5 });
      return res.data.filter((a) => a.id !== auction!.id).slice(0, 4);
    },
    enabled: !!auction && !!categorySlug,
    staleTime: 60000
  });

  // how far through its bidding window the notice is (0–100)
  const progress = useMemo(() => {
    if (!auction) return 0;
    const s = new Date(auction.startTime).getTime();
    const e = new Date(auction.endTime).getTime();
    if (!isFinite(s) || !isFinite(e) || e <= s) return 0;
    return Math.min(100, Math.max(0, ((Date.now() - s) / (e - s)) * 100));
  }, [auction]);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !auction) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <EmptyState
          title="Notice not found"
          description={`We couldn't find notice ${id}. It may have been archived or removed by the source portal.`}
          actionLabel="Back to explorer"
          onAction={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/auctions')}
        />
      </div>
    );
  }

  const isSaved = savedAuctionIds.has(auction.id);
  const isSample = auction.source.code.toUpperCase() === 'MOCK';
  const isClosed = auction.status === 'CLOSED';
  const description = auction.description ? decodeHtmlEntities(auction.description) : '';
  const longDescription = description.length > 520;
  const locationLine = [auction.location?.city, auction.location?.district, auction.location?.state]
    .filter((v, i, arr) => v && v !== 'Not Specified' && arr.indexOf(v) === i)
    .join(', ');

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: decodeHtmlEntities(auction.title), url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const openAlert = () => {
    if (!user) {
      showToast({ type: 'info', title: 'Sign in to create alerts', message: 'Alerts notify you when similar notices are published.', actionUrl: '/login', actionLabel: 'Sign in' });
      return;
    }
    setAlertModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-16">
      <nav aria-label="Breadcrumb" className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <Link to="/auctions" className="inline-flex items-center gap-1.5 hover:text-emerald-600 dark:hover:text-emerald-400 transition">
          <ArrowLeft className="w-3.5 h-3.5" /> All auctions
        </Link>
        <span className="hidden sm:inline">Last synced {formatRelativeTime(auction.lastScrapedAt)}</span>
      </nav>

      {isSample && (
        <div role="note" className="flex items-start gap-2.5 p-3.5 rounded-2xl border border-dashed border-yellow-500/50 bg-yellow-50 dark:bg-yellow-500/10 text-yellow-800 dark:text-yellow-200 text-xs">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>Sample data.</strong> This listing was generated for demonstration and is not a real notice. Organisation names, prices and documents are illustrative only.
          </span>
        </div>
      )}

      {/* ---------- Header */}
      <m.header initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EASE_OUT }} className="relative rounded-3xl gradient-border">
        <div className="inner relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8">
          <div aria-hidden className="pointer-events-none absolute -top-28 -right-20 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-400 via-cyan-400 to-violet-500 opacity-20 blur-3xl" />
          <div className="relative space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <SourceBadge code={auction.source.code} />
              <StatusBadge status={auction.status} />
              {auction.category && (
                <Link
                  to={`/auctions?category=${encodeURIComponent(auction.category.slug)}`}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100/80 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 transition"
                >
                  <Tag className="w-3 h-3" /> {auction.category.name}
                </Link>
              )}
            </div>

            <h1 className="text-2xl sm:text-[2rem] font-extrabold leading-tight text-slate-900 dark:text-white text-balance">{decodeHtmlEntities(auction.title)}</h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-slate-600 dark:text-slate-400">
              {auction.organization?.name && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {auction.organization.name}
                </span>
              )}
              {locationLine && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> {locationLine}
                </span>
              )}
              <span className="font-mono text-xs text-slate-500 dark:text-slate-500">ID {auction.externalId}</span>
            </div>
          </div>
        </div>
      </m.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* ---------- Main column */}
        <Stagger className="lg:col-span-2 space-y-5 min-w-0" gap={0.08} immediate>
          <StaggerItem>
            <Panel title="Financial terms" icon={<Wallet className="w-4 h-4" />}>
              <div className="grid sm:grid-cols-3 gap-3">
                <FactTile
                  icon={<Coins className="w-3.5 h-3.5" />}
                  label="Estimated / start price"
                  value={hasValue(auction.startPrice) ? formatTenderPrice(auction.startPrice) : 'Refer document'}
                  muted={!hasValue(auction.startPrice)}
                  note={hasValue(auction.startPrice) ? undefined : 'Not disclosed on the source listing'}
                />
                <FactTile
                  icon={<ShieldCheck className="w-3.5 h-3.5" />}
                  label="EMD (earnest money)"
                  value={hasValue(auction.emdAmount) ? formatEmdAmount(auction.emdAmount) : 'Refer document'}
                  accent={hasValue(auction.emdAmount)}
                  muted={!hasValue(auction.emdAmount)}
                  note={hasValue(auction.emdAmount) ? undefined : 'Check the tender document for exemptions'}
                />
                <FactTile
                  icon={<TrendingUp className="w-3.5 h-3.5" />}
                  label="Bid increment"
                  value={hasValue(auction.bidIncrement) ? formatCurrencyINR(auction.bidIncrement) : 'Per portal rules'}
                  muted={!hasValue(auction.bidIncrement)}
                />
              </div>
            </Panel>
          </StaggerItem>

          <StaggerItem>
            <Panel title="Schedule" icon={<CalendarDays className="w-4 h-4" />}>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Opens</div>
                  <div className="font-semibold font-mono text-slate-900 dark:text-slate-100">{formatDate(auction.startTime)}</div>
                </div>
                <div className="sm:text-right">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Closes</div>
                  <div className="font-semibold font-mono text-slate-900 dark:text-slate-100">{formatDate(auction.endTime)}</div>
                </div>
              </div>
              <div className="mt-4" role="progressbar" aria-label="Bidding window elapsed" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                  <m.div
                    className={`h-full rounded-full ${progress > 85 && !isClosed ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-cyan-400'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: EASE_OUT, delay: 0.2 }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{Math.round(progress)}% of the window elapsed</span>
                  {!isClosed && <CountdownTimer endTime={auction.endTime} showIcon={false} className="!text-[11px] !px-1.5" />}
                </div>
              </div>
            </Panel>
          </StaggerItem>

          {description && (
            <StaggerItem>
              <Panel title="Overview" icon={<FileText className="w-4 h-4" />}>
                <p className={`text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-300 ${longDescription && !expanded ? 'line-clamp-6' : ''}`}>{description}</p>
                {longDescription && (
                  <button onClick={() => setExpanded((v) => !v)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                    {expanded ? 'Show less' : 'Read more'}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </Panel>
            </StaggerItem>
          )}

          <StaggerItem>
            <Panel title={`Items & materials (${auction.items?.length ?? 0})`} icon={<Layers className="w-4 h-4" />} bodyClassName="!p-0">
              {auction.items && auction.items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <tr className="border-b border-slate-200/70 dark:border-white/[0.06]">
                        <th className="py-2.5 px-5 font-semibold">#</th>
                        <th className="py-2.5 px-3 font-semibold min-w-[14rem]">Item</th>
                        <th className="py-2.5 px-3 font-semibold">Qty</th>
                        <th className="py-2.5 px-3 font-semibold">Condition</th>
                        <th className="py-2.5 px-5 font-semibold text-right">Est. value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.05]">
                      {auction.items.map((it, idx) => (
                        <tr key={it.id || idx} className="hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                          <td className="py-3 px-5 font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{it.name}</div>
                            {it.description && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{it.description}</p>}
                          </td>
                          <td className="py-3 px-3 font-mono whitespace-nowrap">
                            {Number(it.quantity)} {it.unit || ''}
                          </td>
                          <td className="py-3 px-3">{it.condition ? <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/5 dark:bg-white/10">{it.condition}</span> : <span className="text-slate-400">—</span>}</td>
                          <td className="py-3 px-5 text-right font-mono font-semibold">{it.estimatedValue ? formatCurrencyINR(it.estimatedValue) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="p-5 text-sm text-slate-500 dark:text-slate-400">No separate line items were published for this notice.</p>
              )}
            </Panel>
          </StaggerItem>

          <StaggerItem>
            <Panel title={`Documents (${auction.documents?.length ?? 0})`} icon={<FileText className="w-4 h-4" />}>
              {auction.documents && auction.documents.length > 0 ? (
                <ul className="grid sm:grid-cols-2 gap-2.5">
                  {auction.documents.map((doc, idx) => (
                    <li key={doc.id || idx}>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="group flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/70 dark:border-white/[0.07] bg-slate-900/[0.02] dark:bg-white/[0.03] hover:border-emerald-500/50 transition"
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </span>
                          <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-300">{doc.name}</span>
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-500 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">No documents were indexed for this notice. Please refer to the official portal.</p>
              )}
            </Panel>
          </StaggerItem>

          {(auction.organization || locationLine) && (
            <StaggerItem>
              <div className="grid sm:grid-cols-2 gap-5">
                <Panel title="Organisation" icon={<Building2 className="w-4 h-4" />}>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{auction.organization?.name || 'Not specified'}</div>
                  {auction.organization?.department && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{auction.organization.department}</div>}
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Source: {auction.source.name}</div>
                </Panel>
                <Panel title="Location" icon={<MapPin className="w-4 h-4" />}>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{locationLine || 'Not specified'}</div>
                  {auction.location?.address && <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{auction.location.address}</p>}
                  {auction.location?.state && auction.location.state !== 'Not Specified' && (
                    <Link to={`/auctions?state=${encodeURIComponent(auction.location.state)}`} className="mt-2 inline-block text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                      More in {auction.location.state}
                    </Link>
                  )}
                </Panel>
              </div>
            </StaggerItem>
          )}
        </Stagger>

        {/* ---------- Sticky action rail */}
        <aside className="space-y-5 min-w-0 lg:sticky lg:top-24">
          <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }} className="glass-card rounded-2xl p-5 space-y-4">
            <div className="text-center">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">{isClosed ? 'Status' : 'Closes in'}</div>
              <div className="mt-2 flex justify-center">
                <CountdownTimer endTime={auction.endTime} className="!text-lg !px-4 !py-1.5 rounded-xl" />
              </div>
              <div className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">{formatDate(auction.endTime)}</div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-slate-900/[0.04] dark:bg-white/[0.05] py-2">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Price</div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">{hasValue(auction.startPrice) ? formatCompactTenderPrice(auction.startPrice) : 'Refer doc'}</div>
              </div>
              <div className="rounded-xl bg-slate-900/[0.04] dark:bg-white/[0.05] py-2">
                <div className="text-[10px] text-slate-500 dark:text-slate-400">EMD</div>
                <div className="text-sm font-bold font-mono text-slate-900 dark:text-white">{hasValue(auction.emdAmount) ? formatEmdAmount(auction.emdAmount) : 'Refer doc'}</div>
              </div>
            </div>

            {auction.officialUrl ? (
              <a href={auction.officialUrl} target="_blank" rel="noreferrer noopener" className="btn-primary w-full">
                View on {auction.source.name} <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <p className="text-xs text-center text-slate-500 dark:text-slate-400">Open the official portal to bid.</p>
            )}
            <p className="text-[11px] leading-snug text-slate-500 dark:text-slate-400 text-center">
              AuctionLens aggregates public notices. Bidding and payment always happen on the official portal.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggle(auction.id)}
                aria-pressed={isSaved}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border transition ${
                  isSaved ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300' : 'border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} /> {isSaved ? 'Saved' : 'Save'}
              </button>
              <button onClick={handleShare} className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 transition">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />} {copied ? 'Link copied' : 'Share'}
              </button>
              {!isClosed && (
                <button onClick={() => downloadIcs(auction)} className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 transition">
                  <CalendarPlus className="w-3.5 h-3.5" /> Add closing date to calendar
                </button>
              )}
            </div>
          </m.div>

          <div className="relative overflow-hidden rounded-2xl p-5 border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-violet-500/10">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Bell className="w-4 h-4 text-emerald-500" /> Get notified of similar notices
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              {auction.category?.name ?? 'This type'} {locationLine && auction.location?.state !== 'Not Specified' ? `in ${auction.location?.state}` : 'across India'}, straight to your inbox.
            </p>
            <button onClick={openAlert} className="btn-primary mt-3 w-full">Create alert rule</button>
          </div>

          {similar.length > 0 && (
            <Panel title="Similar & closing soon" icon={<Layers className="w-4 h-4" />} bodyClassName="!p-2">
              <ul>
                {similar.map((s) => (
                  <li key={s.id}>
                    <Link to={`/auctions/${s.id}`} className="block rounded-xl p-3 hover:bg-slate-900/[0.04] dark:hover:bg-white/[0.05] transition">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">{decodeHtmlEntities(s.title)}</div>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{s.location?.state && s.location.state !== 'Not Specified' ? s.location.state : s.source.name}</span>
                        <CountdownTimer endTime={s.endTime} showIcon={false} className="!text-[10px] !px-1.5 !py-0" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>

      <CreateAlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onCreated={() =>
          showToast({ type: 'success', title: 'Alert rule created', message: 'You will be notified when matching notices are published.', actionUrl: '/alerts', actionLabel: 'Manage alerts' })
        }
        categories={categories}
        sources={sources}
        initialValues={{
          keywords: auction.title.split(' ').slice(0, 3).join(' '),
          category: auction.category?.id,
          state: auction.location?.state && auction.location.state !== 'Not Specified' ? auction.location.state : undefined,
          ...(hasValue(auction.startPrice) ? { minPrice: Math.round(Number(auction.startPrice) * 0.5), maxPrice: Math.round(Number(auction.startPrice) * 2) } : {})
        }}
      />
    </div>
  );
};
