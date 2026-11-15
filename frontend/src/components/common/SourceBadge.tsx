import React from 'react';

interface SourceBadgeProps {
  code: string;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ code, className = '' }) => {
  const upper = (code || 'SOURCE').toUpperCase();

  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';

  if (upper === 'GEM') {
    badgeStyle = 'bg-orange-500/15 text-orange-400 border-orange-500/30';
  } else if (upper === 'GEM_BIDS') {
    badgeStyle = 'bg-teal-500/15 text-teal-300 border-teal-500/30';
  } else if (upper === 'CPPP') {
    badgeStyle = 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  } else if (upper === 'DEFPROC') {
    badgeStyle = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  } else if (upper === 'CGSTATE') {
    badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  } else if (upper.endsWith('_TENDERS')) {
    badgeStyle = 'bg-violet-500/15 text-violet-300 border-violet-500/30';
  } else if (upper === 'MSTC') {
    badgeStyle = 'bg-sky-500/15 text-sky-400 border-sky-500/30';
  } else if (upper === 'BANK') {
    badgeStyle = 'bg-purple-500/15 text-purple-400 border-purple-500/30';
  } else if (upper === 'PSU') {
    badgeStyle = 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30';
  } else if (upper === 'MOCK') {
    badgeStyle = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase border font-mono ${badgeStyle} ${className}`}
    >
      {upper}
    </span>
  );
};
