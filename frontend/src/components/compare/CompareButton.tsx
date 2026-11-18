import React from 'react';
import { Scale } from 'lucide-react';
import { Auction } from '../../types';
import { COMPARE_MAX, useCompare } from '../../context/CompareContext';
import { useToast } from '../../context/ToastContext';

/** Adds/removes a notice from the comparison tray. Stops the click from opening the card link. */
export const CompareButton: React.FC<{ auction: Auction; className?: string; size?: 'sm' | 'md' }> = ({ auction, className = '', size = 'md' }) => {
  const { has, toggle } = useCompare();
  const { showToast } = useToast();
  const on = has(auction.id);

  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = toggle({ id: auction.id, externalId: auction.externalId, title: auction.title });
    if (!ok) {
      showToast({ type: 'warning', title: `You can compare up to ${COMPARE_MAX} notices`, message: 'Remove one from the compare tray to add another.' });
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-pressed={on}
      aria-label={on ? 'Remove from comparison' : 'Add to comparison'}
      title={on ? 'Remove from comparison' : 'Compare'}
      className={`relative z-10 rounded-lg border transition ${size === 'sm' ? 'p-1.5' : 'p-1.5'} ${
        on
          ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 border-cyan-500/40'
          : 'text-slate-400 border-slate-200 dark:border-white/10 hover:text-cyan-600 dark:hover:text-cyan-300 hover:border-cyan-500/40'
      } ${className}`}
    >
      <Scale className="w-4 h-4" />
    </button>
  );
};
