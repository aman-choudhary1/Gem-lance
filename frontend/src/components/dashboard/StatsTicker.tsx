import React from 'react';
import { DashboardStats } from '../../types';
import { Gavel, Radio, Clock, CalendarDays, Sparkles, Layers, TrendingUp } from 'lucide-react';

interface StatsTickerProps {
  stats: DashboardStats['overview'];
}

export const StatsTicker: React.FC<StatsTickerProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Auctions',
      value: stats.totalAuctions.toLocaleString('en-IN'),
      icon: Gavel,
      trend: '+12% this week',
      color: 'from-blue-500/15 via-blue-500/5 to-transparent text-blue-500 dark:text-blue-400 border-blue-500/20 dark:border-blue-500/20 shadow-blue-500/5'
    },
    {
      label: 'Live Auctions',
      value: stats.liveAuctions.toLocaleString('en-IN'),
      icon: Radio,
      trend: 'Active bidding',
      color: 'from-emerald-500/15 via-emerald-500/5 to-transparent text-emerald-600 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-500/30 shadow-emerald-500/5',
      isPulse: true
    },
    {
      label: 'Upcoming',
      value: stats.upcomingAuctions.toLocaleString('en-IN'),
      icon: CalendarDays,
      trend: 'Published notices',
      color: 'from-purple-500/15 via-purple-500/5 to-transparent text-purple-600 dark:text-purple-400 border-purple-500/20 dark:border-purple-500/20 shadow-purple-500/5'
    },
    {
      label: 'Ending Today',
      value: stats.endingTodayAuctions.toLocaleString('en-IN'),
      icon: Clock,
      trend: 'Closing soon',
      color: 'from-amber-500/15 via-amber-500/5 to-transparent text-amber-600 dark:text-amber-400 border-amber-500/30 dark:border-amber-500/30 shadow-amber-500/5'
    },
    {
      label: 'New Today',
      value: stats.newTodayAuctions.toLocaleString('en-IN'),
      icon: Sparkles,
      trend: 'Freshly crawled',
      color: 'from-teal-500/15 via-teal-500/5 to-transparent text-teal-600 dark:text-teal-400 border-teal-500/20 dark:border-teal-500/20 shadow-teal-500/5'
    },
    {
      label: 'Active Sources',
      value: `${stats.totalSources} Portals`,
      icon: Layers,
      trend: 'Multi-portal feed',
      color: 'from-slate-500/15 via-slate-500/5 to-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700/40 shadow-slate-500/5'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {cards.map((c, i) => {
        const Icon = c.icon;
        return (
          <div
            key={i}
            className={`rounded-2xl p-4 bg-gradient-to-b border ${c.color} glass-card relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl group`}
          >
            {/* Ambient accent bubble */}
            <div className="absolute -right-4 -bottom-4 w-16 h-16 rounded-full bg-current opacity-10 blur-xl pointer-events-none group-hover:scale-150 transition-transform"></div>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{c.label}</span>
              <div className="p-1.5 rounded-lg bg-current/10 text-current">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono flex items-center gap-2 mb-1.5">
              {c.value}
              {c.isPulse && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              )}
            </div>

            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
              <TrendingUp className="w-3 h-3 opacity-70" />
              <span>{c.trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
