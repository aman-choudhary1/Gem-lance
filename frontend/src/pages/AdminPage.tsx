import { Link } from 'react-router-dom';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '../services/adminService';
import { auctionService } from '../services/auctionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { demoLoginEnabled } from '../config/demo';
import { SourceBadge } from '../components/common/SourceBadge';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';
import { AnimatedNumber } from '../components/motion/AnimatedNumber';
import { Stagger, StaggerItem } from '../components/motion/Reveal';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';
import { ShieldCheck, RefreshCw, Activity, CheckCircle2, XCircle, Clock, BarChart3, Lock, Play } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AdminPage: React.FC = () => {
  const { user, loginAsDemo } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const tipStyle = {
    backgroundColor: isDark ? '#0f172a' : '#ffffff',
    border: '1px solid ' + (isDark ? '#334155' : '#e2e8f0'),
    borderRadius: 10,
    fontSize: 12,
    color: isDark ? '#e2e8f0' : '#0f172a'
  };
  const [syncingSource, setSyncingSource] = useState<string | null>(null);

  const { data: adminData, isLoading: isAdminLoading } = useQuery({
    queryKey: ['adminDashboard'],
    queryFn: () => adminService.getDashboard(),
    enabled: !!user && user.role === 'ADMIN',
    refetchInterval: 30000
  });

  const { data: statsData } = useQuery({
    queryKey: ['adminGlobalStats'],
    queryFn: () => auctionService.getStats(),
    enabled: !!user && user.role === 'ADMIN',
    staleTime: 60000
  });

  const triggerScrapeMutation = useMutation({
    mutationFn: (sourceCode: string) => adminService.triggerScrape(sourceCode),
    onMutate: (sourceCode) => {
      setSyncingSource(sourceCode);
    },
    onSuccess: (res, sourceCode) => {
      if (res.status === 'FAILED') {
        showToast({ type: 'error', title: `Ingestion failed: ${sourceCode}`, message: res.errorMessage || 'The source returned an error.' });
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
      showToast({ type: 'error', title: 'Scraper error', message: err?.response?.data?.error?.message || err?.message || 'Unknown error' });
    },
    onSettled: () => {
      setSyncingSource(null);
    }
  });

  const toggleSourceMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => adminService.toggleSource(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminDashboard'] });
    }
  });

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/30">
          <Lock className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Administrator access required</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">The ingestion controller and health dashboard is restricted to administrators.</p>
        <div className="pt-2 flex justify-center gap-3">
          {!user && (
            <Link to="/login" state={{ from: { pathname: '/admin' } }} className="btn-primary">
              Sign in
            </Link>
          )}
          {demoLoginEnabled && (
            <button onClick={() => loginAsDemo('ADMIN')} className="btn-ghost border border-slate-200 dark:border-white/10">
              Demo admin
            </button>
          )}
        </div>
      </div>
    );
  }

  const sources = adminData?.sources || [];
  const recentJobs = adminData?.recentJobs || [];
  const metrics = adminData?.metrics;

  const metricCards = metrics
    ? [
        { label: 'Indexed notices', value: metrics.totalAuctions, tone: 'text-slate-900 dark:text-white' },
        { label: 'Live now', value: metrics.liveAuctions, tone: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Registered users', value: metrics.totalUsers, tone: 'text-sky-600 dark:text-sky-400' },
        { label: 'Active alerts', value: metrics.totalAlerts, tone: 'text-amber-600 dark:text-amber-400' }
      ]
    : [];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        icon={<ShieldCheck className="w-6 h-6" />}
        eyebrow="Admin"
        title="Ingestion control"
        description="Monitor adapters, trigger manual syncs and inspect job logs."
        tone="from-sky-500 to-violet-500"
        actions={
          <button onClick={() => queryClient.invalidateQueries({ queryKey: ['adminDashboard'] })} className="btn-ghost border border-slate-200 dark:border-white/10">
            <RefreshCw className={`w-4 h-4 ${isAdminLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        }
      />

      {metrics && (
        <Stagger className="grid grid-cols-2 lg:grid-cols-4 gap-4" gap={0.06} immediate>
          {metricCards.map((c) => (
            <StaggerItem key={c.label}>
              <div className="glass-card rounded-2xl p-5">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{c.label}</div>
                <div className={`mt-1 text-3xl font-extrabold font-mono ${c.tone}`}>
                  <AnimatedNumber value={c.value} />
                </div>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      )}

      <Panel title="Data providers" icon={<Activity className="w-4 h-4" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sources.map((src) => {
            const isHealthy = src.health?.healthy ?? true;
            const isSyncing = syncingSource === src.code;
            return (
              <div key={src.id} className="p-4 rounded-2xl border border-slate-200/70 dark:border-white/[0.07] bg-slate-900/[0.02] dark:bg-white/[0.03] flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <SourceBadge code={src.code} />
                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isHealthy ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {isHealthy ? 'Healthy' : 'Offline'}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{src.name}</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">{src.health?.message || src.description || 'Public adapter connector.'}</p>
                  <div className="text-[11px] text-slate-500 font-mono flex gap-4">
                    <span>
                      {src.code === 'GEM_BIDS' ? 'Bids' : 'Notices'}: <b className="text-slate-800 dark:text-slate-200">{src.auctionCount}</b>
                    </span>
                    {src.health?.responseTimeMs !== undefined && (
                      <span>
                        Latency: <b className="text-slate-800 dark:text-slate-200">{src.health.responseTimeMs}ms</b>
                      </span>
                    )}
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between gap-2">
                  <button
                    role="switch"
                    aria-checked={src.enabled}
                    aria-label={`${src.enabled ? 'Disable' : 'Enable'} ${src.name}`}
                    onClick={() => toggleSourceMutation.mutate({ id: src.id, enabled: !src.enabled })}
                    className="flex items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                  >
                    <span className={`relative w-9 h-5 rounded-full transition-colors ${src.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${src.enabled ? 'translate-x-4' : ''}`} />
                    </span>
                    {src.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                  <button onClick={() => triggerScrapeMutation.mutate(src.code)} disabled={!!syncingSource} className="btn-primary !px-3 !py-1.5 !text-xs">
                    {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    {isSyncing ? 'Running...' : 'Run sync'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {statsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Panel title="Notices by source" icon={<BarChart3 className="w-4 h-4" />}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData.bySource}>
                  <XAxis dataKey="code" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tipStyle} cursor={{ fill: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel title="Notices by status" icon={<Activity className="w-4 h-4" />}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statsData.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={82} paddingAngle={2} stroke="none">
                    {statsData.byStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      )}

      <Panel title="Recent ingestion jobs" icon={<Clock className="w-4 h-4" />} bodyClassName="!p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr className="border-b border-slate-200/70 dark:border-white/[0.06]">
                <th className="py-3 px-5 font-semibold">Source</th>
                <th className="py-3 px-3 font-semibold">Started</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">Found</th>
                <th className="py-3 px-3 font-semibold">Created</th>
                <th className="py-3 px-3 font-semibold">Updated</th>
                <th className="py-3 px-3 font-semibold">Failed</th>
                <th className="py-3 px-5 font-semibold">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.05]">
              {recentJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No ingestion jobs recorded yet.
                  </td>
                </tr>
              ) : (
                recentJobs.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-5">
                      <SourceBadge code={j.source.code} />
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">{new Date(j.startedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          j.status === 'SUCCESS'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : j.status === 'PARTIAL'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                            : j.status === 'RUNNING'
                            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 animate-pulse'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {j.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">{j.recordsFound}</td>
                    <td className="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400">+{j.recordsCreated}</td>
                    <td className="py-3 px-3 font-mono text-sky-600 dark:text-sky-400">~{j.recordsUpdated}</td>
                    <td className="py-3 px-3 font-mono text-rose-600 dark:text-rose-400">{j.recordsFailed}</td>
                    <td className="py-3 px-5 text-slate-600 dark:text-slate-400 truncate max-w-xs" title={j.errorMessage || undefined}>
                      {j.errorMessage || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
