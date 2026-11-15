import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '../motion/Reveal';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: { to: string; label: string };
  align?: 'left' | 'center';
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ eyebrow, title, description, action, align = 'left' }) => (
  <Reveal className={`flex flex-col gap-3 ${align === 'center' ? 'items-center text-center' : 'sm:flex-row sm:items-end sm:justify-between'}`}>
    <div className={`space-y-2 ${align === 'center' ? 'max-w-2xl' : 'max-w-2xl'}`}>
      {eyebrow && (
        <span className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">{eyebrow}</span>
      )}
      <h2 className="text-2xl sm:text-[2rem] font-extrabold text-slate-900 dark:text-white leading-tight">{title}</h2>
      {description && <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>}
    </div>
    {action && (
      <Link to={action.to} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-300 hover:text-emerald-500 shrink-0">
        {action.label}
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </Link>
    )}
  </Reveal>
);
