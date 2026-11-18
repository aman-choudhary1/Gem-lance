import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowRight, MapPin, Trophy } from 'lucide-react';
import { EASE_OUT } from '../motion/variants';

interface Tile {
  code: string;
  name: string;
  col: number;
  row: number;
  /** other spellings that should count toward this tile (normalised, see norm()) */
  aliases?: string[];
}

/** One square per state / UT, placed roughly where it sits on the map of India. */
const TILES: Tile[] = [
  { code: 'JK', name: 'Jammu and Kashmir', col: 2, row: 0 },
  { code: 'LA', name: 'Ladakh', col: 3, row: 0 },
  { code: 'CH', name: 'Chandigarh', col: 1, row: 1 },
  { code: 'PB', name: 'Punjab', col: 2, row: 1 },
  { code: 'HP', name: 'Himachal Pradesh', col: 3, row: 1 },
  { code: 'HR', name: 'Haryana', col: 2, row: 2 },
  { code: 'UK', name: 'Uttarakhand', col: 3, row: 2, aliases: ['uttaranchal'] },
  { code: 'SK', name: 'Sikkim', col: 5, row: 2 },
  { code: 'AR', name: 'Arunachal Pradesh', col: 7, row: 2 },
  { code: 'RJ', name: 'Rajasthan', col: 1, row: 3 },
  { code: 'DL', name: 'Delhi', col: 2, row: 3, aliases: ['nct of delhi', 'new delhi'] },
  { code: 'UP', name: 'Uttar Pradesh', col: 3, row: 3 },
  { code: 'BR', name: 'Bihar', col: 4, row: 3 },
  { code: 'WB', name: 'West Bengal', col: 5, row: 3 },
  { code: 'AS', name: 'Assam', col: 6, row: 3 },
  { code: 'NL', name: 'Nagaland', col: 7, row: 3 },
  { code: 'GJ', name: 'Gujarat', col: 1, row: 4 },
  { code: 'MP', name: 'Madhya Pradesh', col: 2, row: 4 },
  { code: 'CG', name: 'Chhattisgarh', col: 3, row: 4 },
  { code: 'JH', name: 'Jharkhand', col: 4, row: 4 },
  { code: 'ML', name: 'Meghalaya', col: 6, row: 4 },
  { code: 'MN', name: 'Manipur', col: 7, row: 4 },
  { code: 'DD', name: 'Dadra and Nagar Haveli and Daman and Diu', col: 1, row: 5, aliases: ['daman and diu', 'dadra and nagar haveli'] },
  { code: 'MH', name: 'Maharashtra', col: 2, row: 5 },
  { code: 'TS', name: 'Telangana', col: 3, row: 5 },
  { code: 'OD', name: 'Odisha', col: 4, row: 5, aliases: ['orissa'] },
  { code: 'TR', name: 'Tripura', col: 6, row: 5 },
  { code: 'MZ', name: 'Mizoram', col: 7, row: 5 },
  { code: 'GA', name: 'Goa', col: 1, row: 6 },
  { code: 'KA', name: 'Karnataka', col: 2, row: 6 },
  { code: 'AP', name: 'Andhra Pradesh', col: 3, row: 6 },
  { code: 'LD', name: 'Lakshadweep', col: 0, row: 7 },
  { code: 'KL', name: 'Kerala', col: 2, row: 7 },
  { code: 'TN', name: 'Tamil Nadu', col: 3, row: 7 },
  { code: 'PY', name: 'Puducherry', col: 4, row: 7, aliases: ['pondicherry'] },
  { code: 'AN', name: 'Andaman and Nicobar Islands', col: 6, row: 7 }
];

const TILE_BY_CODE = new Map(TILES.map((t) => [t.code, t]));

/** Same idea as the backend's stateKey: ignore case, spacing, "&" vs "and". */
const norm = (v: string) => v.trim().replace(/\s+/g, ' ').replace(/ ?& ?/g, ' and ').toLowerCase();

const fmt = (n: number) => n.toLocaleString('en-IN');
const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

interface Props {
  states: Array<{ name: string; count: number }>;
  className?: string;
}

export const IndiaTileMap: React.FC<Props> = ({ states, className = '' }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  // stagger the tiles in once on first paint; afterwards hover feedback must be instant
  const [intro, setIntro] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setIntro(false), 1200);
    return () => clearTimeout(id);
  }, []);

  const { counts, filterName, max, total, unmapped, ranked } = useMemo(() => {
    const byKey = new Map<string, Tile>();
    TILES.forEach((t) => {
      byKey.set(norm(t.name), t);
      t.aliases?.forEach((a) => byKey.set(a, t));
    });
    const counts = new Map<string, number>();
    const best = new Map<string, { name: string; count: number }>();
    let unmapped = 0;
    let total = 0;
    states.forEach((s) => {
      total += s.count;
      const tile = byKey.get(norm(s.name));
      if (!tile) {
        if (s.name !== 'Not Specified') unmapped += s.count;
        return;
      }
      counts.set(tile.code, (counts.get(tile.code) ?? 0) + s.count);
      // filter by the most common spelling; the backend then matches every variant
      if (!best.has(tile.code) || s.count > best.get(tile.code)!.count) best.set(tile.code, s);
    });
    const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return {
      counts,
      filterName: (code: string) => best.get(code)?.name ?? TILE_BY_CODE.get(code)!.name,
      max: Math.max(1, ...counts.values()),
      total,
      unmapped,
      ranked
    };
  }, [states]);

  const active = hovered ?? selected;
  const activeTile = active ? TILE_BY_CODE.get(active) : undefined;
  const activeCount = active ? counts.get(active) ?? 0 : 0;
  const linkFor = (code: string) => `/auctions?state=${encodeURIComponent(filterName(code))}`;

  const onTileClick = (code: string) => {
    // Touch screens have no hover, so the first tap previews and the details button opens the list.
    if (window.matchMedia('(hover: none)').matches) setSelected((s) => (s === code ? null : code));
    else navigate(linkFor(code));
  };

  const rank = active ? ranked.findIndex(([c]) => c === active) + 1 : 0;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-5 gap-6 items-center ${className}`}>
      {/* ---- map */}
      <div className="lg:col-span-3 relative rounded-3xl p-4 sm:p-6 bg-slate-900/[0.03] dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.07] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div
          className="relative grid gap-1.5 sm:gap-2 mx-auto w-full max-w-xl"
          style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))', gridTemplateRows: 'repeat(8, auto)' }}
          role="list"
          aria-label="Notices by state"
          onMouseLeave={() => setHovered(null)}
        >
          {TILES.map((t, i) => {
            const n = counts.get(t.code) ?? 0;
            // log scale so a few big states do not wash out the rest
            const strength = n === 0 ? 0 : 0.2 + 0.8 * (Math.log(n + 1) / Math.log(max + 1));
            const isActive = active === t.code;
            const dim = active && !isActive;
            return (
              <m.button
                key={t.code}
                type="button"
                role="listitem"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: dim ? 0.45 : 1, scale: isActive ? 1.12 : 1 }}
                transition={{ duration: 0.3, ease: EASE_OUT, delay: intro ? i * 0.018 : 0 }}
                whileTap={{ scale: 0.94 }}
                onMouseEnter={() => setHovered(t.code)}
                onFocus={() => setHovered(t.code)}
                onBlur={() => setHovered(null)}
                onClick={() => onTileClick(t.code)}
                aria-label={`${t.name}: ${fmt(n)} notices`}
                aria-pressed={selected === t.code}
                style={{ gridColumn: t.col + 1, gridRow: t.row + 1, zIndex: isActive ? 10 : 1, ...(n > 0 ? { backgroundColor: `rgba(16, 185, 129, ${strength.toFixed(2)})` } : {}) }}
                className={`aspect-square rounded-lg sm:rounded-xl flex flex-col items-center justify-center leading-tight text-[10px] sm:text-xs font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 ${
                  n === 0
                    ? 'bg-slate-900/[0.05] dark:bg-white/[0.05] text-slate-400 dark:text-slate-600 border border-dashed border-slate-300 dark:border-white/10'
                    : `${strength > 0.55 ? 'text-white' : 'text-emerald-950 dark:text-white'} cursor-pointer`
                } ${isActive ? 'ring-2 ring-emerald-300 shadow-glow' : ''}`}
              >
                <span>{t.code}</span>
                {n > 0 && <span className="hidden sm:block text-[9px] font-mono font-semibold opacity-90">{compact(n)}</span>}
              </m.button>
            );
          })}
        </div>

        {/* legend with real numbers */}
        <div className="relative mt-5 flex items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="font-mono">1</span>
          <span className="h-2 w-32 rounded-full bg-gradient-to-r from-emerald-500/20 to-emerald-500" />
          <span className="font-mono">{fmt(max)}</span>
          <span className="hidden sm:inline-flex items-center gap-1.5 pl-3 border-l border-slate-300 dark:border-white/15">
            <span className="w-3 h-3 rounded border border-dashed border-slate-400 dark:border-white/30" /> No notices yet
          </span>
        </div>
      </div>

      {/* ---- details */}
      <div className="lg:col-span-2 min-h-[18rem]">
        <AnimatePresence mode="wait" initial={false}>
          {activeTile ? (
            <m.div
              key={activeTile.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="glass-card rounded-3xl p-6 sm:p-7"
              aria-live="polite"
            >
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
                <MapPin className="w-3.5 h-3.5" /> {activeTile.code}
              </div>
              <h3 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">{activeTile.name}</h3>

              {activeCount > 0 ? (
                <>
                  <div className="mt-5 flex items-end gap-3">
                    <span className="text-5xl font-extrabold text-gradient leading-none">{fmt(activeCount)}</span>
                    <span className="pb-1 text-sm text-slate-600 dark:text-slate-400">notices</span>
                  </div>
                  <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden" aria-hidden>
                    <m.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" initial={{ width: 0 }} animate={{ width: `${Math.max(3, (activeCount / max) * 100)}%` }} transition={{ duration: 0.5, ease: EASE_OUT }} />
                  </div>
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                    {total > 0 ? `${((activeCount / total) * 100).toFixed(1)}% of all listed notices` : ''}
                    {rank > 0 && (
                      <span className="inline-flex items-center gap-1 ml-2 font-semibold text-amber-600 dark:text-amber-400">
                        <Trophy className="w-3 h-3" /> #{rank} of {ranked.length} states
                      </span>
                    )}
                  </p>
                  <Link to={linkFor(activeTile.code)} className="btn-primary mt-6 w-full !py-3">
                    View {fmt(activeCount)} notices <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">No notices from here are listed right now. New ones appear as the portals publish them.</p>
              )}
            </m.div>
          ) : (
            <m.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: EASE_OUT }}
              className="glass-card rounded-3xl p-6 sm:p-7"
            >
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Overview</div>
              <h3 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                <span className="text-gradient">{fmt(total)}</span> notices across {ranked.length} states and UTs
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                <span className="hidden lg:inline">Hover a tile to preview a state, click to open its notices.</span>
                <span className="lg:hidden">Tap a tile to preview a state.</span>
              </p>

              <ol className="mt-5 space-y-2.5">
                {ranked.slice(0, 5).map(([code, n], i) => (
                  <li key={code}>
                    <Link to={linkFor(code)} className="group block">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                          <span className="text-slate-400 font-mono text-xs mr-2">{i + 1}</span>
                          {TILE_BY_CODE.get(code)!.name}
                        </span>
                        <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{fmt(n)}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${Math.max(4, (n / max) * 100)}%` }} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
              {unmapped > 0 && <p className="mt-4 text-[11px] text-slate-500">{fmt(unmapped)} more notices are listed under other locations.</p>}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
