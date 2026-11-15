import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { Category } from '../../types';
import { formatCompactINR } from '../../utils/formatters';
import { Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';

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
  /** Hide the portal filter (e.g. on the GeM Bids page, where the source is fixed). */
  hideSource?: boolean;
}

export const SOURCE_OPTIONS = [
  { code: '', label: 'All portals' },
  { code: 'GEM', label: 'GeM Forward' },
  { code: 'GEM_BIDS', label: 'GeM Bids' },
  { code: 'CPPP', label: 'CPP Portal' },
  { code: 'MSTC', label: 'MSTC' },
  { code: 'CGSTATE', label: 'Chhattisgarh' },
  { code: 'MOCK', label: 'Sample data' }
];

export const STATUS_OPTIONS = [
  { value: '', label: 'Any status', dot: 'bg-slate-400' },
  { value: 'LIVE', label: 'Live', dot: 'bg-emerald-500' },
  { value: 'ENDING_SOON', label: 'Ending soon', dot: 'bg-amber-500' },
  { value: 'UPCOMING', label: 'Upcoming', dot: 'bg-sky-500' },
  { value: 'CLOSED', label: 'Closed', dot: 'bg-slate-500' }
];

export const PRICE_PRESETS: Array<{ label: string; min?: number; max?: number }> = [
  { label: 'Under ₹1L', max: 100000 },
  { label: '₹1L – 10L', min: 100000, max: 1000000 },
  { label: '₹10L – 1Cr', min: 1000000, max: 10000000 },
  { label: '₹1Cr+', min: 10000000 }
];

/** Human label for a price range, shared with the active-filter chips. */
export function describePriceRange(min?: number, max?: number): string {
  if (min !== undefined && max !== undefined) return `${formatCompactINR(min)} – ${formatCompactINR(max)}`;
  if (min !== undefined) return `${formatCompactINR(min)}+`;
  if (max !== undefined) return `Up to ${formatCompactINR(max)}`;
  return '';
}

const chipBase = 'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 active:scale-95';
const chipOff =
  'bg-slate-900/[0.03] dark:bg-white/[0.04] border-transparent text-slate-600 dark:text-slate-300 hover:border-emerald-500/40 hover:text-slate-900 dark:hover:text-white';
const chipOn = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-semibold shadow-[0_0_0_3px_rgba(16,185,129,0.08)]';

const FilterSection: React.FC<{ title: string; hint?: string; defaultOpen?: boolean; children: React.ReactNode }> = ({
  title,
  hint,
  defaultOpen = true,
  children
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200/70 dark:border-white/[0.06] last:border-0 py-4 first:pt-0 last:pb-0">
      <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center justify-between text-left group">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200 transition-colors">
          {title}
          {hint && <span className="ml-2 normal-case tracking-normal font-medium text-emerald-600 dark:text-emerald-400">{hint}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <m.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-3">{children}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Searchable single-select list, used for long option sets (categories, states). */
const SearchableList: React.FC<{
  options: Array<{ value: string; label: string; count?: number }>;
  value: string;
  allLabel: string;
  placeholder: string;
  onSelect: (value: string) => void;
}> = ({ options, value, allLabel, placeholder, onSelect }) => {
  const [q, setQ] = useState('');
  const filtered = useMemo(() => options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase())), [options, q]);
  const showSearch = options.length > 7;

  return (
    <div className="space-y-2">
      {showSearch && (
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="w-full pl-8 pr-7 py-2 rounded-lg text-xs bg-slate-900/[0.04] dark:bg-white/[0.05] border border-transparent focus:border-emerald-500/50 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      <div role="listbox" aria-label={allLabel} className="max-h-52 overflow-y-auto scrollbar-thin -mx-1 px-1 space-y-0.5">
        {[{ value: '', label: allLabel, count: undefined as number | undefined }, ...filtered].map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value || '__all'}
              role="option"
              aria-selected={selected}
              onClick={() => onSelect(o.value)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition ${
                selected
                  ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${selected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 dark:border-slate-600'}`}>
                  {selected && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />}
                </span>
                <span className="truncate">{o.label}</span>
              </span>
              {o.count !== undefined && <span className="text-[10px] font-mono text-slate-400 shrink-0">{o.count.toLocaleString('en-IN')}</span>}
            </button>
          );
        })}
        {filtered.length === 0 && <div className="px-2 py-3 text-xs text-slate-400 text-center">No matches for “{q}”</div>}
      </div>
    </div>
  );
};

export const AuctionFilters: React.FC<AuctionFiltersProps> = ({ filters, categories, states, onChange, onReset, hideSource }) => {
  const update = (patch: Partial<FilterState>) => {
    const next: FilterState = { ...filters, ...patch };
    (Object.keys(next) as Array<keyof FilterState>).forEach((k) => {
      if (next[k] === '' || next[k] === undefined) delete next[k];
    });
    onChange(next);
  };

  const activeCount = [filters.source && !hideSource, filters.category, filters.state, filters.status, filters.minPrice !== undefined, filters.maxPrice !== undefined].filter(Boolean).length;

  // --- price inputs: local draft + debounce so typing doesn't fire a request per keystroke
  const [minDraft, setMinDraft] = useState(filters.minPrice?.toString() ?? '');
  const [maxDraft, setMaxDraft] = useState(filters.maxPrice?.toString() ?? '');
  const latest = useRef({ filters, update });
  latest.current = { filters, update };

  useEffect(() => setMinDraft(filters.minPrice?.toString() ?? ''), [filters.minPrice]);
  useEffect(() => setMaxDraft(filters.maxPrice?.toString() ?? ''), [filters.maxPrice]);

  useEffect(() => {
    const min = minDraft === '' ? undefined : Math.max(0, Number(minDraft));
    const max = maxDraft === '' ? undefined : Math.max(0, Number(maxDraft));
    if (min === latest.current.filters.minPrice && max === latest.current.filters.maxPrice) return;
    if ((min !== undefined && Number.isNaN(min)) || (max !== undefined && Number.isNaN(max))) return;
    const id = setTimeout(() => latest.current.update({ minPrice: min, maxPrice: max }), 600);
    return () => clearTimeout(id);
  }, [minDraft, maxDraft]);

  const priceInvalid = filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice;
  const activePreset = PRICE_PRESETS.findIndex((p) => p.min === filters.minPrice && p.max === filters.maxPrice);

  const categoryOptions = categories.map((c) => ({ value: c.slug, label: c.name, count: c._count?.auctions }));
  const stateOptions = states.map((s) => ({ value: s.name, label: s.name, count: s.count }));

  return (
    <div className="rounded-2xl p-5 glass-panel shadow-soft">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/70 dark:border-white/[0.06]">
        <div className="flex items-center gap-2 text-sm font-bold font-display text-slate-900 dark:text-white">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
            <SlidersHorizontal className="w-4 h-4" />
          </span>
          Filters
          <AnimatePresence>
            {activeCount > 0 && (
              <m.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center"
              >
                {activeCount}
              </m.span>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence>
          {activeCount > 0 && (
            <m.button
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              onClick={onReset}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </m.button>
          )}
        </AnimatePresence>
      </div>

      <FilterSection title="Status">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTIONS.map((st) => {
            const on = (filters.status || '') === st.value;
            return (
              <button key={st.value} onClick={() => update({ status: st.value })} aria-pressed={on} className={`${chipBase} flex items-center gap-1.5 ${on ? chipOn : chipOff}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </button>
            );
          })}
        </div>
      </FilterSection>

      {!hideSource && (
        <FilterSection title="Portal">
          <div className="flex flex-wrap gap-1.5">
            {SOURCE_OPTIONS.map((s) => {
              const on = (filters.source || '') === s.code;
              return (
                <button key={s.code || 'all'} onClick={() => update({ source: s.code })} aria-pressed={on} className={`${chipBase} ${on ? chipOn : chipOff}`}>
                  {s.label}
                </button>
              );
            })}
          </div>
        </FilterSection>
      )}

      <FilterSection title="Price range" hint={describePriceRange(filters.minPrice, filters.maxPrice)}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {PRICE_PRESETS.map((p, i) => (
              <button
                key={p.label}
                aria-pressed={activePreset === i}
                onClick={() => update(activePreset === i ? { minPrice: undefined, maxPrice: undefined } : { minPrice: p.min, maxPrice: p.max })}
                className={`${chipBase} ${activePreset === i ? chipOn : chipOff}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { v: minDraft, set: setMinDraft, ph: 'Min ₹', label: 'Minimum price' },
              { v: maxDraft, set: setMaxDraft, ph: 'Max ₹', label: 'Maximum price' }
            ].map((f) => (
              <input
                key={f.label}
                type="number"
                min={0}
                inputMode="numeric"
                aria-label={f.label}
                placeholder={f.ph}
                value={f.v}
                onChange={(e) => f.set(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-mono bg-slate-900/[0.04] dark:bg-white/[0.05] border focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 ${
                  priceInvalid ? 'border-rose-500/60' : 'border-transparent focus:border-emerald-500/50'
                }`}
              />
            ))}
          </div>
          {priceInvalid && <p className="text-[11px] text-rose-600 dark:text-rose-400">Minimum is higher than maximum.</p>}
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Only notices that publish a price are matched.</p>
        </div>
      </FilterSection>

      <FilterSection title="Category" defaultOpen={categories.length > 0}>
        <SearchableList
          options={categoryOptions}
          value={filters.category || ''}
          allLabel="All categories"
          placeholder="Search categories…"
          onSelect={(v) => update({ category: v })}
        />
      </FilterSection>

      <FilterSection title="State / UT" defaultOpen={!!filters.state}>
        <SearchableList
          options={stateOptions}
          value={filters.state || ''}
          allLabel="All of India"
          placeholder="Search states…"
          onSelect={(v) => update({ state: v })}
        />
      </FilterSection>
    </div>
  );
};
