import React from 'react';
import { AuctionStatus } from '../../types';

interface StatusBadgeProps {
  status: AuctionStatus;
  className?: string;
  showDot?: boolean;
}

const STYLES: Record<string, { label: string; wrap: string; dot: string; pulse?: boolean }> = {
  LIVE: {
    label: 'Live',
    wrap: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    dot: 'bg-emerald-500',
    pulse: true
  },
  ENDING_SOON: {
    label: 'Ending soon',
    wrap: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/35',
    dot: 'bg-amber-500',
    pulse: true
  },
  UPCOMING: {
    label: 'Upcoming',
    wrap: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    dot: 'bg-sky-500'
  },
  CLOSED: {
    label: 'Closed',
    wrap: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/25',
    dot: 'bg-slate-400'
  },
  CANCELLED: {
    label: 'Cancelled',
    wrap: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    dot: 'bg-rose-500'
  }
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '', showDot = true }) => {
  const s = STYLES[status] ?? {
    label: String(status).replace('_', ' ').toLowerCase(),
    wrap: 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/25',
    dot: 'bg-slate-400'
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap border capitalize ${s.wrap} ${className}`}>
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {s.pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${s.dot}`} />}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${s.dot}`} />
        </span>
      )}
      {s.label}
    </span>
  );
};
