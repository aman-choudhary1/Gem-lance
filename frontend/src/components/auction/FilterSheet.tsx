import React, { useEffect } from 'react';
import { AnimatePresence, m, useDragControls } from 'framer-motion';
import { X } from 'lucide-react';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Number of results with the current filters, shown on the apply button. */
  resultCount?: number;
  onReset?: () => void;
  activeCount?: number;
  children: React.ReactNode;
}

/** Mobile bottom sheet: drag the handle down (or tap outside / press Esc) to dismiss. */
export const FilterSheet: React.FC<FilterSheetProps> = ({ open, onClose, title = 'Filters', resultCount, onReset, activeCount = 0, children }) => {
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-label={title}>
          <m.div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <m.div
            className="absolute inset-x-0 bottom-0 max-h-[88vh] flex flex-col rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/10 shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 38 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 500) onClose();
            }}
          >
            <div className="pt-2.5 pb-1 cursor-grab touch-none" onPointerDown={(e) => controls.start(e)}>
              <div className="mx-auto w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <div className="flex items-center justify-between px-5 pt-3 pb-2">
                <h2 className="font-display font-bold text-lg text-slate-900 dark:text-white">{title}</h2>
                <button onClick={onClose} aria-label="Close filters" className="p-2 -mr-2 rounded-xl text-slate-500 hover:bg-slate-900/5 dark:hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 overscroll-contain">{children}</div>

            <div className="p-4 border-t border-slate-200 dark:border-white/10 flex gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
              {onReset && activeCount > 0 && (
                <button onClick={onReset} className="btn-ghost border border-slate-200 dark:border-white/10 !px-4">
                  Reset
                </button>
              )}
              <button onClick={onClose} className="btn-primary flex-1">
                {resultCount !== undefined ? `Show ${resultCount.toLocaleString('en-IN')} result${resultCount === 1 ? '' : 's'}` : 'Apply'}
              </button>
            </div>
          </m.div>
        </div>
      )}
    </AnimatePresence>
  );
};
