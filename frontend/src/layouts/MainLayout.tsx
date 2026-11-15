import React, { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { ScrollProgress } from '../components/motion/ScrollProgress';

/** Scroll to the top on page navigation (but not when only the query string changes, e.g. filters). */
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
};

const PageFallback: React.FC = () => (
  <div className="py-32 flex flex-col items-center gap-4" role="status" aria-label="Loading page">
    <div className="relative w-12 h-12">
      <span className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 border-r-cyan-400 animate-spin" />
    </div>
    <span className="text-xs text-slate-500 dark:text-slate-400 tracking-wide">Loading…</span>
  </div>
);

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <AnimatePresence>
      {visible && (
        <m.button
          initial={{ opacity: 0, y: 16, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.8 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-2xl btn-primary !p-0 shadow-glow-lg"
        >
          <ArrowUp className="w-5 h-5" />
        </m.button>
      )}
    </AnimatePresence>
  );
};

export const MainLayout: React.FC = () => {
  const { pathname } = useLocation();

  return (
    <div className="relative min-h-screen flex flex-col text-slate-900 dark:text-slate-100">
      {/* Ambient aurora + dotted grid behind every page */}
      <div className="app-backdrop" aria-hidden>
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="grid-dots" />
      </div>

      <ScrollProgress />
      <ScrollToTop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-emerald-600 focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-14">
        {/* Lazy pages suspend here so the navbar/footer stay visible; each route fades in on entry */}
        <Suspense fallback={<PageFallback />}>
          <m.div
            key={pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </m.div>
        </Suspense>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
};
