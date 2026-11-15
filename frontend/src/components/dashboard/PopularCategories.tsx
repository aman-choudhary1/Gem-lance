import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types';
import {
  Car,
  Factory,
  Recycle,
  Building,
  Laptop,
  Armchair,
  Wrench,
  Pickaxe,
  Box,
  ChevronRight
} from 'lucide-react';

interface PopularCategoriesProps {
  categories: Category[];
}

const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case 'vehicles':
      return Car;
    case 'machinery':
      return Factory;
    case 'scrap':
      return Recycle;
    case 'property':
      return Building;
    case 'electronics':
      return Laptop;
    case 'furniture':
      return Armchair;
    case 'equipment':
      return Wrench;
    case 'mining':
      return Pickaxe;
    default:
      return Box;
  }
};

export const PopularCategories: React.FC<PopularCategoriesProps> = ({ categories }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <span>Popular Categories</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">Direct filter access</span>
        </h3>
        <Link
          to="/categories"
          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1"
        >
          View all <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {categories.slice(0, 6).map((cat) => {
          const Icon = getCategoryIcon(cat.slug);
          return (
            <Link
              key={cat.id}
              to={`/auctions?category=${encodeURIComponent(cat.slug)}`}
              className="glass-card p-3.5 rounded-xl flex items-center gap-3 group hover:border-emerald-500/40 transition"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500/20 group-hover:scale-105 transition shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition">
                  {cat.name}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  {cat._count ? `${cat._count.auctions} auctions` : 'Explore'}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
