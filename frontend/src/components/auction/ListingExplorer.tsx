import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { auctionService, AuctionSearchParams } from '../../services/auctionService';
import { sourceService } from '../../services/sourceService';
import { AuctionCard } from './AuctionCard';
import { AuctionTable } from './AuctionTable';
import { AuctionFilters, FilterState, STATUS_OPTIONS } from './AuctionFilters';
import { ActiveFilterChips } from './ActiveFilterChips';
import { FilterSheet } from './FilterSheet';
import { Pagination } from '../common/Pagination';
import { EmptyState } from '../common/EmptyState';
import { AuctionCardSkeleton } from '../common/SkeletonLoader';
import { stagger } from '../motion/variants';
import { AnimatedNumber } from '../motion/AnimatedNumber';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CreateAlertModal } from '../alerts/CreateAlertModal';
import { exportAuctionsCsv } from '../../utils/exportCsv';
import { BellPlus, Download, Loader2 } from 'lucide-react';
import { CalendarClock, Flame, FileText, Gavel, LayoutGrid, List, RefreshCw, Search, SlidersHorizontal, Sparkles, TrendingUp, Wallet, X } from 'lucide-react';

type Mode = 'auctions' | 'bids';

const COPY: Record<Mode, { title: string; blurb: string; placeholder: string; suggestions: string[]; empty: string; icon: React.ElementType; accent: string }> = {
  auctions: {
    title: 'Government auctions',
    blurb: 'Forward auctions and disposal notices from public-sector portals, searchable in one place.',
    placeholder: 'Search vehicles, scrap, machinery, city, lot ID…',
    suggestions: ['Vehicles', 'Scrap', 'Machinery', 'E-waste', 'Furniture', 'Office space'],
    empty: 'No auctions match these filters',
    icon: Gavel,
    accent: 'from-emerald-500 to-cyan-500'
  },
  bids: {
    title: 'GeM procurement bids',
    blurb: 'Open bids and reverse auctions published on GeM BidPlus — find what departments are buying.',
    placeholder: 'Search bid number, item, ministry…',
    suggestions: ['Laptop', 'Medical', 'Furniture', 'Vehicle', 'Software', 'Printer'],
    empty: 'No bids match these filters',
    icon: FileText,
    accent: 'from-teal-500 to-sky-500'
  }
};

interface QuickPick {
  id: string;
  label: string;
  icon: React.ElementType;
  patch: { status?: string; sortBy?: string; minPrice?: number; maxPrice?: number };
}

const QUICK_PICKS: QuickPick[] = [
  { id: 'closing', label: 'Closing soonest', icon: Flame, patch: { status: 'LIVE,ENDING_SOON', sortBy: 'endingSoon' } },
  { id: 'value', label: 'Highest value', icon: TrendingUp, patch: { status: 'LIVE,ENDING_SOON', sortBy: 'highestPrice' } },
  { id: 'new', label: 'Newly listed', icon: Sparkles, patch: { sortBy: 'newest' } },
  { id: 'upcoming', label: 'Starting soon', icon: CalendarClock, patch: { status: 'UPCOMING', sortBy: 'newest' } },
  { id: 'budget', label: 'Under ₹10 lakh', icon: Wallet, patch: { status: 'LIVE,ENDING_SOON', maxPrice: 1000000, sortBy: 'lowestPrice' } }
];

const SORTS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'endingSoon', label: 'Ending soonest' },
  { value: 'highestPrice', label: 'Price: high to low' },
  { value: 'lowestPrice', label: 'Price: low to high' },
  { value: 'recentlyUpdated', label: 'Recently updated' },
  { value: 'oldest', label: 'Oldest first' }
];

const numParam = (v: string | null) => {
  if (v === null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

export const ListingExplorer: React.FC<{ mode: Mode }> = ({ mode }) => {
  const copy = COPY[mode];
  const isBids = mode === 'bids';
  const Icon = copy.icon;
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  // ---- URL is the single source of truth for every filter
  const page = Math.max(1, numParam(searchParams.get('page')) ?? 1);
  const limit = Math.min(100, Math.max(1, numParam(searchParams.get('limit')) ?? 18));
  const search = searchParams.get('search') || '';
  const filters: FilterState = {
    source: isBids ? undefined : searchParams.get('source') || undefined,
    category: searchParams.get('category') || undefined,
    state: searchParams.get('state') || undefined,
    district: searchParams.get('district') || undefined,
    status: searchParams.get('status') || undefined,
    minPrice: numParam(searchParams.get('minPrice')),
    maxPrice: numParam(searchParams.get('maxPrice')),
    sortBy: searchParams.get('sortBy') || 'newest'
  };

  /** Merge a patch into the URL; undefined/'' removes a key. Resets to page 1 unless told otherwise. */
  const patchParams = useCallback(
    (patch: Record<string, string | number | undefined>, keepPage = false) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => {
          if (v === undefined || v === '') next.delete(k);
          else next.set(k, String(v));
        });
        if (!keepPage) next.delete('page');
        return next;
      });
    },
    [setSearchParams]
  );

  // ---- search box: debounced live search + instant submit + "/" to focus
  const [searchInput, setSearchInput] = useState(search);
  const lastPushed = useRef(search);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (search !== lastPushed.current) {
      lastPushed.current = search;
      setSearchInput(search);
    }
  }, [search]);

  useEffect(() => {
    const value = searchInput.trim();
    if (value === lastPushed.current) return;
    const id = setTimeout(() => {
      lastPushed.current = value;
      patchParams({ search: value || undefined });
    }, 450);
    return () => clearTimeout(id);
  }, [searchInput, patchParams]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
      if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const value = searchInput.trim();
    lastPushed.current = value;
    patchParams({ search: value || undefined });
  };

  // ---- data
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => sourceService.getCategories(), staleTime: 300000 });
  const { data: states = [] } = useQuery({ queryKey: ['states'], queryFn: () => sourceService.getStates(), staleTime: 300000 });

  const queryParams: AuctionSearchParams = {
    page,
    limit,
    search: search || undefined,
    source: isBids ? 'GEM_BIDS' : filters.source,
    category: filters.category,
    state: filters.state,
    district: filters.district,
    status: filters.status,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sortBy: filters.sortBy
  };

  const { data, isLoading, isError, isFetching, isPlaceholderData, refetch } = useQuery({
    queryKey: [isBids ? 'bidsList' : 'auctionsList', queryParams],
    queryFn: () => auctionService.getAuctions(queryParams),
    staleTime: 15000,
    placeholderData: keepPreviousData
  });

  // ---- handlers
  const applyFilters = (f: FilterState) =>
    patchParams({
      source: isBids ? undefined : f.source,
      category: f.category,
      state: f.state,
      district: f.district,
      status: f.status,
      minPrice: f.minPrice,
      maxPrice: f.maxPrice
    });

  const resetAll = () => {
    lastPushed.current = '';
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const removeChip = (patch: Partial<FilterState> & { search?: string }) => {
    if ('search' in patch) {
      lastPushed.current = '';
      setSearchInput('');
    }
    patchParams(patch as Record<string, string | number | undefined>);
  };

  const quickPickActive = (qp: QuickPick) =>
    // A pick with no status/price condition (e.g. "Newly listed") is only "on" when the sort was chosen
    // explicitly, otherwise it would look selected on first load because newest is the default sort.
    (qp.patch.status !== undefined || qp.patch.maxPrice !== undefined || searchParams.has('sortBy')) &&
    (qp.patch.status ?? undefined) === (filters.status ?? undefined) &&
    qp.patch.sortBy === filters.sortBy &&
    (qp.patch.maxPrice ?? undefined) === (filters.maxPrice ?? undefined);

  const toggleQuickPick = (qp: QuickPick) => {
    if (quickPickActive(qp)) {
      patchParams({ status: undefined, sortBy: undefined, minPrice: undefined, maxPrice: undefined });
    } else {
      patchParams({ status: qp.patch.status, sortBy: qp.patch.sortBy, minPrice: qp.patch.minPrice, maxPrice: qp.patch.maxPrice });
    }
  };

  const { data: sources = [] } = useQuery({ queryKey: ['sources'], queryFn: () => sourceService.getAllSources(), staleTime: 300000 });

  // "Save as alert" needs something to match on; status and sort are not alert conditions.
  const canSaveAlert = !!(search || filters.category || filters.state || filters.district || (!isBids && filters.source) || filters.minPrice !== undefined || filters.maxPrice !== undefined);

  const openSaveAlert = () => {
    if (!user) {
      showToast({ type: 'info', title: 'Sign in to save alerts', message: 'We will notify you when new notices match this search.', actionUrl: '/login', actionLabel: 'Sign in' });
      return;
    }
    setAlertOpen(true);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const r = await exportAuctionsCsv(queryParams, isBids ? 'auctionlens-bids' : 'auctionlens-auctions');
      showToast({
        type: r.truncated ? 'warning' : 'success',
        title: 'CSV downloaded',
        message: r.truncated ? `Exported the first ${r.count.toLocaleString('en-IN')} of ${r.total.toLocaleString('en-IN')} results. Narrow the filters to export the rest.` : `${r.count.toLocaleString('en-IN')} notices exported.`
      });
    } catch {
      showToast({ type: 'error', title: 'Export failed', message: 'Could not fetch the results. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const categoryName = useCallback((slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug, [categories]);

  const activeFilterCount = useMemo(
    () => [filters.source && !isBids, filters.category, filters.state, filters.status, filters.minPrice !== undefined, filters.maxPrice !== undefined].filter(Boolean).length,
    [filters.source, filters.category, filters.state, filters.status, filters.minPrice, filters.maxPrice, isBids]
  );

  const total = data?.pagination.total ?? 0;
  const hasResults = !!data && data.data.length > 0;

  const filtersPanel = (
    <AuctionFilters
      filters={filters}
      categories={categories}
      states={states}
      onChange={applyFilters}
      onReset={resetAll}
      hideSource={isBids}
    />
  );

  return (
    <div className="space-y-6 pb-8">
      {/* ---- Header + search */}
      <section className="relative rounded-3xl gradient-border">
        <div className="inner relative overflow-hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-5 sm:p-7">
          <div className={`pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-gradient-to-br ${copy.accent} opacity-20 blur-3xl`} />
          <div className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-3">
                <span className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${copy.accent} text-white flex items-center justify-center shadow-glow`}>
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">{copy.title}</h1>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{copy.blurb}</p>
            </div>

            <form onSubmit={submitSearch} className="w-full lg:max-w-md" role="search">
              <div className="relative group">
                <Search className="w-[18px] h-[18px] text-slate-400 group-focus-within:text-emerald-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                <input
                  ref={inputRef}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={copy.placeholder}
                  aria-label="Search"
                  className="w-full pl-11 pr-20 py-3.5 rounded-2xl text-sm bg-slate-900/[0.04] dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 transition"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        inputRef.current?.focus();
                      }}
                      aria-label="Clear search"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-300 dark:border-white/15 text-slate-400">/</kbd>
                  )}
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mr-1">Try:</span>
                {copy.suggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => {
                      lastPushed.current = s;
                      setSearchInput(s);
                      patchParams({ search: s });
                    }}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-900/5 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-300 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* ---- Quick picks */}
      <div className="-mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 w-max sm:w-auto sm:flex-wrap">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 shrink-0">Quick picks</span>
          {QUICK_PICKS.map((qp) => {
            const on = quickPickActive(qp);
            const QIcon = qp.icon;
            return (
              <m.button
                key={qp.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleQuickPick(qp)}
                aria-pressed={on}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                  on
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-glow'
                    : 'bg-white/70 dark:bg-white/[0.04] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50'
                }`}
              >
                <QIcon className="w-3.5 h-3.5" />
                {qp.label}
              </m.button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ---- Desktop sidebar */}
        <aside className="hidden lg:block lg:col-span-3 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin rounded-2xl" aria-label="Filters">
          {filtersPanel}
        </aside>

        {/* ---- Results */}
        <div className="lg:col-span-9 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* status segmented control */}
            <div role="tablist" aria-label="Status" className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/[0.05] dark:bg-white/[0.05] overflow-x-auto no-scrollbar max-w-full">
              {STATUS_OPTIONS.map((st) => {
                const on = (filters.status ?? '') === st.value;
                return (
                  <button
                    key={st.value || 'all'}
                    role="tab"
                    aria-selected={on}
                    onClick={() => patchParams({ status: st.value || undefined })}
                    className={`relative shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${on ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                  >
                    {on && (
                      <m.span layoutId={`status-tab-${mode}`} className="absolute inset-0 rounded-lg bg-white dark:bg-slate-700/80 shadow-sm" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
                    )}
                    <span className="relative flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setSheetOpen(true)}
                className="lg:hidden inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/70 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
              </button>

              <label className="sr-only" htmlFor="sort-select">Sort by</label>
              <select
                id="sort-select"
                value={filters.sortBy}
                onChange={(e) => patchParams({ sortBy: e.target.value })}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-emerald-500/60"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>

              <div className="hidden sm:flex items-center p-1 rounded-xl bg-slate-900/[0.05] dark:bg-white/[0.05]">
                {([['grid', LayoutGrid, 'Grid view'], ['table', List, 'Table view']] as const).map(([v, VIcon, label]) => (
                  <button
                    key={v}
                    onClick={() => setViewMode(v)}
                    aria-label={label}
                    aria-pressed={viewMode === v}
                    className={`p-1.5 rounded-lg transition ${viewMode === v ? 'bg-white dark:bg-slate-700/80 text-emerald-600 dark:text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                  >
                    <VIcon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ActiveFilterChips filters={filters} search={search} categoryName={categoryName} hideSource={isBids} onRemove={removeChip} onClearAll={resetAll} />

          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400" aria-live="polite">
            <span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {isLoading ? '…' : <AnimatedNumber value={total} duration={0.8} />}
              </span>{' '}
              {isBids ? 'bids' : 'auctions'} found
            </span>
            <div className="flex items-center gap-2 ml-auto mr-3">
              <button
                type="button"
                onClick={openSaveAlert}
                disabled={!canSaveAlert}
                title={canSaveAlert ? 'Get notified when new notices match this search' : 'Add a search or filter first'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <BellPlus className="w-3.5 h-3.5" /> Save as alert
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting || !hasResults}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} Export CSV
              </button>
            </div>
            <AnimatePresence>
              {isFetching && !isLoading && (
                <m.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Updating
                </m.span>
              )}
            </AnimatePresence>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <AuctionCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              title="We couldn't load the list"
              description="The server didn't respond. Check your connection and try again."
              actionLabel="Try again"
              onAction={() => refetch()}
            />
          ) : !hasResults ? (
            <EmptyState
              title={copy.empty}
              description="Try removing a filter or searching for something broader. Filters on price only match notices that publish a price."
              actionLabel="Clear all filters"
              onAction={resetAll}
            />
          ) : viewMode === 'grid' ? (
            <m.div
              variants={stagger(0.05)}
              initial="hidden"
              animate="show"
              className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 transition-opacity duration-200 ${isPlaceholderData ? 'opacity-60' : 'opacity-100'}`}
            >
              {data.data.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </m.div>
          ) : (
            <div className={`transition-opacity duration-200 ${isPlaceholderData ? 'opacity-60' : ''}`}>
              <AuctionTable auctions={data.data} />
            </div>
          )}

          {data?.pagination && (
            <Pagination
              meta={data.pagination}
              onPageChange={(p) => {
                patchParams({ page: p }, true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </div>
      </div>

      {alertOpen && (
        <CreateAlertModal
          isOpen
          onClose={() => setAlertOpen(false)}
          onCreated={() =>
            showToast({ type: 'success', title: 'Alert saved', message: 'You will be notified when matching notices are published.', actionUrl: '/alerts', actionLabel: 'Manage alerts' })
          }
          categories={categories}
          sources={sources}
          initialValues={{
            keywords: search || undefined,
            sources: isBids ? ['GEM_BIDS'] : filters.source ? filters.source.split(',').map((s) => s.trim().toUpperCase()) : undefined,
            category: categories.find((c) => c.slug === filters.category)?.id,
            state: filters.state,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice
          }}
        />
      )}

      <FilterSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title={isBids ? 'Filter bids' : 'Filter auctions'} resultCount={total} onReset={resetAll} activeCount={activeFilterCount}>
        {filtersPanel}
      </FilterSheet>
    </div>
  );
};
