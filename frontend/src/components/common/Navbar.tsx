import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { demoLoginEnabled } from '../../config/demo';
import { alertService } from '../../services/alertService';
import { Notification } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useClickOutside } from '../../hooks/useClickOutside';
import { BrandLogo } from './BrandLogo';
import {
  Gavel,
  Clock,
  Bookmark,
  Bell,
  Sparkles,
  Layers,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Compass,
  MapPin,
  CheckCheck,
  FileText,
  Sun,
  Moon,
  BarChart3,
  ChevronDown,
  Search,
  LayoutGrid
} from 'lucide-react';

const PRIMARY_LINKS = [
  { label: 'Auctions', path: '/auctions', icon: Gavel },
  { label: 'GeM Bids', path: '/bids', icon: FileText, badge: 'NEW' },
  { label: 'Ending Soon', path: '/ending-soon', icon: Clock, badge: 'LIVE' }
];

const EXPLORE_LINKS = [
  { label: 'Categories', desc: 'Browse by what is being sold', path: '/categories', icon: Compass },
  { label: 'Locations', desc: 'Find lots near you', path: '/locations', icon: MapPin },
  { label: 'Portals', desc: 'All connected auction sources', path: '/sources', icon: Layers },
  { label: 'Analytics', desc: 'Coverage & ingestion reports', path: '/analytics', icon: BarChart3 }
];

const popover = {
  hidden: { opacity: 0, y: -8, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.12 } }
};

type Panel = 'explore' | 'notifications' | 'user' | null;

export const Navbar: React.FC = () => {
  const { user, logout, loginAsDemo, savedAuctionIds } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navRef = useRef<HTMLElement>(null);
  const closePanel = useCallback(() => setPanel(null), []);
  useClickOutside(navRef, closePanel, panel !== null);

  // Close menus on navigation
  useEffect(() => {
    setPanel(null);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Elevate the bar once the page scrolls
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const fetchNotifs = useCallback(async () => {
    if (!user) return;
    try {
      const res = await alertService.getNotifications();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user, fetchNotifs]);

  const handleMarkAllRead = async () => {
    try {
      await alertService.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const toggle = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p));
  const exploreActive = EXPLORE_LINKS.some((l) => location.pathname.startsWith(l.path));

  const iconBtn =
    'relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/5 transition';

  return (
    <header
      ref={navRef}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/80 dark:bg-slate-950/75 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/[0.07] shadow-soft'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6 xl:gap-8">
            <BrandLogo />

            {/* Desktop navigation */}
            <nav className="hidden lg:flex items-center gap-0.5" aria-label="Primary">
              {PRIMARY_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                        isActive
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <m.span
                            layoutId="nav-pill"
                            className="absolute inset-0 rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10 ring-1 ring-emerald-500/25"
                            transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                          />
                        )}
                        <Icon className="relative w-4 h-4" />
                        <span className="relative">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`relative px-1.5 rounded text-[9px] font-bold font-mono ${
                              item.badge === 'LIVE'
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}

              {/* Explore dropdown */}
              <div className="relative">
                <button
                  onClick={() => toggle('explore')}
                  aria-expanded={panel === 'explore'}
                  aria-haspopup="menu"
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                    exploreActive || panel === 'explore'
                      ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  Explore
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${panel === 'explore' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {panel === 'explore' && (
                    <m.div
                      variants={popover}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      role="menu"
                      className="absolute left-0 top-full mt-2 w-80 p-2 rounded-2xl glass-panel shadow-2xl origin-top-left"
                    >
                      {EXPLORE_LINKS.map((l) => {
                        const Icon = l.icon;
                        return (
                          <Link
                            key={l.path}
                            to={l.path}
                            role="menuitem"
                            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-900/5 dark:hover:bg-white/5 transition group"
                          >
                            <span className="w-9 h-9 rounded-lg bg-aurora-soft flex items-center justify-center text-emerald-600 dark:text-emerald-300 group-hover:scale-105 transition">
                              <Icon className="w-4 h-4" />
                            </span>
                            <span>
                              <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">{l.label}</span>
                              <span className="block text-xs text-slate-500 dark:text-slate-400">{l.desc}</span>
                            </span>
                          </Link>
                        );
                      })}
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              {user && (
                <NavLink
                  to="/saved"
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[13px] font-medium transition-colors ${
                      isActive ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`
                  }
                >
                  <Bookmark className="w-4 h-4" />
                  Saved
                  {savedAuctionIds.size > 0 && (
                    <span className="px-1.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                      {savedAuctionIds.size}
                    </span>
                  )}
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link to="/auctions" aria-label="Search auctions" className={`hidden sm:inline-flex ${iconBtn}`}>
              <Search className="w-[18px] h-[18px]" />
            </Link>

            <button onClick={toggleTheme} aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'} className={iconBtn}>
              <AnimatePresence mode="wait" initial={false}>
                <m.span
                  key={theme}
                  initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.18 }}
                  className="block"
                >
                  {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-indigo-500" />}
                </m.span>
              </AnimatePresence>
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button onClick={() => toggle('notifications')} className={iconBtn} aria-label="Notifications" aria-expanded={panel === 'notifications'}>
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-950">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {panel === 'notifications' && (
                    <m.div
                      variants={popover}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      className="absolute right-0 top-full mt-2 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl glass-panel shadow-2xl overflow-hidden origin-top-right"
                    >
                      <div className="flex items-center justify-between p-3.5 border-b border-slate-200/70 dark:border-white/[0.07]">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition">
                            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto scrollbar-thin divide-y divide-slate-200/70 dark:divide-white/[0.06]">
                        {notifications.length === 0 ? (
                          <div className="p-8 text-center">
                            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                            <p className="text-xs text-slate-500 dark:text-slate-400">No notifications yet. Create an alert to get matches here.</p>
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((n) => (
                            <div key={n.id} className={`p-3.5 text-xs ${n.read ? 'opacity-70' : 'bg-emerald-500/[0.06]'}`}>
                              <div className="flex items-start gap-2">
                                {!n.read && <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                                <div className="min-w-0">
                                  <div className="font-semibold text-slate-900 dark:text-slate-100 mb-0.5">{n.title}</div>
                                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{n.message}</p>
                                  {n.auctionId && (
                                    <Link
                                      to={`/auctions/${encodeURIComponent(n.auction?.externalId || n.auctionId)}`}
                                      className="inline-block mt-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                    >
                                      View details →
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <Link to="/notifications" className="block p-2.5 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-slate-900/5 dark:hover:bg-white/5 border-t border-slate-200/70 dark:border-white/[0.07] transition">
                        View all notifications
                      </Link>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Account */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => toggle('user')}
                  aria-expanded={panel === 'user'}
                  className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl hover:bg-slate-900/5 dark:hover:bg-white/5 transition"
                >
                  <span className="w-8 h-8 rounded-lg bg-aurora-gradient text-white font-bold flex items-center justify-center text-sm shadow-glow">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden md:block text-left leading-tight">
                    <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100 max-w-[110px] truncate">{user.name}</span>
                    <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 font-mono uppercase">{user.role}</span>
                  </span>
                  <ChevronDown className={`hidden md:block w-3.5 h-3.5 text-slate-400 transition-transform ${panel === 'user' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {panel === 'user' && (
                    <m.div variants={popover} initial="hidden" animate="show" exit="exit" className="absolute right-0 top-full mt-2 w-60 p-2 rounded-2xl glass-panel shadow-2xl origin-top-right">
                      <div className="px-3 py-2.5 mb-1 border-b border-slate-200/70 dark:border-white/[0.07]">
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                      </div>
                      {[
                        { to: '/saved', icon: Bookmark, label: `Saved auctions (${savedAuctionIds.size})`, color: 'text-emerald-500' },
                        { to: '/interests', icon: Sparkles, label: 'My interests', color: 'text-fuchsia-500' },
                        { to: '/alerts', icon: Bell, label: 'Alert rules', color: 'text-amber-500' },
                        { to: '/notifications', icon: CheckCheck, label: 'Notifications', color: 'text-sky-500' },
                        ...(user.role === 'ADMIN' ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin dashboard', color: 'text-violet-500' }] : [])
                      ].map(({ to, icon: Icon, label, color }) => (
                        <Link key={to} to={to} className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-slate-700 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5 rounded-lg transition">
                          <Icon className={`w-4 h-4 ${color}`} />
                          {label}
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          setPanel(null);
                          logout();
                          navigate('/');
                        }}
                        className="w-full mt-1 flex items-center gap-2.5 px-3 py-2 text-[13px] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-1.5">
                {demoLoginEnabled && (
                  <button onClick={() => loginAsDemo('BUYER')} className="btn-ghost !px-3 !py-1.5 !text-xs">
                    Demo
                  </button>
                )}
                <Link to="/login" className="btn-ghost !px-3.5 !py-2 !text-[13px]">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary !px-4 !py-2 !text-[13px]">
                  Get started
                </Link>
              </div>
            )}

            <button onClick={() => setMobileMenuOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={mobileMenuOpen} className={`lg:hidden ${iconBtn}`}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden border-t border-slate-200/70 dark:border-white/[0.07] bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl max-h-[calc(100vh-4rem)] overflow-y-auto"
          >
            <div className="px-4 py-4 space-y-1.5">
              {[...PRIMARY_LINKS, ...EXPLORE_LINKS.map((l) => ({ ...l, badge: undefined as string | undefined }))].map((item, i) => {
                const Icon = item.icon;
                const active = location.pathname === item.path;
                return (
                  <m.div key={item.path} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition ${
                        active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" />
                      {item.label}
                      {item.badge && <span className="ml-auto px-1.5 rounded text-[9px] font-bold font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300">{item.badge}</span>}
                    </Link>
                  </m.div>
                );
              })}

              {user ? (
                <>
                  <Link to="/saved" className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5">
                    <Bookmark className="w-[18px] h-[18px]" /> Saved ({savedAuctionIds.size})
                  </Link>
                  <Link to="/interests" className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5">
                    <Sparkles className="w-[18px] h-[18px]" /> My interests
                  </Link>
                  <Link to="/alerts" className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5">
                    <Bell className="w-[18px] h-[18px]" /> Alerts
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/5">
                      <ShieldCheck className="w-[18px] h-[18px]" /> Admin
                    </Link>
                  )}
                </>
              ) : (
                <div className="pt-3 grid grid-cols-2 gap-2">
                  <Link to="/login" className="btn-ghost border border-slate-200 dark:border-white/10 !py-2.5">
                    Sign in
                  </Link>
                  <Link to="/register" className="btn-primary !py-2.5">
                    Get started
                  </Link>
                  {demoLoginEnabled && (
                    <>
                      <button onClick={() => loginAsDemo('BUYER')} className="btn-ghost border border-slate-200 dark:border-white/10 !py-2.5 !text-xs">
                        Demo buyer
                      </button>
                      <button onClick={() => loginAsDemo('ADMIN')} className="btn-ghost border border-slate-200 dark:border-white/10 !py-2.5 !text-xs">
                        Demo admin
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  );
};
