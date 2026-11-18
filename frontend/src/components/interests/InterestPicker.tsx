import React from 'react';
import { m } from 'framer-motion';
import {
  Armchair, Boxes, Briefcase, Building2, Car, Check, ClipboardList, Cpu, Factory, HardHat, Landmark,
  Package, Pickaxe, Recycle, Stethoscope, Trees, Wrench, LucideIcon
} from 'lucide-react';
import { Category } from '../../types';
import { stagger, fadeUp } from '../motion/variants';

/** Pick an icon from the category name so the tiles are easy to scan. */
function iconFor(name: string): LucideIcon {
  const n = name.toLowerCase();
  if (n.includes('vehicle')) return Car;
  if (n.includes('scrap')) return Recycle;
  if (n.includes('it ') || n.startsWith('it&') || n.includes('electronic')) return Cpu;
  if (n.includes('property')) return Building2;
  if (n.includes('machinery')) return Factory;
  if (n.includes('furniture')) return Armchair;
  if (n.includes('state government')) return Landmark;
  if (n.includes('works')) return HardHat;
  if (n.includes('medical')) return Stethoscope;
  if (n.includes('plant') || n.includes('equipment')) return Wrench;
  if (n.includes('forest') || n.includes('agri')) return Trees;
  if (n.includes('mining')) return Pickaxe;
  if (n.includes('service')) return Briefcase;
  if (n.includes('surplus')) return Boxes;
  if (n.includes('procurement')) return ClipboardList;
  return Package;
}

/**
 * The category list as the API returns it can hold legacy duplicates (same name, old slug, no notices).
 * Keep one per name, the one that actually has notices, and hide empty ones.
 */
export function pickableCategories(categories: Category[]): Category[] {
  const best = new Map<string, Category>();
  for (const c of categories) {
    const count = c._count?.auctions ?? 0;
    if (count === 0) continue;
    const key = c.name.trim().toLowerCase();
    const current = best.get(key);
    if (!current || count > (current._count?.auctions ?? 0)) best.set(key, c);
  }
  return [...best.values()].sort((a, b) => (b._count?.auctions ?? 0) - (a._count?.auctions ?? 0));
}

interface InterestPickerProps {
  categories: Category[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  max: number;
}

export const InterestPicker: React.FC<InterestPickerProps> = ({ categories, selected, onToggle, max }) => {
  const full = selected.size >= max;
  return (
    <m.ul variants={stagger(0.04)} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" role="group" aria-label="Categories">
      {categories.map((c) => {
        const on = selected.has(c.id);
        const Icon = iconFor(c.name);
        const disabled = !on && full;
        return (
          <m.li key={c.id} variants={fadeUp}>
            <button
              type="button"
              onClick={() => onToggle(c.id)}
              disabled={disabled}
              aria-pressed={on}
              className={`group w-full text-left flex items-center gap-3.5 p-4 rounded-2xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                on
                  ? 'border-emerald-500/60 bg-emerald-500/10 shadow-glow'
                  : 'border-slate-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.04] hover:border-emerald-500/40 hover:-translate-y-0.5'
              }`}
            >
              <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${on ? 'bg-emerald-500 text-white' : 'bg-slate-900/5 dark:bg-white/[0.08] text-emerald-600 dark:text-emerald-300'}`}>
                {on ? <Check className="w-5 h-5" strokeWidth={3} /> : <Icon className="w-5 h-5" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white leading-snug">{c.name}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{(c._count?.auctions ?? 0).toLocaleString('en-IN')} notices</span>
              </span>
            </button>
          </m.li>
        );
      })}
    </m.ul>
  );
};
