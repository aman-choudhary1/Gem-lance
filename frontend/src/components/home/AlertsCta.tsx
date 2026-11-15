import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { ArrowRight, BellRing } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Reveal } from '../motion/Reveal';

export const AlertsCta: React.FC = () => {
  const { user } = useAuth();
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-[2rem] p-8 sm:p-12 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-glow-lg">
        {/* decorative rings */}
        <m.div aria-hidden animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full border border-white/20" />
        <m.div aria-hidden animate={{ rotate: -360 }} transition={{ duration: 80, repeat: Infinity, ease: 'linear' }} className="pointer-events-none absolute -right-10 -top-10 w-56 h-56 rounded-full border border-dashed border-white/25" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-white/10 blur-3xl" aria-hidden />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur">
              <BellRing className="w-3.5 h-3.5" /> Never miss a lot
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">Tell us what you're hunting for. We'll watch the portals.</h2>
            <p className="text-white/85 text-sm sm:text-base leading-relaxed">
              Create an alert with keywords, a state and a price range. Matching notices land in your notifications the moment they're published.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              to={user ? '/alerts' : '/register'}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-emerald-700 font-bold text-sm shadow-xl hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.98] transition"
            >
              {user ? 'Create an alert' : 'Create free account'} <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link to="/login" className="inline-flex items-center px-5 py-3.5 rounded-2xl border border-white/40 font-semibold text-sm hover:bg-white/10 transition">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
};
