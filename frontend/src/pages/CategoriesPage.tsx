import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sourceService } from '../services/sourceService';
import { Compass, ArrowRight, Folder } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ['categoriesPage'],
    queryFn: () => sourceService.getCategories(),
    staleTime: 300000
  });

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-2 shadow-sm dark:shadow-none transition-colors">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Category Directory</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Explore publicly indexed forward auctions organized by asset classification.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/auctions?category=${encodeURIComponent(cat.slug)}`}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 shadow-sm dark:shadow-none transition group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition">
                <Folder className="w-5 h-5" />
              </div>
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                {cat._count?.auctions || 0} auctions
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                {cat.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Browse all public forward auction notices tagged under {cat.name}.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>View Listings</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
