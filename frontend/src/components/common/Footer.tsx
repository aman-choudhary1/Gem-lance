import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

const EXPLORE = [
  { to: '/auctions', label: 'Forward auctions' },
  { to: '/bids', label: 'GeM procurement bids' },
  { to: '/ending-soon', label: 'Ending soon' },
  { to: '/categories', label: 'Categories' },
  { to: '/locations', label: 'Locations' }
];

const ACCOUNT = [
  { to: '/saved', label: 'Saved auctions' },
  { to: '/alerts', label: 'Alert rules' },
  { to: '/sources', label: 'Connected portals' },
  { to: '/analytics', label: 'Coverage analytics' }
];

const PORTALS = [
  { href: 'https://forwardauction.gem.gov.in', label: 'GeM Forward Auction' },
  { href: 'https://bidplus.gem.gov.in', label: 'GeM BidPlus' },
  { href: 'https://www.mstcecommerce.com', label: 'MSTC e-Commerce' },
  { href: 'https://eprocure.gov.in', label: 'CPP Portal' }
];

const linkCls = 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition inline-flex items-center gap-1';

export const Footer: React.FC = () => {
  return (
    <footer className="relative mt-8 border-t border-slate-200/80 dark:border-white/[0.07] bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl">
      {/* aurora hairline */}
      <div className="absolute -top-px left-0 right-0 h-px bg-aurora-gradient opacity-70" aria-hidden />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8 text-sm">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 mb-12">
          <div className="col-span-2 md:col-span-4 space-y-4">
            <BrandLogo tagline={false} />
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              One place to discover public auctions and procurement bids from Indian government portals. Search, filter, save and get alerted, then bid on the official site.
            </p>
            <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              We never place bids or store portal credentials
            </div>
          </div>

          <div className="md:col-span-2">
            <h4 className="font-display font-bold text-slate-900 dark:text-white mb-4">Explore</h4>
            <ul className="space-y-2.5">
              {EXPLORE.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={linkCls}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-display font-bold text-slate-900 dark:text-white mb-4">Your account</h4>
            <ul className="space-y-2.5">
              {ACCOUNT.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className={linkCls}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 md:col-span-3">
            <h4 className="font-display font-bold text-slate-900 dark:text-white mb-4">Official portals</h4>
            <ul className="space-y-2.5">
              {PORTALS.map((p) => (
                <li key={p.href}>
                  <a href={p.href} target="_blank" rel="noreferrer noopener" className={linkCls}>
                    {p.label} <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/80 dark:border-white/[0.07] flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 text-center sm:text-left text-xs text-slate-500 dark:text-slate-400">
          <p>&copy; {new Date().getFullYear()} AuctionLens. An independent aggregator of publicly available notices. All trademarks belong to their respective owners.</p>
        </div>
      </div>
    </footer>
  );
};
