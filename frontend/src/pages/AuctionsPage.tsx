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
import { LayoutGrid, List, SlidersHorizontal, Search, X } from 'lucide-react';

export const AuctionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Parse state from URL params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const search = searchParams.get('search') || '';
  const source = searchParams.get('source') || '';
  const category = searchParams.get('category') || '';
  const state = searchParams.get('state') || '';
  const district = searchParams.get('district') || '';
  const status = searchParams.get('status') || '';
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined;
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined;
  const sortBy = searchParams.get('sortBy') || 'newest';

  const [searchInput, setSearchInput] = useState(search);

  // Sync search input if URL changes
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

  // Query Auctions
  const queryParams: AuctionSearchParams = {
    page,
    limit,
    search: search || undefined,
    source: source || undefined,
    category: category || undefined,
    state: state || undefined,
    district: district || undefined,
    status: status || undefined,
    minPrice,
    maxPrice,
    sortBy
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['auctionsList', queryParams],
    queryFn: () => auctionService.getAuctions(queryParams),
    staleTime: 15000
  });

  const updateFilters = (newFilters: FilterState) => {
    const nextParams = new URLSearchParams();
    if (searchInput) nextParams.set('search', searchInput);
    if (newFilters.source) nextParams.set('source', newFilters.source);
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm dark:shadow-none transition-colors">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Public Auction Explorer</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Search and filter real-time government forward auctions across all connected sources.
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
              placeholder="Search title, ID, org, state..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
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
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shrink-0"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Main Content Layout (Sidebar + Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Desktop Sidebar Filters */}
        <div className="hidden lg:block lg:col-span-1 sticky top-20">
          <AuctionFilters
            filters={{ source, category, state, district, status, minPrice, maxPrice, sortBy }}
            categories={categories}
            states={states}
            onChange={updateFilters}
            onReset={handleResetFilters}
          />
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3 space-y-4">
          {/* Controls Bar: Total Found, Layout Toggle, Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 px-4 py-3 rounded-xl text-xs text-slate-600 dark:text-slate-400 shadow-sm dark:shadow-none">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
              </button>

              <span className="text-xs text-slate-600 dark:text-slate-400">
                Found{' '}
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {data?.pagination.total.toLocaleString('en-IN') || 0}
                </span>{' '}
                auctions
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                <span className="hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="endingSoon">Ending Soonest</option>
                  <option value="lowestPrice">Price: Low to High</option>
                  <option value="highestPrice">Price: High to Low</option>
                  <option value="oldest">Oldest First</option>
                  <option value="recentlyUpdated">Recently Updated</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-950">
                <button
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid View"
                  className={`p-1.5 transition ${
                    viewMode === 'grid'
                      ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  aria-label="Table View"
                  className={`p-1.5 transition ${
                    viewMode === 'table'
                      ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Results Display */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <AuctionCardSkeleton key={i} />
              ))}
            </div>
          ) : isError || !data || data.data.length === 0 ? (
            <EmptyState
              title="No matching auctions discovered"
              description="We couldn't find any auctions matching your active filters. Try searching for broader terms or clearing category/state filters."
              actionLabel="Clear all filters"
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

          {/* Pagination */}
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
              <span className="font-bold text-slate-100 text-sm">Filters</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AuctionFilters
              filters={{ source, category, state, district, status, minPrice, maxPrice, sortBy }}
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
