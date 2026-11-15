import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auctionService, AuctionSearchParams } from '../services/auctionService';
import { sourceService } from '../services/sourceService';
import { AuctionCard } from '../components/auction/AuctionCard';
import { AuctionTable } from '../components/auction/AuctionTable';
import { AuctionFilters, FilterState } from '../components/auction/AuctionFilters';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { AuctionCardSkeleton } from '../components/common/SkeletonLoader';
import { LayoutGrid, List, SlidersHorizontal, Search, X, FileText } from 'lucide-react';

export const BidsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parse state from URL params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const state = searchParams.get('state') || '';
  const district = searchParams.get('district') || '';
  const status = searchParams.get('status') || '';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const sortBy = searchParams.get('sortBy') || 'newest';

  const [searchInput, setSearchInput] = useState(search);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Fetch Categories & States for Filter UI
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => sourceService.getCategories(),
    staleTime: 300000
  });

  const { data: states = [] } = useQuery({
    queryKey: ['states'],
    queryFn: () => sourceService.getStates(),
    staleTime: 300000
  });

  // Query Auctions with source pinned to GEM_BIDS
  const queryParams: AuctionSearchParams = {
    page,
    limit,
    search: search || undefined,
    source: 'GEM_BIDS',
    category: category || undefined,
    state: state || undefined,
    district: district || undefined,
    status: status || undefined,
    minPrice,
    maxPrice,
    sortBy
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bidsList', queryParams],
    queryFn: () => auctionService.getAuctions(queryParams),
    staleTime: 15000
  });

  const updateFilters = (newFilters: FilterState) => {
    const nextParams = new URLSearchParams();
    if (searchInput) nextParams.set('search', searchInput);
    if (newFilters.category) nextParams.set('category', newFilters.category);
    if (newFilters.state) nextParams.set('state', newFilters.state);
    if (newFilters.district) nextParams.set('district', newFilters.district);
    if (newFilters.status) nextParams.set('status', newFilters.status);
    if (newFilters.minPrice !== undefined) nextParams.set('minPrice', String(newFilters.minPrice));
    if (newFilters.maxPrice !== undefined) nextParams.set('maxPrice', String(newFilters.maxPrice));
    if (newFilters.sortBy) nextParams.set('sortBy', newFilters.sortBy);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      nextParams.set('search', searchInput.trim());
    } else {
      nextParams.delete('search');
    }
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', String(newPage));
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSort: string) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('sortBy', newSort);
    nextParams.set('page', '1');
    setSearchParams(nextParams);
  };

  const filterState: FilterState = {
    source: 'GEM_BIDS',
    category: category || undefined,
    state: state || undefined,
    district: district || undefined,
    status: status || undefined,
    minPrice,
    maxPrice,
    sortBy
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm dark:shadow-none transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <FileText className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">GeM Procurement Bids & RAs</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-700 dark:text-teal-300 font-mono">
              BIDPLUS FEED
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Official government procurement notices, reverse auctions (RAs), and BOQ tenders from GeM BidPlus.
          </p>
        </div>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search bid number, item, ministry..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  const nextParams = new URLSearchParams(searchParams);
                  nextParams.delete('search');
                  setSearchParams(nextParams);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold transition shrink-0"
          >
            Search
          </button>
        </form>
      </div>

      {/* Main Filter & Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Filters - Desktop */}
        <div className="hidden lg:block lg:col-span-1 sticky top-20">
          <AuctionFilters
            filters={filterState}
            categories={categories}
            states={states}
            onChange={updateFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Mobile Filter Button */}
        <div className="lg:hidden flex items-center justify-between">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-200"
          >
            <SlidersHorizontal className="w-4 h-4 text-teal-400" />
            Filter GeM Bids
          </button>
          <span className="text-xs text-slate-400">
            {data?.pagination?.total ? `${data.pagination.total} Bids Found` : ''}
          </span>
        </div>

        {/* Right Results Grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center justify-between bg-white/80 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 shadow-sm dark:shadow-none">
            <div>
              {isLoading ? (
                <span>Loading GeM bids...</span>
              ) : (
                <span>
                  Showing <strong className="text-slate-900 dark:text-white">{data?.data?.length || 0}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">{data?.pagination?.total || 0}</strong> active GeM bids
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="endingSoon">Ending Soonest</option>
                  <option value="lowestPrice">Price: Low to High</option>
                  <option value="highestPrice">Price: High to Low</option>
                  <option value="oldest">Oldest First</option>
                  <option value="recentlyUpdated">Recently Updated</option>
                </select>
              </div>

              {/* View Switcher */}
              <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid View"
                  className={`p-1.5 transition ${
                    viewMode === 'grid' ? 'bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  aria-label="Table View"
                  className={`p-1.5 transition ${
                    viewMode === 'table' ? 'bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <AuctionCardSkeleton key={idx} />
              ))}
            </div>
          ) : isError || !data || data.data.length === 0 ? (
            <EmptyState
              title="No GeM Bids Found"
              description="No active GeM procurement bids match your selected filters. Try broadening your search or resetting filters."
              actionLabel="Clear Filters"
              onAction={handleResetFilters}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.data.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <AuctionTable auctions={data.data} />
          )}

          {/* Pagination Controls */}
          {data && data.pagination && (
            <Pagination meta={data.pagination} onPageChange={handlePageChange} />
          )}
        </div>
      </div>

      {/* Mobile Filters Drawer Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm lg:hidden">
          <div className="w-full max-w-xs bg-slate-900 h-full p-5 overflow-y-auto space-y-4 border-l border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-slate-100 text-sm">Filter GeM Bids</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AuctionFilters
              filters={filterState}
              categories={categories}
              states={states}
              onChange={(f) => {
                updateFilters(f);
                setMobileFilterOpen(false);
              }}
              onReset={() => {
                handleResetFilters();
                setMobileFilterOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
