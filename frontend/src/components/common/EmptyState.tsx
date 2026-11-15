import React from 'react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No auctions found',
  description = 'Try adjusting your search keywords, clearing selected filters, or checking back later.',
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-none">
      <div className="p-4 bg-slate-100 dark:bg-slate-800/60 rounded-full text-slate-500 dark:text-slate-400 mb-4">
        {icon || <SearchX className="w-8 h-8" />}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition shadow-lg shadow-emerald-900/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
