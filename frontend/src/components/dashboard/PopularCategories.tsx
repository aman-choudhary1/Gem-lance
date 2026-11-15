import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Category } from '../../types';
import { Stagger } from '../motion/Reveal';
import { fadeUp } from '../motion/variants';
import { useSpotlight } from '../../hooks/useSpotlight';
import { Armchair, ArrowUpRight, Box, Building, Car, Factory, Laptop, Pickaxe, Recycle, Wrench } from 'lucide-react';

interface PopularCategoriesProps {
  categories: Category[];
}

const ICONS: Record<string, React.ElementType> = {
  vehicles: Car,
  machinery: Factory,
  scrap: Recycle,
  property: Building,
  electronics: Laptop,
  furniture: Armchair,
  equipment: Wrench,
  mining: Pickaxe
};

const GRADIENTS = [
  'from-emerald-500 to-teal-500',
  'from-cyan-500 to-sky-500',
  'from-violet-500 to-indigo-500',
  'from-amber-500 to-orange-500',
  'from-rose-500 to-pink-500',
  'from-lime-500 to-emerald-500'
];

export const PopularCategories: React.FC<PopularCategoriesProps> = ({ categories }) => {
  const onPointerMove = useSpotlight();
  // Prefer the busiest categories so the tiles are never empty-looking
  const top = [...categories].sort((a, b) => (b._count?.auctions ?? 0) - (a._count?.auctions ?? 0)).slice(0, 6);

  return (
    <Stagger className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4" gap={0.06}>
      {top.map((cat, i) => {
        const Icon = ICONS[cat.slug] ?? Box;
        const count = cat._count?.auctions;
        return (
          <m.div key={cat.id} variants={fadeUp} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 320, damping: 26 }}>
            <Link
              to={`/auctions?category=${encodeURIComponent(cat.slug)}`}
              onPointerMove={onPointerMove}
              className="glass-card rounded-2xl p-4 sm:p-5 flex items-center gap-4 group"
            >
              <span className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} text-white flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform`}>
                <Icon className="w-6 h-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">{cat.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">{count !== undefined ? `${count.toLocaleString('en-IN')} listings` : 'Explore'}</span>
              </span>
              <ArrowUpRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
            </Link>
          </m.div>
        );
      })}
    </Stagger>
  );
};
