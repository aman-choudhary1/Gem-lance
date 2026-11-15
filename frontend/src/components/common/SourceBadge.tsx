import React from 'react';

interface SourceBadgeProps {
  code: string;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ code, className = '' }) => {
  const upper = (code || 'SOURCE').toUpperCase();

  let badgeStyle = 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30';

  if (upper === 'GEM') {
    badgeStyle = 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30';
  } else if (upper === 'GEM_BIDS') {
    badgeStyle = 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30';
  } else if (upper === 'CPPP') {
    badgeStyle = 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30';
  } else if (upper === 'DEFPROC') {
    badgeStyle = 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30';
  } else if (upper === 'CGSTATE') {
    badgeStyle = 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
  } else if (upper.endsWith('_TENDERS')) {
    badgeStyle = 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30';
  } else if (upper === 'MSTC') {
    badgeStyle = 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30';
  } else if (upper === 'BANK') {
    badgeStyle = 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30';
  } else if (upper === 'PSU') {
    badgeStyle = 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border-indigo-500/30';
  } else if (upper === 'MOCK') {
    badgeStyle = 'bg-yellow-400/15 text-yellow-700 dark:text-yellow-300 border-yellow-500/40 border-dashed';
  }

  // Sample (mock) records are labelled explicitly so they are never mistaken for real notices.
  const isSample = upper === 'MOCK';

  return (
    <span
      title={isSample ? 'Sample data for demonstration only — not a real auction notice' : undefined}
      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase border font-mono ${badgeStyle} ${className}`}
    >
      {isSample ? 'SAMPLE DATA' : upper}
    </span>
  );
};
