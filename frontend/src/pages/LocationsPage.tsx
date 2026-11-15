import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { sourceService } from '../services/sourceService';
import { PageHeader } from '../components/ui/PageHeader';
import { Stagger, StaggerItem } from '../components/motion/Reveal';
import { useSpotlight } from '../hooks/useSpotlight';
import { MapPin, ArrowRight, Search } from 'lucide-react';

export const LocationsPage: React.FC = () => {
  const spotlight = useSpotlight();
  const [q, setQ] = useState('');
  const { data: states = [], isLoading } = useQuery({
    queryKey: ['statesPage'],
    queryFn: () => sourceService.getStates(),
    staleTime: 300000
  });

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return states.filter((s) => s.name !== 'Not Specified' && (!needle || s.name.toLowerCase().includes(needle))).sort((a, b) => b.count - a.count);
  }, [states, q]);
  const max = Math.max(1, ...list.map((s) => s.count));

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<MapPin className="w-6 h-6" />}
        eyebrow="Browse"
        title="States and union territories"
        description="Find notices near you. Bars show the relative number of notices per state."
        tone="from-sky-500 to-emerald-500"
        actions={
          <label className="relative block">
            <span className="sr-only">Filter states</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter states"
              className="w-56 pl-9 pr-3 py-2 rounded-xl text-sm bg-slate-900/5 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </label>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200/70 dark:bg-white/[0.05] relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-10">No states match "{q}".</p>
      ) : (
        <Stagger key={q} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3" gap={0.02} immediate>
          {list.map((st) => (
            <StaggerItem key={st.name}>
              <m.div whileHover={{ y: -2 }} onPointerMove={spotlight} className="glass-card rounded-2xl h-full">
                <Link to={`/auctions?state=${encodeURIComponent(st.name)}`} className="group p-4 h-full flex flex-col justify-between gap-3 rounded-2xl">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{st.name}</span>
                  <div>
                    <div className="h-1 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.max(4, (st.count / max) * 100)}%` }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-mono">
                      <span>{st.count.toLocaleString('en-IN')} notices</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:text-emerald-500 transition" />
                    </div>
                  </div>
                </Link>
              </m.div>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  );
};
