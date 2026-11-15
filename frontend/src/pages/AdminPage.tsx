import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { auctionService } from '../services/auctionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { demoLoginEnabled } from '../config/demo';
import { SourceBadge } from '../components/common/SourceBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  ShieldCheck,
  RefreshCw,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  BarChart3,
  Lock,
  Play,
  Database
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AdminPage: React.FC = () => {
  const { user, loginAsDemo } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [syncingSource, setSyncingSource] = useState<string | null>(null);

  // Fetch Admin Dashboard Overview
  const { data: adminData, isLoading: isAdminLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminService.getDashboard(),
    enabled: !!user && user.role === 'ADMIN',
    refetchInterval: 30000
  });

  // Fetch Global Stats for Charts
  const { data: statsData } = useQuery({
    queryKey: ['adminGlobalStats'],
    queryFn: () => auctionService.getStats(),
    enabled: !!user && user.role === 'ADMIN',
    staleTime: 60000
  });

  // Trigger Scrape Mutation
  const triggerScrapeMutation = useMutation({
    mutationFn: (sourceCode: string) => adminService.triggerScrape(sourceCode),
    onMutate: (sourceCode) => {
      setSyncingSource(sourceCode);
    },
    onSuccess: (res, sourceCode) => {
      if (res.status === 'FAILED') {
        showToast({
          type: 'error',
          title: `Ingestion failed: ${sourceCode}`,
          message: res.errorMessage || 'The source returned an error.'
        });
      } else {
        showToast({
          type: res.status === 'PARTIAL' ? 'warning' : 'success',
          title: `Ingestion complete: ${sourceCode}`,
          message: `Found ${res.recordsFound}, created ${res.recordsCreated}, updated ${res.recordsUpdated}, failed ${res.recordsFailed}.`
        });
      }
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['adminGlobalStats'] });
      queryClient.invalidateQueries({ queryKey: ['auctionStats'] });
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: 'Scraper error',
        message: err?.response?.data?.error?.message || err?.message || 'Unknown error'
      });
    },
    onSettled: () => {
      setSyncingSource(null);
    }
  });

  // Toggle Source Mutation
  const toggleSourceMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      adminService.toggleSource(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    }
  });

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl inline-block text-sky-600 dark:text-sky-400">
          <Lock className="w-8 h-8 mx-auto" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Administrator Access Required</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          The Scraper Pipeline Controller & Health Dashboard is restricted to verified administrators.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          {demoLoginEnabled && (
            <button
              onClick={() => loginAsDemo('ADMIN')}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-900/30"
            >
              One-Click Login as Demo Admin
            </button>
          )}
          {!user && (
            <Link
              to="/login"
              state={{ from: { pathname: '/admin' } }}
              className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    );
  }

  const sources = adminData?.sources || [];
  const recentJobs = adminData?.recentJobs || [];
  const metrics = adminData?.metrics;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-sky-500/15 text-sky-600 dark:text-sky-400 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Admin & Scraper Health Control</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Monitor active data adapters, trigger manual batch ingestions, and inspect ingestion logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['adminDashboard'] })}
            className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Total Indexed Auctions</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{metrics.totalAuctions.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Live Auctions</div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{metrics.liveAuctions.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Registered Users</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{metrics.totalUsers}</div>
          </div>
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">Active User Alerts</div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono">{metrics.totalAlerts}</div>
          </div>
        </div>
      )}

      {/* Provider Status & Manual Triggers */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Registered Data Providers & Adapters
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sources.map((src) => {
            const isHealthy = src.health?.healthy ?? true;
            const isSyncing = syncingSource === src.code;

            return (
              <div
                key={src.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SourceBadge code={src.code} />
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isHealthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {isHealthy ? 'Healthy' : 'Error / Offline'}
                    </span>
                  </div>

                  <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{src.name}</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                    {src.health?.message || src.description || 'Public adapter connector.'}
                  </p>

                  <div className="text-[11px] text-slate-500 font-mono space-y-0.5">
                    <div>{src.code === 'GEM_BIDS' ? 'Bids in DB:' : 'Auctions in DB:'} <span className="text-slate-700 dark:text-slate-300 font-bold">{src.auctionCount}</span></div>
                    {src.health?.responseTimeMs !== undefined && (
                      <div>Latency: <span className="text-slate-700 dark:text-slate-300">{src.health.responseTimeMs}ms</span></div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleSourceMutation.mutate({ id: src.id, enabled: !src.enabled })}
                    className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium ${
                      src.enabled
                        ? 'border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                        : 'border-slate-200 dark:border-slate-800 text-slate-500 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {src.enabled ? 'Enabled' : 'Disabled'}
                  </button>

                  <button
                    onClick={() => triggerScrapeMutation.mutate(src.code)}
                    disabled={isSyncing}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isSyncing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    Run Ingestion
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Charts (Recharts) */}
      {statsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Auctions by Source */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Auctions by Source Portal
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData.bySource}>
                  <XAxis dataKey="code" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Status Distribution */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Auctions by Lifecycle Status
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statsData.byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {statsData.byStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Scrape Jobs History Log Table */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            Recent Ingestion & Scrape Job Logs
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Started At</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Found</th>
                <th className="py-3 px-3">Created</th>
                <th className="py-3 px-3">Updated</th>
                <th className="py-3 px-3">Failed</th>
                <th className="py-3 px-3">Notes / Errors</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No scrape execution jobs recorded yet.
                  </td>
                </tr>
              ) : (
                recentJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-100 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-3">
                      <SourceBadge code={j.source.code} />
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {new Date(j.startedAt).toLocaleTimeString()} ({new Date(j.startedAt).toLocaleDateString()})
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          j.status === 'SUCCESS'
                            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : j.status === 'PARTIAL'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : j.status === 'RUNNING'
                            ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                            : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">{j.recordsFound}</td>
                    <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400">+{j.recordsCreated}</td>
                    <td className="py-3 px-3 font-mono text-blue-600 dark:text-blue-400">~{j.recordsUpdated}</td>
                    <td className="py-3 px-3 font-mono text-rose-600 dark:text-rose-400">{j.recordsFailed}</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 truncate max-w-xs">{j.errorMessage || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
