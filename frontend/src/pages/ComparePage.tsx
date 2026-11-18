import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Scale, X, ArrowUpRight, Trophy } from 'lucide-react';
import { auctionService } from '../services/auctionService';
import { useCompare } from '../context/CompareContext';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { StatusBadge } from '../components/common/StatusBadge';
import { SourceBadge } from '../components/common/SourceBadge';
import { CountdownTimer } from '../components/common/CountdownTimer';
import { EmptyState } from '../components/common/EmptyState';
import { Auction } from '../types';
import { decodeHtmlEntities, formatDate, formatEmdAmount, formatTenderPrice } from '../utils/formatters';

const disclosed = (v: unknown) => v !== null && v !== undefined && v !== '' && Number(v) > 0;
const isLive = (a: Auction) => a.status === 'LIVE' || a.status === 'ENDING_SOON';

/** Ids that "win" a row, so they can be highlighted. Only compares values the notices actually disclose. */
const lowest = (list: Auction[], pick: (a: Auction) => unknown) => {
  const vals = list.filter((a) => disclosed(pick(a)));
  if (vals.length < 2) return new Set<string>();
  const min = Math.min(...vals.map((a) => Number(pick(a))));
  return new Set(vals.filter((a) => Number(pick(a)) === min).map((a) => a.id));
};

interface Row {
  label: string;
  cell: (a: Auction) => React.ReactNode;
  best?: (list: Auction[]) => Set<string>;
  hint?: string;
}

const ROWS: Row[] = [
  { label: 'Source', cell: (a) => <SourceBadge code={a.source.code} /> },
  { label: 'Status', cell: (a) => <StatusBadge status={a.status} /> },
  { label: 'Category', cell: (a) => a.category?.name || '—' },
  { label: 'Organisation', cell: (a) => decodeHtmlEntities(a.organization?.name || '—') },
  {
    label: 'Location',
    cell: (a) => [a.location?.city, a.location?.state && a.location.state !== 'Not Specified' ? a.location.state : undefined].filter(Boolean).join(', ') || 'In notice'
  },
  {
    label: 'Start price',
    cell: (a) => <span className="font-mono font-bold">{formatTenderPrice(a.startPrice)}</span>,
    best: (l) => lowest(l, (a) => a.startPrice),
    hint: 'Lowest disclosed'
  },
  {
    label: 'EMD',
    cell: (a) => <span className="font-mono">{formatEmdAmount(a.emdAmount)}</span>,
    best: (l) => lowest(l, (a) => a.emdAmount),
    hint: 'Lowest disclosed'
  },
  { label: 'Bid increment', cell: (a) => (disclosed(a.bidIncrement) ? <span className="font-mono">{formatTenderPrice(a.bidIncrement)}</span> : 'Refer document') },
  { label: 'Opens', cell: (a) => formatDate(a.startTime) },
  { label: 'Closes', cell: (a) => formatDate(a.endTime) },
  {
    label: 'Time left',
    cell: (a) => (isLive(a) ? <CountdownTimer endTime={a.endTime} /> : <span className="text-slate-500">Not open</span>),
    best: (l) => {
      const live = l.filter(isLive);
      if (live.length < 2) return new Set<string>();
      const min = Math.min(...live.map((a) => new Date(a.endTime).getTime()));
      return new Set(live.filter((a) => new Date(a.endTime).getTime() === min).map((a) => a.id));
    },
    hint: 'Closes first'
  },
  { label: 'Lot items', cell: (a) => a._count?.items ?? a.items?.length ?? 0 },
  { label: 'Documents', cell: (a) => a._count?.documents ?? a.documents?.length ?? 0 }
];

export const ComparePage: React.FC = () => {
  const { items, remove, clear } = useCompare();
  const navigate = useNavigate();

  const results = useQueries({
    queries: items.map((i) => ({
      queryKey: ['auction', i.externalId],
      queryFn: () => auctionService.getAuctionById(i.externalId),
      staleTime: 60000
    }))
  });

  const loaded = results.map((r) => r.data).filter((a): a is Auction => !!a);
  const loading = results.some((r) => r.isLoading);
  const failed = results.filter((r) => r.isError).length;

  const winners = useMemo(() => ROWS.map((r) => (r.best ? r.best(loaded) : new Set<string>())), [loaded]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Scale className="w-6 h-6" />}
        eyebrow="Tools"
        title="Compare notices"
        description="Line up to four notices side by side. Highlights only use values the notices actually publish."
        tone="from-cyan-500 to-emerald-500"
        actions={
          items.length > 0 ? (
            <button type="button" onClick={clear} className="btn-ghost border border-slate-200 dark:border-white/10 text-sm">
              Clear all
            </button>
          ) : undefined
        }
      />

      {items.length < 2 ? (
        <EmptyState
          title={items.length === 0 ? 'Nothing to compare yet' : 'Pick at least one more notice'}
          description="Use the scale icon on any notice card to add it here."
          actionLabel="Browse auctions"
          onAction={() => navigate('/auctions')}
        />
      ) : (
        <Panel title={`Comparing ${items.length} notices`} icon={<Scale className="w-4 h-4" />} bodyClassName="!p-0">
          {failed > 0 && <p className="px-5 pt-4 text-xs text-amber-600 dark:text-amber-400">{failed} notice(s) could not be loaded. They may have been removed.</p>}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[40rem]">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-white dark:bg-slate-900 w-32 p-4" />
                  {items.map((i) => {
                    const a = loaded.find((x) => x.id === i.id);
                    return (
                      <th key={i.id} className="p-4 align-top text-left font-normal min-w-[13rem] border-l border-slate-200/70 dark:border-white/[0.07]">
                        <div className="flex items-start justify-between gap-2">
                          <Link to={`/auctions/${encodeURIComponent(i.externalId)}`} className="font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-300 line-clamp-3">
                            {decodeHtmlEntities(a?.title || i.title)}
                          </Link>
                          <button type="button" onClick={() => remove(i.id)} aria-label={`Remove ${i.title}`} className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mt-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 truncate">{i.externalId}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row, ri) => (
                  <tr key={row.label} className="border-t border-slate-200/70 dark:border-white/[0.07]">
                    <th scope="row" className="sticky left-0 z-10 bg-white dark:bg-slate-900 p-4 text-left text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 align-top">
                      {row.label}
                    </th>
                    {items.map((i) => {
                      const a = loaded.find((x) => x.id === i.id);
                      const win = a && winners[ri].has(a.id);
                      return (
                        <td key={i.id} className={`p-4 align-top border-l border-slate-200/70 dark:border-white/[0.07] text-slate-800 dark:text-slate-200 ${win ? 'bg-emerald-500/10' : ''}`}>
                          {!a ? (
                            <span className="text-slate-400">{loading ? 'Loading…' : '—'}</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{row.cell(a)}</span>
                              {win && (
                                <span title={row.hint} className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                                  <Trophy className="w-3 h-3" /> {row.hint}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t border-slate-200/70 dark:border-white/[0.07]">
                  <th scope="row" className="sticky left-0 z-10 bg-white dark:bg-slate-900 p-4" />
                  {items.map((i) => (
                    <td key={i.id} className="p-4 border-l border-slate-200/70 dark:border-white/[0.07]">
                      <Link to={`/auctions/${encodeURIComponent(i.externalId)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300 hover:underline">
                        Full details <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
};
