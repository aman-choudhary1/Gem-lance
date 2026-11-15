import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowLeft, BellRing, Moon, Radar, ShieldCheck, Sun } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { AnimatedNumber } from '../motion/AnimatedNumber';
import { useTheme } from '../../context/ThemeContext';
import { auctionService } from '../../services/auctionService';
import { fadeUp, stagger } from '../motion/variants';

const ParticlesBackground = lazy(() => import('../effects/ParticlesBackground'));

const FEATURES = [
  { icon: Radar, title: 'One search, every portal', text: 'GeM, CPP, MSTC and state portals in a single, filterable view.' },
  { icon: BellRing, title: 'Alerts that watch for you', text: 'Describe what you want once and get notified when it appears.' },
  { icon: ShieldCheck, title: 'Public data, no credentials', text: 'We never place bids or ask for your portal logins.' }
];

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Full-screen split layout shared by sign-in and sign-up: brand/particles on the left, form on the right. */
export const AuthShell: React.FC<AuthShellProps> = ({ title, subtitle, children, footer }) => {
  const { theme, toggleTheme } = useTheme();
  const { data: stats } = useQuery({ queryKey: ['auctionStats'], queryFn: () => auctionService.getStats(), staleTime: 60000 });

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-slate-50 dark:bg-slate-950">
      {/* ---- Brand panel (always dark) */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 xl:p-16 bg-slate-950 text-white isolate">
        <div className="absolute inset-0 -z-10" aria-hidden>
          <div className="absolute -top-40 -left-32 w-[44rem] h-[44rem] rounded-full bg-emerald-500/25 blur-[120px] animate-aurora-drift" />
          <div className="absolute -bottom-48 -right-24 w-[40rem] h-[40rem] rounded-full bg-violet-600/25 blur-[120px] animate-aurora-drift [animation-delay:-9s]" />
          <div className="absolute top-1/3 left-1/3 w-[28rem] h-[28rem] rounded-full bg-cyan-500/15 blur-[110px] animate-aurora-drift [animation-delay:-4s]" />
          <Suspense fallback={null}>
            <ParticlesBackground id="auth-particles" count={70} tone="dark" />
          </Suspense>
        </div>

        <div className="[&_span]:!text-white">
          <BrandLogo tagline={false} />
        </div>

        <m.div variants={stagger(0.12, 0.1)} initial="hidden" animate="show" className="max-w-lg space-y-10">
          <m.h2 variants={fadeUp} className="text-4xl xl:text-5xl font-extrabold leading-[1.1]">
            Every government auction.
            <br />
            <span className="text-gradient">One clear lens.</span>
          </m.h2>

          <ul className="space-y-5">
            {FEATURES.map(({ icon: Icon, title: t, text }) => (
              <m.li key={t} variants={fadeUp} className="flex gap-4">
                <span className="shrink-0 w-11 h-11 rounded-xl bg-white/[0.07] border border-white/10 backdrop-blur flex items-center justify-center text-emerald-300">
                  <Icon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block font-display font-bold">{t}</span>
                  <span className="block text-sm text-slate-300 leading-relaxed">{text}</span>
                </span>
              </m.li>
            ))}
          </ul>
        </m.div>

        <div className="flex items-center gap-8 text-sm">
          {stats ? (
            <>
              <div>
                <div className="font-display text-3xl font-extrabold tabular-nums">
                  <AnimatedNumber value={stats.overview.totalAuctions} />
                </div>
                <div className="text-slate-400 text-xs mt-0.5">listings indexed</div>
              </div>
              <div className="w-px h-10 bg-white/15" />
              <div>
                <div className="font-display text-3xl font-extrabold tabular-nums">
                  <AnimatedNumber value={stats.overview.totalSources} />
                </div>
                <div className="text-slate-400 text-xs mt-0.5">portals connected</div>
              </div>
            </>
          ) : (
            <span className="text-slate-400 text-xs">Public notices from Indian government portals</span>
          )}
        </div>
      </aside>

      {/* ---- Form panel */}
      <main className="relative flex flex-col min-h-screen">
        <div className="absolute inset-0 -z-0 pointer-events-none lg:hidden" aria-hidden>
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 rounded-full bg-violet-500/15 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center justify-between p-5 sm:p-7">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-300 transition group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to home
          </Link>
          <div className="flex items-center gap-2">
            <div className="lg:hidden">
              <BrandLogo tagline={false} />
            </div>
            <button onClick={toggleTheme} aria-label="Toggle theme" className="p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/10 transition">
              <AnimatePresence mode="wait" initial={false}>
                <m.span key={theme} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.18 }} className="block">
                  {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-indigo-500" />}
                </m.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-8 pb-10">
          <m.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} className="w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-[2.1rem] font-extrabold text-slate-900 dark:text-white">{title}</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">{subtitle}</p>
            </div>
            {children}
            <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</div>
          </m.div>
        </div>
      </main>
    </div>
  );
};
