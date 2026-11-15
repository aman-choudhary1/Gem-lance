import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { SourceBadge } from '../components/common/SourceBadge';
import { sourceService, PipelineSummaryResult } from '../services/sourceService';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Loader2,
  X,
  Zap,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export type ToastType = 'loading' | 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  sourceCode?: string;
  sourceName?: string;
  stats?: {
    recordsFound: number;
    recordsCreated: number;
    recordsUpdated: number;
    durationMs: number;
  };
  autoFetch?: boolean;
  actionUrl?: string;
  actionLabel?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => string;
  showIngestionStart: (sourceCode: string, sourceName?: string) => string;
  showIngestionSuccess: (
    id: string | null,
    summary: PipelineSummaryResult,
    sourceName?: string
  ) => void;
  showIngestionError: (id: string | null, sourceCode: string, error: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastJobIdRef = useRef<string | null>(null);
  const userTriggeredJobsRef = useRef<Set<string>>(new Set());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>): string => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...toast, id };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep max 5 toasts

      if (toast.type !== 'loading') {
        const timeout = toast.duration ?? 6000;
        setTimeout(() => removeToast(id), timeout);
      }

      return id;
    },
    [removeToast]
  );

  const showIngestionStart = useCallback(
    (sourceCode: string, sourceName?: string): string => {
      const id = 'ingest_' + Math.random().toString(36).substring(2, 9);
      userTriggeredJobsRef.current.add(sourceCode.toUpperCase());

      const item: ToastItem = {
        id,
        type: 'loading',
        sourceCode: sourceCode.toUpperCase(),
        sourceName,
        title: `Ingesting from ${sourceCode.toUpperCase()}...`,
        message: `Connecting to ${sourceName || sourceCode} and parsing live tender notices...`
      };

      setToasts((prev) => [...prev.slice(-4), item]);
      return id;
    },
    []
  );

  const showIngestionSuccess = useCallback(
    (id: string | null, summary: PipelineSummaryResult, sourceName?: string) => {
      const durationSec = (summary.durationMs / 1000).toFixed(1);
      const upper = summary.sourceCode.toUpperCase();

      const successToast: ToastItem = {
        id: id || 'toast_' + Math.random().toString(36).substring(2, 9),
        type: 'success',
        sourceCode: upper,
        sourceName,
        title: `Tenders Fetched: ${upper}`,
        message: `Indexed ${summary.recordsFound} tenders (${summary.recordsCreated} created, ${summary.recordsUpdated} updated) in ${durationSec}s.`,
        stats: {
          recordsFound: summary.recordsFound,
          recordsCreated: summary.recordsCreated,
          recordsUpdated: summary.recordsUpdated,
          durationMs: summary.durationMs
        },
        actionUrl: `/auctions?source=${encodeURIComponent(upper)}`,
        actionLabel: 'View Tenders',
        duration: 7000
      };

      if (id) {
        setToasts((prev) => prev.map((t) => (t.id === id ? successToast : t)));
        setTimeout(() => removeToast(id), 7000);
      } else {
        setToasts((prev) => [...prev.slice(-4), successToast]);
        setTimeout(() => removeToast(successToast.id), 7000);
      }
    },
    [removeToast]
  );

  const showIngestionError = useCallback(
    (id: string | null, sourceCode: string, error: string) => {
      const errorToast: ToastItem = {
        id: id || 'toast_' + Math.random().toString(36).substring(2, 9),
        type: 'error',
        sourceCode: sourceCode.toUpperCase(),
        title: `Ingestion Failed: ${sourceCode.toUpperCase()}`,
        message: error || 'Unable to complete tender collection from portal.',
        duration: 8000
      };

      if (id) {
        setToasts((prev) => prev.map((t) => (t.id === id ? errorToast : t)));
        setTimeout(() => removeToast(id), 8000);
      } else {
        setToasts((prev) => [...prev.slice(-4), errorToast]);
        setTimeout(() => removeToast(errorToast.id), 8000);
      }
    },
    [removeToast]
  );

  // Background Auto-Fetch Detection Poller
  useEffect(() => {
    let isMounted = true;

    const checkBackgroundJobs = async () => {
      try {
        const recent = await sourceService.getRecentJobs(5);
        if (!recent || recent.length === 0) return;

        const latest = recent[0];
        if (!lastJobIdRef.current) {
          lastJobIdRef.current = latest.id;
          return;
        }

        // If a new job completed and wasn't directly triggered by active button click
        if (latest.id !== lastJobIdRef.current) {
          lastJobIdRef.current = latest.id;

          const sourceCode = latest.source?.code || 'PORTAL';
          const isUserAction = userTriggeredJobsRef.current.has(sourceCode.toUpperCase());

          if (!isUserAction && latest.status === 'SUCCESS' && isMounted) {
            showToast({
              type: 'info',
              autoFetch: true,
              sourceCode,
              sourceName: latest.source?.name,
              title: `Auto-Fetch Sync Completed`,
              message: `Background scheduler updated ${sourceCode}: ${latest.recordsCreated} new notices indexed.`,
              actionUrl: `/auctions?source=${encodeURIComponent(sourceCode)}`,
              actionLabel: 'Explore Notices',
              duration: 7000
            });
          }

          // Clear user action tag
          userTriggeredJobsRef.current.delete(sourceCode.toUpperCase());
        }
      } catch {
        // silent fail on poller
      }
    };

    const interval = setInterval(checkBackgroundJobs, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        showIngestionStart,
        showIngestionSuccess,
        showIngestionError,
        removeToast
      }}
    >
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Rendered Floating Toast Notification Container
const ToastContainer: React.FC<{ toasts: ToastItem[]; onDismiss: (id: string) => void }> = ({
  toasts,
  onDismiss
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 transform translate-y-0 opacity-100 flex flex-col gap-2.5 ${
            toast.type === 'loading'
              ? 'bg-slate-900/95 dark:bg-slate-900/95 border-cyan-500/40 text-slate-100 ring-1 ring-cyan-500/20'
              : toast.type === 'success'
              ? 'bg-slate-900/95 dark:bg-slate-900/95 border-emerald-500/40 text-slate-100 ring-1 ring-emerald-500/20'
              : toast.type === 'error'
              ? 'bg-slate-900/95 dark:bg-slate-900/95 border-rose-500/40 text-slate-100 ring-1 ring-rose-500/20'
              : 'bg-slate-900/95 dark:bg-slate-900/95 border-slate-700/60 text-slate-100 ring-1 ring-slate-500/20'
          }`}
        >
          {/* Header Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {toast.type === 'loading' && (
                <div className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg animate-spin">
                  <Loader2 className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'success' && (
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'error' && (
                <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
                  <XCircle className="w-4 h-4" />
                </div>
              )}
              {toast.type === 'info' && (
                <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg">
                  {toast.autoFetch ? <Zap className="w-4 h-4 text-amber-400" /> : <Info className="w-4 h-4" />}
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white tracking-tight">{toast.title}</h4>
                  {toast.autoFetch && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      AUTO-SYNC
                    </span>
                  )}
                </div>
                {toast.sourceName && (
                  <p className="text-[11px] text-slate-400 truncate max-w-[240px]">{toast.sourceName}</p>
                )}
              </div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Message Body */}
          <p className="text-xs text-slate-300 leading-relaxed pl-8">{toast.message}</p>

          {/* Action Link & Badges */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 pl-8">
            {toast.sourceCode ? (
              <SourceBadge code={toast.sourceCode} className="text-[10px] px-1.5 py-0.5" />
            ) : (
              <span />
            )}

            {toast.actionUrl && (
              <Link
                to={toast.actionUrl}
                onClick={() => onDismiss(toast.id)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
              >
                {toast.actionLabel || 'View Details'} <ArrowRight className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
