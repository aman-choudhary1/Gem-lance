import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { demoLoginEnabled } from '../../config/demo';
import { alertService } from '../../services/alertService';
import { Notification } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  Gavel,
  Clock,
  Bookmark,
  Bell,
  Layers,
  ShieldCheck,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Compass,
  MapPin,
  CheckCheck,
  FileText,
  Sun,
  Moon,
  BarChart3
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, loginAsDemo, savedAuctionIds } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    if (user) {
      try {
        const res = await alertService.getNotifications();
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await alertService.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore
    }
  };

  const navLinks = [
    { label: 'Auctions', path: '/auctions', icon: Gavel },
    { label: 'GeM Bids', path: '/bids', icon: FileText, badge: 'NEW' },
    { label: 'Ending Soon', path: '/ending-soon', icon: Clock, badge: 'LIVE' },
    { label: 'Sources', path: '/sources', icon: Layers },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Categories', path: '/categories', icon: Compass },
    { label: 'Locations', path: '/locations', icon: MapPin },
    { label: 'Saved', path: '/saved', icon: Bookmark, count: savedAuctionIds.size, requiresAuth: true },
    { label: 'Alerts', path: '/alerts', icon: Bell, requiresAuth: true },
    { label: 'Admin', path: '/admin', icon: ShieldCheck, requiresAdmin: true }
  ];

  const filteredLinks = navLinks.filter((link) => {
    if (link.requiresAdmin && (!user || user.role !== 'ADMIN')) return false;
    if (link.requiresAuth && !user) return false;
    return true;
  });

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-900/30 group-hover:scale-105 transition">
                <Gavel className="w-5 h-5 text-white dark:text-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400">
                    AuctionLens
                  </span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>
                <span className="hidden sm:block text-[10px] tracking-wider uppercase text-slate-400 font-medium">
                  Multi-Portal Intelligence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {filteredLinks.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold shadow-sm dark:shadow-inner'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 font-mono">
                        {item.badge}
                      </span>
                    )}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher if Not Logged In (development builds only) */}
            {!user && demoLoginEnabled && (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => loginAsDemo('BUYER')}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                >
                  Demo Buyer
                </button>
                <button
                  onClick={() => loginAsDemo('ADMIN')}
                  className="px-2.5 py-1 text-xs rounded-lg border border-emerald-800/60 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 transition"
                >
                  Demo Admin
                </button>
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-transparent transition"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Notification Bell */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => {
                    setNotificationOpen(!notificationOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition relative"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-950 animate-pulse"></span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-200">Alert Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 transition"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800/60">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500">
                          No alerts or notifications yet. Create custom alerts to receive matches!
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition ${
                              n.read ? 'bg-white dark:bg-slate-900/40 text-slate-500 dark:text-slate-400' : 'bg-emerald-50 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-200'
                            }`}
                          >
                            <div className="font-semibold text-slate-900 dark:text-slate-200 mb-1">{n.title}</div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{n.message}</p>
                            {n.auctionId && (
                              <Link
                                to={`/auctions/${n.auction?.externalId || n.auctionId}`}
                                onClick={() => setNotificationOpen(false)}
                                className="inline-block mt-2 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                              >
                                View Auction Details &rarr;
                              </Link>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-center">
                      <Link
                        to="/notifications"
                        onClick={() => setNotificationOpen(false)}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile / Auth Action */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setNotificationOpen(false);
                  }}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{user.name}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono uppercase">{user.role}</div>
                  </div>
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 space-y-1">
                    <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-slate-200">{user.name}</div>
                      <div className="text-slate-500 dark:text-slate-400 truncate">{user.email}</div>
                    </div>
                    <Link
                      to="/saved"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <Bookmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Saved Auctions ({savedAuctionIds.size})
                    </Link>
                    <Link
                      to="/alerts"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                    >
                      <Bell className="w-4 h-4 text-amber-500" />
                      Auction Alert Rules
                    </Link>
                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                      >
                        <ShieldCheck className="w-4 h-4 text-sky-500" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30 transition flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5" />
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-2">
          {filteredLinks.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition ${
                  isActive ? 'bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          {!user && demoLoginEnabled && (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  loginAsDemo('BUYER');
                  setMobileMenuOpen(false);
                }}
                className="py-2 text-xs text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
              >
                Demo Buyer
              </button>
              <button
                onClick={() => {
                  loginAsDemo('ADMIN');
                  setMobileMenuOpen(false);
                }}
                className="py-2 text-xs text-center rounded-lg border border-emerald-800 bg-emerald-950/50 text-emerald-300"
              >
                Demo Admin
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
