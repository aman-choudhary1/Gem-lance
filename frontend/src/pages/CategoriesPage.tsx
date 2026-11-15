import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { m } from 'framer-motion';
import { sourceService } from '../services/sourceService';
import { PageHeader } from '../components/ui/PageHeader';
import { Stagger, StaggerItem } from '../components/motion/Reveal';
import { useSpotlight } from '../hooks/useSpotlight';
import { Compass, ArrowRight, Folder, Search } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const spotlight = useSpotlight();
  const [q, setQ] = useState('');
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categoriesPage'],
    queryFn: () => sourceService.getCategories(),
    staleTime: 300000
  });

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return categories.filter((c) => !needle || c.name.toLowerCase().includes(needle)).sort((a, b) => (b._count?.auctions || 0) - (a._count?.auctions || 0));
  }, [categories, q]);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Compass className="w-6 h-6" />}
        eyebrow="Browse"
        title="Categories"
        description="Explore notices by what is being sold or procured."
        tone="from-emerald-500 to-teal-500"
        actions={
          <label className="relative block">
            <span className="sr-only">Filter categories</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter categories"
              className="w-56 pl-9 pr-3 py-2 rounded-xl text-sm bg-slate-900/5 dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </label>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-200/70 dark:bg-white/[0.05] relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <p className="text-center text-sm text-slate-500 py-10">No categories match "{q}".</p>
      ) : (
        <Stagger key={q} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" gap={0.03} immediate>
          {list.map((cat) => (
            <StaggerItem key={cat.id}>
              <m.div whileHover={{ y: -3 }} onPointerMove={spotlight} className="glass-card rounded-2xl h-full">
                <Link to={`/auctions?category=${encodeURIComponent(cat.slug)}`} className="group p-5 h-full flex flex-col justify-between gap-5 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <span className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      <Folder className="w-5 h-5" />
                    </span>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-900/5 dark:bg-white/10 text-slate-700 dark:text-slate-300">{(cat._count?.auctions || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{cat.name}</h2>
                    <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:gap-2 transition-all">
                      View notices <ArrowRight className="w-3.5 h-3.5" />
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
