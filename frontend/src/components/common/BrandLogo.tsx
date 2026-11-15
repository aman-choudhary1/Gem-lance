import React from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';

interface BrandMarkProps {
  size?: number;
  className?: string;
}

/** Custom mark: a gavel head inside a lens ring, with an aurora gradient. */
export const BrandMark: React.FC<BrandMarkProps> = ({ size = 36, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className} aria-hidden>
    <defs>
      <linearGradient id="bm-g" x1="4" y1="4" x2="36" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" />
        <stop offset="0.55" stopColor="#22d3ee" />
        <stop offset="1" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#bm-g)" />
    <circle cx="19" cy="19" r="8.2" stroke="#fff" strokeOpacity="0.95" strokeWidth="2.4" />
    <path d="M25.2 25.2 31 31" stroke="#fff" strokeOpacity="0.95" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M15.4 17.4h7.2M16.8 15.2l2.2 4.4M21.2 15.2l-2.2 4.4" stroke="#fff" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

interface BrandLogoProps {
  to?: string;
  tagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ to = '/', tagline = true, className = '', onClick }) => (
  <Link to={to} onClick={onClick} className={`flex items-center gap-2.5 group ${className}`} aria-label="AuctionLens home">
    <m.span whileHover={{ rotate: -6, scale: 1.06 }} whileTap={{ scale: 0.95 }} className="block drop-shadow-[0_6px_14px_rgba(16,185,129,0.45)]">
      <BrandMark />
    </m.span>
    <span className="leading-none">
      <span className="flex items-center gap-1.5">
        <span className="font-display text-[19px] font-extrabold tracking-tight text-slate-900 dark:text-white">
          Auction<span className="text-gradient">Lens</span>
        </span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      </span>
      {tagline && (
        <span className="hidden sm:block mt-1 text-[10px] tracking-[0.18em] uppercase text-slate-500 dark:text-slate-400 font-medium">
          Auction Intelligence
        </span>
      )}
    </span>
  </Link>
);
