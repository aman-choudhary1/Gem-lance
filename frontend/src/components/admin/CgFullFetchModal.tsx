import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, DownloadCloud, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react';
import { sourceService, FullFetchCodeStep, FullFetchProgress, FullFetchResult } from '../../services/sourceService';

const toEnterStep = (s: FullFetchCodeStep) => ({
  kind: 'enter' as const,
  sessionId: s.sessionId,
  code: s.code,
  expiresAt: new Date(s.expiresAt).getTime(),
  reason: s.reason,
  pagesRead: s.pagesRead,
  totalPages: s.totalPages,
  rows: s.rows
});

type Step =
  | { kind: 'loading' }
  | { kind: 'enter'; sessionId: string; code: string; expiresAt: number; reason: FullFetchCodeStep['reason']; pagesRead: number; totalPages: number | null; rows: number }
  | { kind: 'running' }
  | { kind: 'done'; result: FullFetchResult }
  | { kind: 'error'; message: string };

interface Props {
  onClose: () => void;
  /** Called after a successful import so the page can refresh its data. */
  onImported: (result: FullFetchResult) => void;
}

const errorMessage = (err: any) => err?.response?.data?.error?.message || err?.message || 'Something went wrong.';

/**
 * Admin-assisted full fetch of the Chhattisgarh open-tender list. The portal asks a person to
 * retype a code before it shows the full list; the admin does that here, then the server reads
 * every page and imports the tenders.
 */
export const CgFullFetchModal: React.FC<Props> = ({ onClose, onImported }) => {
  const [step, setStep] = useState<Step>({ kind: 'loading' });
  const [typed, setTyped] = useState('');
  const [progress, setProgress] = useState<FullFetchProgress | null>(null);
  const [now, setNow] = useState(Date.now());
  const inputRef = useRef<HTMLInputElement>(null);

  const begin = useCallback(async () => {
    setStep({ kind: 'loading' });
    setTyped('');
    try {
      setStep(toEnterStep(await sourceService.startCgFullFetch()));
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch (err) {
      setStep({ kind: 'error', message: errorMessage(err) });
    }
  }, []);

  useEffect(() => {
    begin();
  }, [begin]);

  // countdown for the code's validity
  useEffect(() => {
    if (step.kind !== 'enter') return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step.kind]);

  // live progress while the server reads the pages
  useEffect(() => {
    if (step.kind !== 'running') return;
    let stop = false;
    const tick = async () => {
      try {
        const p = await sourceService.getCgFullFetchProgress();
        if (!stop && p) setProgress(p);
      } catch {
        // progress is best-effort
      }
    };
    tick();
    const id = setInterval(tick, 2000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [step.kind]);

  const running = step.kind === 'running';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !running) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, running]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step.kind !== 'enter' || !typed.trim()) return;
    const { sessionId } = step;
    setProgress(null);
    setStep({ kind: 'running' });
    try {
      const result = await sourceService.submitCgFullFetchCode(sessionId, typed.trim());
      if (result.status === 'needs_code') {
        // wrong code, or the portal asks again after a few pages: show the new code and carry on
        setTyped('');
        setStep(toEnterStep(result));
        setTimeout(() => inputRef.current?.focus(), 50);
        return;
      }
      setStep({ kind: 'done', result });
      onImported(result);
    } catch (err) {
      setStep({ kind: 'error', message: errorMessage(err) });
    }
  };

  const secondsLeft = step.kind === 'enter' ? Math.max(0, Math.round((step.expiresAt - now) / 1000)) : 0;
  const expired = step.kind === 'enter' && secondsLeft === 0;
  const pct = progress?.totalPages ? Math.min(100, Math.round((progress.pagesRead / progress.totalPages) * 100)) : null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/80 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="cg-full-fetch-title">
      <m.div initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative text-left">
        {!running && (
          <button onClick={onClose} aria-label="Close" className="absolute top-5 right-5 p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-3 mb-5 pr-8">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shrink-0">
            <DownloadCloud className="w-5 h-5" />
          </span>
          <div>
            <h2 id="cg-full-fetch-title" className="text-lg font-extrabold text-slate-900 dark:text-white">Full fetch: Chhattisgarh</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Every open tender, not just 50 per department</p>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {step.kind === 'loading' && (
            <m.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 flex flex-col items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
              Connecting to the Chhattisgarh portal…
            </m.div>
          )}

          {step.kind === 'enter' && (
            <m.form key="enter" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              {step.reason === 'start' && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  The portal asks a person to confirm this code before it shows the full list. Type it below.
                </p>
              )}
              {step.reason === 'rejected' && (
                <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">That did not match. Type the code below exactly (it is case-sensitive).</p>
              )}
              {step.reason === 'rechallenge' && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-semibold">Read {step.pagesRead}{step.totalPages ? ` of ${step.totalPages}` : ''} pages</span> ({step.rows.toLocaleString('en-IN')} tenders). The portal asks for a new code every few pages. Type it to continue.
                  </p>
                  {step.totalPages ? (
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500" style={{ width: `${Math.round((step.pagesRead / step.totalPages) * 100)}%` }} />
                    </div>
                  ) : null}
                </div>
              )}
              <div className="rounded-2xl border border-dashed border-amber-500/50 bg-amber-500/5 px-4 py-4 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-300">Authentication code</div>
                <div className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-slate-900 dark:text-white select-none" aria-label={`Code ${step.code.split('').join(' ')}`}>
                  {step.code}
                </div>
                <div className={`mt-1 text-[11px] ${expired ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                  {expired ? 'Expired. Get a new code.' : `Valid for ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}. Case-sensitive.`}
                </div>
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Type the code</span>
                <input
                  ref={inputRef}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-1.5 w-full px-4 py-3 rounded-xl font-mono text-lg tracking-widest bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </label>
              <div className="flex items-center justify-between gap-3 pt-1">
                <button type="button" onClick={begin} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition">
                  <RefreshCw className="w-3.5 h-3.5" /> New code
                </button>
                <button type="submit" disabled={!typed.trim() || expired} className="btn-primary !py-2.5">
                  {step.reason === 'rechallenge' ? 'Continue' : 'Fetch all tenders'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </m.form>
          )}

          {step.kind === 'running' && (
            <m.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-4 space-y-4" aria-live="polite">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                {progress?.pagesRead
                  ? `Reading page ${progress.pagesRead}${progress.totalPages ? ` of ${progress.totalPages}` : ''}…`
                  : 'Checking the code…'}
              </div>
              <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <m.div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                  initial={{ width: '4%' }}
                  animate={{ width: pct !== null ? `${Math.max(4, pct)}%` : '12%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {progress?.rows ? `${progress.rows.toLocaleString('en-IN')} tenders read so far. ` : ''}
                This takes a minute or two. Keep this window open; importing starts after the last page.
              </p>
            </m.div>
          )}

          {step.kind === 'done' && (
            <m.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                {step.result.status === 'SUCCESS' ? 'Full fetch complete' : 'Full fetch finished with some errors'}
              </div>
              <dl className="grid grid-cols-2 gap-2.5 text-sm">
                {[
                  ['Pages read', `${step.result.pagesRead}${step.result.totalPages ? ` of ${step.result.totalPages}` : ''}`],
                  ['Tenders found', step.result.recordsFound.toLocaleString('en-IN')],
                  ['New', step.result.recordsCreated.toLocaleString('en-IN')],
                  ['Updated', step.result.recordsUpdated.toLocaleString('en-IN')]
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2.5">
                    <dt className="text-[11px] text-slate-500 dark:text-slate-400">{k}</dt>
                    <dd className="font-bold text-slate-900 dark:text-white">{v}</dd>
                  </div>
                ))}
              </dl>
              {step.result.recordsFailed > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">{step.result.recordsFailed} rows could not be imported (missing data).</p>
              )}
              {step.result.totalPages !== null && step.result.pagesRead < step.result.totalPages && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Only {step.result.pagesRead} of {step.result.totalPages} pages could be read. Run it again to try the rest.
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                The regular 30-minute sync keeps these up to date. Run a full fetch about once a day to pick up new tenders early.
              </p>
              <div className="flex justify-end">
                <button onClick={onClose} className="btn-primary !py-2.5">Done</button>
              </div>
            </m.div>
          )}

          {step.kind === 'error' && (
            <m.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-px" />
                <span>{step.message}</span>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={onClose} className="btn-ghost border border-slate-200 dark:border-white/10 !py-2.5">Close</button>
                <button onClick={begin} className="btn-primary !py-2.5">
                  <RefreshCw className="w-4 h-4" /> Try again
                </button>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </m.div>
    </div>
  );
};
