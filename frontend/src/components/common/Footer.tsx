import React from 'react';
import { Link } from 'react-router-dom';
import { Gavel, ExternalLink, ShieldAlert } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 pt-12 pb-8 text-xs text-slate-500 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Col */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-900/20">
                <Gavel className="w-4 h-4 text-white dark:text-slate-950" />
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white">AuctionLens</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Multi-portal public forward auction intelligence and procurement tender monitoring for Indian government repositories.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-3">Explore Feeds</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/auctions" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Browse Forward Auctions
                </Link>
              </li>
              <li>
                <Link to="/bids" className="hover:text-teal-600 dark:hover:text-teal-400 transition flex items-center gap-1.5 font-semibold text-teal-600 dark:text-teal-400">
                  GeM Procurement Bids (BidPlus)
                </Link>
              </li>
              <li>
                <Link to="/ending-soon" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Ending Soon (Live Countdowns)
                </Link>
              </li>
              <li>
                <Link to="/sources" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition">
                  Supported Auction Sources
                </Link>
              </li>
              <li>
                <Link to="/categories" className="hover:text-emerald-400 transition">
                  Categories Directory
                </Link>
              </li>
            </ul>
          </div>

          {/* Supported Portals */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-3">Official Portals</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://forwardauction.gem.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-400 transition"
                >
                  GeM Forward Auction <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.mstcecommerce.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-400 transition"
                >
                  MSTC E-Commerce <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://eauction.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-400 transition"
                >
                  eAuction India Portal <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Compliance & Legal Disclaimer */}
          <div>
            <h4 className="font-semibold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              Statutory Notice
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-400">
              AuctionLens is an independent information aggregator. We do not participate in bidding or collect GeM/portal credentials. All rights belong to respective government entities.
            </p>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
          <div>&copy; {new Date().getFullYear()} AuctionLens Intelligence. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-mono">Status: All Ingestion Adapters Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
