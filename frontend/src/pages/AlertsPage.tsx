import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../services/alertService';
import { sourceService } from '../services/sourceService';
import { useAuth } from '../context/AuthContext';
import { CreateAlertModal } from '../components/alerts/CreateAlertModal';
import { EmptyState } from '../components/common/EmptyState';
import { formatCurrencyINR } from '../utils/formatters';
import { Bell, Plus, Trash2, Power, Lock, CheckCircle2 } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { user, loginAsDemo } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['userAlerts', user?.id],
    queryFn: () => alertService.getAlerts(),
    enabled: !!user
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => sourceService.getCategories(),
    staleTime: 300000
  });

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: () => sourceService.getAllSources(),
    staleTime: 300000
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      alertService.updateAlert(id, { enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAlerts'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => alertService.deleteAlert(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userAlerts'] });
    }
  });

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-3xl inline-block text-amber-400">
          <Lock className="w-8 h-8 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">Sign in to Manage Alert Rules</h2>
        <p className="text-xs text-slate-400">
          Receive automatic in-app alerts whenever new government forward auctions match your custom keywords, categories, and locations.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => loginAsDemo('BUYER')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold"
          >
            One-Click Demo Buyer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/15 text-amber-400 rounded-2xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Auction Alerts Engine</h1>
            <p className="text-xs text-slate-400">
              Automated rules monitoring new ingestion feeds across GeM, MSTC, and state portals.
            </p>
          </div>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-900/30 shrink-0"
        >
          <Plus className="w-4 h-4" /> Create New Alert Rule
        </button>
      </div>

      {/* Rules List */}
      {alerts.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-amber-400" />}
          title="No Alert Rules Active"
          description="Create custom keyword, category, or location alert filters to get automatically notified when new matching forward auctions are indexed."
          actionLabel="Create First Alert"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((al) => (
            <div
              key={al.id}
              className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-4 ${
                al.enabled
                  ? 'bg-slate-900/70 border-slate-800 hover:border-emerald-500/30'
                  : 'bg-slate-950/40 border-slate-850 opacity-60'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        al.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                      }`}
                    ></span>
                    <h3 className="font-bold text-slate-100 text-sm">{al.name}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleMutation.mutate({ id: al.id, enabled: !al.enabled })}
                      title={al.enabled ? 'Disable Alert' : 'Enable Alert'}
                      className={`p-1.5 rounded-lg border text-xs transition ${
                        al.enabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete alert rule "${al.name}"?`)) {
                          deleteMutation.mutate(al.id);
                        }
                      }}
                      title="Delete Alert"
                      className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Filter tags summary */}
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  {al.keywords && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Keywords: <strong className="text-white">{al.keywords}</strong>
                    </span>
                  )}
                  {al.state && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      State: <strong className="text-white">{al.state}</strong>
                    </span>
                  )}
                  {al.minPrice && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      Min: {formatCurrencyINR(al.minPrice)}
                    </span>
                  )}
                  {al.maxPrice && (
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      Max: {formatCurrencyINR(al.maxPrice)}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span>Created {new Date(al.createdAt).toLocaleDateString()}</span>
                <span className="text-emerald-400 font-medium">Auto-Ingestion Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateAlertModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['userAlerts'] });
        }}
        categories={categories}
        sources={sources}
      />
    </div>
  );
};
