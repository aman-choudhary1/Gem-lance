import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { Scale, X } from 'lucide-react';
import { COMPARE_MAX, useCompare } from '../../context/CompareContext';
import { decodeHtmlEntities } from '../../utils/formatters';

/** Floating bar that appears once at least one notice is picked for comparison. */
export const CompareTray: React.FC = () => {
  const { items, remove, clear } = useCompare();
  const { pathname } = useLocation();
  const visible = items.length > 0 && pathname !== '/compare';

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-3xl"
          role="region"
          aria-label="Compare tray"
        >
          <div className="glass-card rounded-2xl px-3 py-2.5 sm:px-4 flex items-center gap-3 shadow-glow-lg">
            <span className="hidden sm:flex w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </span>
            <ul className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {items.map((i) => (
                <li key={i.id} className="shrink-0 max-w-[10rem] flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-slate-900/5 dark:bg-white/10 text-xs text-slate-800 dark:text-slate-100">
                  <span className="truncate">{decodeHtmlEntities(i.title)}</span>
                  <button type="button" onClick={() => remove(i.id)} aria-label={`Remove ${i.title} from comparison`} className="p-0.5 rounded hover:bg-slate-900/10 dark:hover:bg-white/15">
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
              <li className="shrink-0 text-[11px] text-slate-500 dark:text-slate-400">
                {items.length}/{COMPARE_MAX}
              </li>
            </ul>
            <button type="button" onClick={clear} className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0">
              Clear
            </button>
            {items.length >= 2 ? (
              <Link to="/compare" className="btn-primary !py-2 !px-4 !text-xs shrink-0">
                Compare {items.length}
              </Link>
            ) : (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">Pick one more</span>
            )}
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
