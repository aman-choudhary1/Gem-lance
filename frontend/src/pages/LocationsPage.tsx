import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sourceService } from '../services/sourceService';
import { MapPin, ArrowRight } from 'lucide-react';

export const LocationsPage: React.FC = () => {
  const { data: states = [] } = useQuery({
    queryKey: ['statesPage'],
    queryFn: () => sourceService.getStates(),
    staleTime: 300000
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">State & Location Directory</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Browse public forward auctions indexed across Indian States & Union Territories.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {states.map((st) => (
          <Link
            key={st.name}
            to={`/auctions?state=${encodeURIComponent(st.name)}`}
            className="p-4 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition group flex flex-col justify-between space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition">
                {st.name}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
              <span>{st.count} notices</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
