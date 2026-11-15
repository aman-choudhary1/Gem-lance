import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sourceService } from '../services/sourceService';
import { SourceBadge } from '../components/common/SourceBadge';
import { Layers, ExternalLink, ArrowRight, ShieldCheck, CheckCircle2, Activity } from 'lucide-react';

export const SourcesPage: React.FC = () => {
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['allSourcesPage'],
    queryFn: () => sourceService.getAllSources(),
    staleTime: 60000
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm dark:shadow-none transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Connected Auction Sources</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Multi-portal aggregator adapters connected to official Indian public auction repositories.
            </p>
          </div>
        </div>

        <Link
          to="/analytics"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition shrink-0"
        >
          <Activity className="w-4 h-4" /> View Ingestion Analytics
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map((s) => (
          <div
            key={s.id}
            className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 hover:border-emerald-500/40 shadow-sm dark:shadow-none transition flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SourceBadge code={s.code} className="text-xs px-2.5 py-1" />
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active Feed
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{s.name}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                  {s.description || 'Public auction portal connector and normalization pipeline.'}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">Indexed Auctions:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">{s._count?.auctions || 0}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              {s.baseUrl && (
                <a
                  href={s.baseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 flex items-center gap-1 transition"
                >
                  Official Portal <ExternalLink className="w-3 h-3" />
                </a>
              )}

              <Link
                to={`/auctions?source=${encodeURIComponent(s.code)}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500"
              >
                Explore Lot Notices <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
