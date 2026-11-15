import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { sourceService } from '../services/sourceService';
import { SourceBadge } from '../components/common/SourceBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { AnimatedNumber } from '../components/motion/AnimatedNumber';
import { Stagger, StaggerItem } from '../components/motion/Reveal';
import { useSpotlight } from '../hooks/useSpotlight';
import { Layers, ExternalLink, ArrowRight, Activity } from 'lucide-react';

export const SourcesPage: React.FC = () => {
  const spotlight = useSpotlight();
  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['allSourcesPage'],
    queryFn: () => sourceService.getAllSources(),
    staleTime: 60000
  });

  const total = sources.reduce((n, s) => n + (s._count?.auctions || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Layers className="w-6 h-6" />}
        eyebrow="Data sources"
        title="Connected portals"
        description="Every notice on AuctionLens is collected from an official public portal. Each card links back to its source."
        tone="from-sky-500 to-violet-500"
        actions={
          <>
            {!isLoading && (
              <div className="text-right mr-2">
                <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  <AnimatedNumber value={total} />
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">notices across {sources.length} sources</div>
              </div>
            )}
            <Link to="/analytics" className="btn-primary">
              <Activity className="w-4 h-4" /> Ingestion analytics
            </Link>
          </>
        }
      />

      {isLoading ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-200/70 dark:bg-white/[0.05] relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : (
        <Stagger className="grid md:grid-cols-2 xl:grid-cols-3 gap-4" gap={0.04} immediate>
          {sources.map((s) => {
            const count = s._count?.auctions || 0;
            const share = total ? Math.max(3, (count / total) * 100) : 0;
            return (
              <StaggerItem key={s.id}>
                <m.article whileHover={{ y: -3 }} onPointerMove={spotlight} className="glass-card rounded-2xl p-5 h-full flex flex-col justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <SourceBadge code={s.code} className="!text-[11px]" />
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                        </span>
                        Connected
                      </span>
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{s.name}</h2>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-400 line-clamp-2">{s.description || 'Official public procurement portal.'}</p>
                    </div>
                    <div>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Indexed notices</span>
                        <span className="font-bold font-mono text-slate-900 dark:text-white">{count.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <m.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${share}%` }} transition={{ duration: 0.9, delay: 0.2 }} />
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between">
                    {s.baseUrl ? (
                      <a href={s.baseUrl} target="_blank" rel="noreferrer noopener" className="text-xs text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 inline-flex items-center gap-1 transition">
                        Official portal <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span />
                    )}
                    <Link to={`/auctions?source=${encodeURIComponent(s.code)}`} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-1.5 transition-all">
                      Browse notices <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </m.article>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}
    </div>
  );
};
