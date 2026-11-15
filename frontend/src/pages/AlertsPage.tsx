import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { alertService } from '../services/alertService';
import { sourceService } from '../services/sourceService';
import { useAuth } from '../context/AuthContext';
import { demoLoginEnabled } from '../config/demo';
import { CreateAlertModal } from '../components/alerts/CreateAlertModal';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatCurrencyINR } from '../utils/formatters';
import { useSpotlight } from '../hooks/useSpotlight';
import { Bell, Plus, Trash2, Lock, Search, MapPin, IndianRupee, ArrowRight } from 'lucide-react';

const Chip: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-slate-900/5 dark:bg-white/[0.07] text-slate-700 dark:text-slate-300">
    <span className="text-emerald-600 dark:text-emerald-400">{icon}</span>
    {children}
  </span>
);

export const AlertsPage: React.FC = () => {
  const { user, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const spotlight = useSpotlight();
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['userAlerts', user?.id],
    queryFn: () => alertService.getAlerts(),
    enabled: !!user
  });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => sourceService.getCategories(), staleTime: 300000 });
  const { data: sources = [] } = useQuery({ queryKey: ['sources'], queryFn: () => sourceService.getAllSources(), staleTime: 300000 });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['userAlerts'] });
  const toggleMutation = useMutation({ mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => alertService.updateAlert(id, { enabled }), onSuccess: refresh });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertService.deleteAlert(id),
    onSuccess: () => {
      setConfirmId(null);
      refresh();
    }
  });

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Sign in to manage alerts</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Get notified the moment a notice matches your keywords, category or location.</p>
        <div className="flex justify-center gap-3 pt-2">
          <Link to="/login" state={{ from: { pathname: '/alerts' } }} className="btn-primary">
            Sign in
          </Link>
          {demoLoginEnabled && (
            <button onClick={() => loginAsDemo('BUYER')} className="btn-ghost border border-slate-200 dark:border-white/10">
              Try demo buyer
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeCount = alerts.filter((a) => a.enabled).length;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Bell className="w-6 h-6" />}
        eyebrow="Never miss a notice"
        title="Alert rules"
        description="Rules are checked against every newly indexed notice. Matches land in your notifications."
        tone="from-amber-500 to-rose-500"
        actions={
          <>
            {!isLoading && alerts.length > 0 && (
              <span className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                {activeCount} of {alerts.length} active
              </span>
            )}
            <button onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> New alert rule
            </button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-200/70 dark:bg-white/[0.05] relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-amber-500" />}
          title="No alert rules yet"
          description="Create a rule with keywords, a state or a price range and we will notify you when matching notices are published."
          actionLabel="Create your first alert"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence initial={false}>
            {alerts.map((al, i) => {
              const params = new URLSearchParams();
              if (al.keywords) params.set('search', al.keywords);
              if (al.state) params.set('state', al.state);
              if (al.minPrice) params.set('minPrice', String(al.minPrice));
              if (al.maxPrice) params.set('maxPrice', String(al.maxPrice));
              const asking = confirmId === al.id;
              return (
                <m.article
                  key={al.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: al.enabled ? 1 : 0.6, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ delay: i * 0.04, duration: 0.35 }}
                  onPointerMove={spotlight}
                  className="glass-card rounded-2xl p-5 flex flex-col gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">{al.name}</h2>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Created {new Date(al.createdAt).toLocaleDateString('en-IN')}</p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={al.enabled}
                      aria-label={al.enabled ? `Pause ${al.name}` : `Resume ${al.name}`}
                      onClick={() => toggleMutation.mutate({ id: al.id, enabled: !al.enabled })}
                      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${al.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${al.enabled ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {al.keywords && <Chip icon={<Search className="w-3 h-3" />}>{al.keywords}</Chip>}
                    {al.state && <Chip icon={<MapPin className="w-3 h-3" />}>{al.state}</Chip>}
                    {!!al.minPrice && <Chip icon={<IndianRupee className="w-3 h-3" />}>Min {formatCurrencyINR(al.minPrice)}</Chip>}
                    {!!al.maxPrice && <Chip icon={<IndianRupee className="w-3 h-3" />}>Max {formatCurrencyINR(al.maxPrice)}</Chip>}
                    {!al.keywords && !al.state && !al.minPrice && !al.maxPrice && <span className="text-[11px] text-slate-500">Matches all new notices</span>}
                  </div>

                  <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-2">
                    <button onClick={() => navigate(`/auctions?${params.toString()}`)} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-1.5 transition-all">
                      See current matches <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {asking ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <button onClick={() => deleteMutation.mutate(al.id)} disabled={deleteMutation.isPending} className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-semibold">
                          Delete
                        </button>
                        <button onClick={() => setConfirmId(null)} className="px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-900/5 dark:hover:bg-white/10">
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmId(al.id)} aria-label={`Delete ${al.name}`} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </m.article>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <CreateAlertModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onCreated={refresh} categories={categories} sources={sources} />
    </div>
  );
};
