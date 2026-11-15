import React from 'react';
import { useCountdown } from '../../hooks/useCountdown';
import { Clock } from 'lucide-react';

interface CountdownTimerProps {
  endTime: string;
  className?: string;
  showIcon?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endTime,
  className = '',
  showIcon = true
}) => {
  const { formatted, isUrgent, isExpired } = useCountdown(endTime);

  if (isExpired) {
    return (
      <span className={`inline-flex items-center gap-1 text-xs text-slate-500 font-mono ${className}`}>
        {showIcon && <Clock className="w-3.5 h-3.5" />}
        Ended
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded ${
        isUrgent
          ? 'bg-amber-500/15 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 animate-pulse'
          : 'bg-emerald-50 dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
      } ${className}`}
    >
      {showIcon && <Clock className="w-3.5 h-3.5" />}
      {formatted}
    </span>
  );
};
