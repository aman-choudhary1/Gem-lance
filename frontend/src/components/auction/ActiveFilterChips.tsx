import React from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { X } from 'lucide-react';
import { FilterState, SOURCE_OPTIONS, STATUS_OPTIONS, describePriceRange } from './AuctionFilters';

interface ActiveFilterChipsProps {
  filters: FilterState;
  search?: string;
  categoryName?: (slug: string) => string;
  hideSource?: boolean;
  onRemove: (patch: Partial<FilterState> & { search?: string }) => void;
  onClearAll: () => void;
}

const statusLabel = (value: string) =>
  value
    .split(',')
    .map((s) => STATUS_OPTIONS.find((o) => o.value === s.trim().toUpperCase())?.label ?? s)
    .join(' + ');

/** Removable summary of every active filter, so users always see (and can undo) what narrows the list. */
export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({ filters, search, categoryName, hideSource, onRemove, onClearAll }) => {
  const chips: Array<{ key: string; label: string; prefix: string; remove: () => void }> = [];

  if (search) chips.push({ key: 'search', prefix: 'Search', label: `“${search}”`, remove: () => onRemove({ search: '' }) });
  if (filters.status) chips.push({ key: 'status', prefix: 'Status', label: statusLabel(filters.status), remove: () => onRemove({ status: undefined }) });
  if (filters.source && !hideSource) {
    const label = SOURCE_OPTIONS.find((s) => s.code === filters.source)?.label ?? filters.source;
    chips.push({ key: 'source', prefix: 'Portal', label, remove: () => onRemove({ source: undefined }) });
  }
  if (filters.category) chips.push({ key: 'category', prefix: 'Category', label: categoryName?.(filters.category) ?? filters.category, remove: () => onRemove({ category: undefined }) });
  if (filters.state) chips.push({ key: 'state', prefix: 'State', label: filters.state, remove: () => onRemove({ state: undefined }) });
  if (filters.district) chips.push({ key: 'district', prefix: 'District', label: filters.district, remove: () => onRemove({ district: undefined }) });
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    chips.push({
      key: 'price',
      prefix: 'Price',
      label: describePriceRange(filters.minPrice, filters.maxPrice),
      remove: () => onRemove({ minPrice: undefined, maxPrice: undefined })
    });
  }

  if (chips.length === 0) return null;

  return (
    <m.div layout className="flex flex-wrap items-center gap-2" aria-label="Active filters">
      <AnimatePresence mode="popLayout" initial={false}>
        {chips.map((c) => (
          <m.button
            layout
            key={c.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 500, damping: 32 }}
            onClick={c.remove}
            aria-label={`Remove ${c.prefix} filter: ${c.label}`}
            className="group inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 hover:bg-rose-500/10 hover:border-rose-500/40 hover:text-rose-700 dark:hover:text-rose-200 transition-colors"
          >
            <span className="text-[10px] uppercase tracking-wider opacity-70">{c.prefix}</span>
            <span className="font-semibold max-w-[14rem] truncate">{c.label}</span>
            <span className="w-4 h-4 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center group-hover:bg-rose-500/20">
              <X className="w-2.5 h-2.5" strokeWidth={3} />
            </span>
          </m.button>
        ))}
      </AnimatePresence>
      {chips.length > 1 && (
        <m.button layout onClick={onClearAll} className="text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-300 px-2 py-1.5 transition">
          Clear all
        </m.button>
      )}
    </m.div>
  );
};
