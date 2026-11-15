import React from 'react';
import { Category } from '../../types';
import { Filter, X, RotateCcw } from 'lucide-react';

export interface FilterState {
  source?: string;
  category?: string;
  state?: string;
  district?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}

interface AuctionFiltersProps {
  filters: FilterState;
  categories: Category[];
  states: Array<{ name: string; count: number }>;
  onChange: (newFilters: FilterState) => void;
  onReset: () => void;
}

const SOURCES = [
  { code: '', label: 'All Sources' },
  { code: 'GEM', label: 'GeM Forward' },
  { code: 'GEM_BIDS', label: 'GeM Bids (BidPlus)' },
  { code: 'MSTC', label: 'MSTC E-Auction' },
  { code: 'BANK', label: 'Bank Auctions' },
  { code: 'PSU', label: 'PSU Portals' },
  { code: 'MOCK', label: 'Simulation Feed' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'LIVE', label: 'Live' },
  { value: 'ENDING_SOON', label: 'Ending Soon' },
  { value: 'UPCOMING', label: 'Upcoming' },
  { value: 'CLOSED', label: 'Closed' }
];

export const AuctionFilters: React.FC<AuctionFiltersProps> = ({
  filters,
  categories,
  states,
  onChange,
  onReset
}) => {
  const updateField = (key: keyof FilterState, value: any) => {
    onChange({
      ...filters,
      [key]: value === '' ? undefined : value
    });
  };

  const hasActiveFilters = Object.values(filters).some((v) => v !== undefined && v !== '');

  return (
    <div className="bg-white/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-6 shadow-sm dark:shadow-none transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-200">
          <Filter className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          Filter Listings
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all
          </button>
        )}
      </div>

      {/* 1. Source Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
          Auction Portal / Source
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {SOURCES.map((s) => {
            const isSelected = (filters.source || '') === s.code;
            return (
              <button
                key={s.code}
                onClick={() => updateField('source', s.code)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-900/20'
                    : 'bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Status Filter */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Auction Status
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((st) => {
            const isSelected = (filters.status || '') === st.value;
            return (
              <button
                key={st.value}
                onClick={() => updateField('status', st.value)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  isSelected
                    ? 'bg-slate-200 text-slate-950 font-bold'
                    : 'bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Category Select */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Category
        </label>
        <select
          value={filters.category || ''}
          onChange={(e) => updateField('category', e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>
              {c.name} {c._count ? `(${c._count.auctions})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 4. State & District Select */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          State / Territory
        </label>
        <select
          value={filters.state || ''}
          onChange={(e) => updateField('state', e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="">All States in India</option>
          {states.map((s) => (
            <option key={s.name} value={s.name}>
              {s.name} ({s.count})
            </option>
          ))}
        </select>
      </div>

      {/* 5. Price Range (INR) */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
          Starting Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Min ₹"
            value={filters.minPrice !== undefined ? filters.minPrice : ''}
            onChange={(e) => updateField('minPrice', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          />
          <input
            type="number"
            placeholder="Max ₹"
            value={filters.maxPrice !== undefined ? filters.maxPrice : ''}
            onChange={(e) => updateField('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>
      </div>
    </div>
  );
};
