import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { Home, Search } from 'lucide-react';
import { EASE_OUT } from '../components/motion/variants';

export const NotFoundPage: React.FC = () => (
  <div className="max-w-lg mx-auto py-16 text-center">
    <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE_OUT }}>
      <div className="text-[7rem] sm:text-[9rem] leading-none font-extrabold text-gradient select-none" aria-hidden>
        404
      </div>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">This page has closed</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">The page you are looking for does not exist or has moved. Try searching the live notices instead.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">
          <Home className="w-4 h-4" /> Back home
        </Link>
        <Link to="/auctions" className="btn-ghost border border-slate-200 dark:border-white/10">
          <Search className="w-4 h-4" /> Browse auctions
        </Link>
      </div>
    </m.div>
  </div>
);
