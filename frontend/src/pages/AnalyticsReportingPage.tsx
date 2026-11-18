import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sourceService, SiteAnalyticsItem, AnalyticsReportData } from '../services/sourceService';
import { useToast } from '../context/ToastContext';
import { PageHeader } from '../components/ui/PageHeader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { SourceBadge } from '../components/common/SourceBadge';
import { CgFullFetchModal } from '../components/admin/CgFullFetchModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Activity,
  Layers,
  Database,
  RefreshCw,
  DownloadCloud,
  Download,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Zap,
  Globe2,
  Calendar,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];

export const AnalyticsReportingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showIngestionStart, showIngestionSuccess, showIngestionError, showToast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  // Triggering ingestion is an admin-only API; hide the controls for everyone else.
  const canSync = user?.role === 'ADMIN';

  const [searchFilter, setSearchFilter] = useState('');
  const [regionFilter, setRegionFilter] = useState<'ALL' | 'Central' | 'State' | 'Union Territory'>('ALL');
  const [activeOnly, setActiveOnly] = useState(false);
  const [syncingCode, setSyncingCode] = useState<string | null>(null);
  const [fullFetchOpen, setFullFetchOpen] = useState(false);
  const [batchSyncing, setBatchSyncing] = useState(false);

  // 1. Fetch Analytics Report Data
  const { data, isLoading, isError, refetch } = useQuery<AnalyticsReportData>({
    queryKey: ['analyticsReport'],
    queryFn: () => sourceService.getAnalyticsReport(),
    refetchInterval: 30000 // auto-refresh every 30s
  });

  // 2. Single Portal Sync Mutation
  const singleSyncMutation = useMutation({
    mutationFn: async ({ code, name }: { code: string; name: string }) => {
      setSyncingCode(code);
      const toastId = showIngestionStart(code, name);
      try {
        const result = await sourceService.triggerSync(code);
        if (result.status === 'FAILED') {
          showIngestionError(toastId, code, result.errorMessage || 'Ingestion failed');
        } else {
          showIngestionSuccess(toastId, result, name);
        }
        // New data affects counts and lists across the whole app (home stats, state map, categories,
        // bids, ending soon, discover tabs...), so refresh every query that is currently on screen.
        queryClient.invalidateQueries();
        return result;
      } catch (err: any) {
        showIngestionError(toastId, code, err.response?.data?.error?.message || err.message || 'Ingestion failed');
        throw err;
      } finally {
        setSyncingCode(null);
      }
    }
  });

  // 3. Batch Sync Mutation (Priority Portals)
  const batchSyncMutation = useMutation({
    mutationFn: async () => {
      setBatchSyncing(true);
      const toastId = showIngestionStart('BATCH_SYNC', 'Priority Central & State Portals');
      try {
        const results = await sourceService.triggerBatchSync();
        const sum = (key: 'recordsFound' | 'recordsCreated' | 'recordsUpdated' | 'recordsFailed' | 'durationMs') =>
          results.reduce((acc, r) => acc + (r[key] || 0), 0);
        const failedSources = results.filter((r) => r.status === 'FAILED');
        if (results.length > 0 && failedSources.length === results.length) {
          showIngestionError(toastId, 'BATCH', `All ${results.length} portals failed to sync`);
        } else {
          showIngestionSuccess(
            toastId,
            {
              sourceCode: 'BATCH',
              jobId: 'BATCH_JOB',
              status: failedSources.length > 0 ? 'PARTIAL' : 'SUCCESS',
              recordsFound: sum('recordsFound'),
              recordsCreated: sum('recordsCreated'),
              recordsUpdated: sum('recordsUpdated'),
              recordsFailed: sum('recordsFailed'),
              durationMs: sum('durationMs')
            },
            failedSources.length > 0
              ? `Priority portals (${failedSources.length} of ${results.length} failed)`
              : 'Priority Central & State Portals'
          );
        }
        queryClient.invalidateQueries();
      } catch (err: any) {
        showIngestionError(toastId, 'BATCH', err.response?.data?.error?.message || err.message || 'Batch sync failed');
      } finally {
        setBatchSyncing(false);
      }
    }
  });

  // Export to CSV Helper
  const handleExportCsv = () => {
    if (!data?.sites) return;
    const headers = ['Source Code', 'Portal Name', 'Region', 'State', 'Indexed Tenders', 'Last Status', 'Base URL'];
    const rows = data.sites.map((s) => [
      s.code,
      `"${s.name.replace(/"/g, '""')}"`,
      s.region,
      s.state,
      s.auctionCount,
      s.latestJob?.status || 'NOT_RUN',
      s.baseUrl || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `procurement_sites_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Sites
  const filteredSites = useMemo(() => {
    if (!data?.sites) return [];
    return data.sites.filter((s) => {
      if (activeOnly && s.auctionCount === 0) return false;
      if (regionFilter !== 'ALL' && s.region !== regionFilter) return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        return (
          s.code.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.state.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data?.sites, searchFilter, regionFilter, activeOnly]);

  // Chart Data: Top 10 Portals
  const topPortalsChartData = useMemo(() => {
    if (!data?.sites) return [];
    return [...data.sites]
      .sort((a, b) => b.auctionCount - a.auctionCount)
      .slice(0, 8)
      .map((s) => ({
        name: s.code.replace('_TENDERS', ''),
        auctions: s.auctionCount
      }));
  }, [data?.sites]);

  // Format Indian Currency
  const formatLotValue = (val: number) => {
    if (val >= 10000000) {
      return `₹ ${(val / 10000000).toFixed(1)} Cr`;
    }
    if (val >= 100000) {
      return `₹ ${(val / 100000).toFixed(1)} Lakh`;
    }
    return `₹ ${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        icon={<Activity className="w-6 h-6" />}
        eyebrow="Ingestion intelligence"
        title="Analytics and reporting"
        description="Audit of notices fetched across central, state and union-territory e-procurement portals."
        tone="from-emerald-500 to-indigo-500"
        actions={
          <>
            {canSync && (
              <button onClick={() => batchSyncMutation.mutate()} disabled={batchSyncing} className="btn-primary">
                <Zap className={`w-4 h-4 ${batchSyncing ? 'animate-spin' : ''}`} />
                {batchSyncing ? 'Syncing...' : 'Sync priority portals'}
              </button>
            )}
            <button onClick={handleExportCsv} className="btn-ghost border border-slate-200 dark:border-white/10">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Export CSV
            </button>
            <button onClick={() => refetch()} aria-label="Refresh data" title="Refresh data" className="btn-ghost border border-slate-200 dark:border-white/10 !px-3">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Bids / Tenders
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {data?.summary.totalAuctions.toLocaleString() || '...'}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Indexed across connected portals
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Lot Valuation
            </span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {data?.summary.totalLotValue ? formatLotValue(data.summary.totalLotValue) : '₹ 0'}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Estimated procurement value
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Connected Portals
            </span>
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <Globe2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {data?.summary.activeSources || 0}
            <span className="text-xs font-normal text-slate-400 ml-1.5">/ {data?.summary.totalSources ?? 0}</span>
          </div>
          <div className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
            Active feeds indexing tenders
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Pipeline Ingestions
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {data?.summary.totalScrapeJobs || 0}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Auto & on-demand cycles
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Tenders by Top Portals */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Portals by Indexed Tenders</h3>
              <p className="text-xs text-slate-500">Highest volume procurement repositories</p>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
              Live Volume
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPortalsChartData}>
                <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="auctions" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Status Distribution */}
        <div className="glass-card p-6 rounded-2xl space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Opportunity Status</h3>
            <p className="text-xs text-slate-500">Real-time status breakdown</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.statusBreakdown || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {(data?.statusBreakdown || []).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    color: '#f8fafc',
                    fontSize: '12px'
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                  formatter={(value) => <span className="text-slate-400 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Sites Ingestion Analysis Table */}
      <div className="glass-card rounded-2xl overflow-hidden space-y-4">
        {/* Table Filter Controls */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              All Connected Procurement Sites ({filteredSites.length})
            </h3>
            <p className="text-xs text-slate-500">
              Live tender counts, last ingestion status, and on-demand fetch actions for every portal.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by state or portal..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-56"
              />
            </div>

            {/* Region Filter Buttons */}
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
              {(['ALL', 'Central', 'State', 'Union Territory'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegionFilter(r)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    regionFilter === r
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {r === 'ALL' ? 'All Sites' : r}
                </button>
              ))}
            </div>

            {/* Active Toggle */}
            <button
              onClick={() => setActiveOnly(!activeOnly)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
                activeOnly
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
              }`}
            >
              Active Only
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5 font-bold">Portal & Code</th>
                <th className="px-4 py-3.5 font-bold">Region & State</th>
                <th className="px-4 py-3.5 font-bold">Tenders / Bids Count</th>
                <th className="px-4 py-3.5 font-bold">Last Ingestion Status</th>
                <th className="px-4 py-3.5 font-bold">Health</th>
                {canSync && <th className="px-6 py-3.5 font-bold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 font-sans">
              {filteredSites.map((site) => {
                const isSyncing = syncingCode === site.code;
                return (
                  <tr
                    key={site.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    {/* Portal Code & Name */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <SourceBadge code={site.code} className="text-[10px] px-2 py-0.5" />
                          {site.baseUrl && (
                            <a
                              href={site.baseUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-emerald-500 transition"
                              title="Open Government Portal"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-white text-xs max-w-xs truncate">
                          {site.name}
                        </div>
                      </div>
                    </td>

                    {/* Region & State */}
                    <td className="px-4 py-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200">{site.state}</span>
                      <div className="text-[10px] text-slate-500">{site.region}</div>
                    </td>

                    {/* Tenders Count */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-mono font-bold text-sm ${
                            site.auctionCount > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {site.auctionCount.toLocaleString()}
                        </span>
                        {site.auctionCount > 0 && (
                          <span className="text-[10px] text-slate-400 font-sans">notices</span>
                        )}
                      </div>
                    </td>

                    {/* Ingestion Status */}
                    <td className="px-4 py-4">
                      {site.latestJob ? (
                        <div className="space-y-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase font-mono ${
                              site.latestJob.status === 'SUCCESS'
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : site.latestJob.status === 'RUNNING'
                                ? 'bg-cyan-500/15 text-cyan-500 border border-cyan-500/30'
                                : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {site.latestJob.status}
                          </span>
                          {site.latestJob.durationMs && (
                            <div className="text-[10px] text-slate-400">
                              {(site.latestJob.durationMs / 1000).toFixed(1)}s run
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Ready</span>
                      )}
                    </td>

                    {/* Health */}
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                          site.health?.healthy
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-500'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {site.health?.healthy ? 'Operational' : 'Check'}
                      </span>
                    </td>

                    {/* Action Button: Fetch Live Now (admins only) */}
                    {canSync && (
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => singleSyncMutation.mutate({ code: site.code, name: site.name })}
                        disabled={isSyncing}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm ${
                          isSyncing
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-transparent'
                        }`}
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Fetching...' : 'Fetch Live Now'}
                      </button>
                      {site.code === 'CGSTATE' && (
                        <button
                          onClick={() => setFullFetchOpen(true)}
                          title="The public list shows at most 50 tenders per department. Full fetch reads every open tender (you type the portal's code once)."
                          className="mt-2 ml-auto flex w-max items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm bg-amber-500/10 hover:bg-amber-500 text-amber-700 dark:text-amber-300 hover:text-white border border-amber-500/30 hover:border-transparent"
                        >
                          <DownloadCloud className="w-3 h-3" />
                          Full fetch (all)
                        </button>
                      )}
                    </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Ingestion Audit Log */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Ingestion Jobs Audit Log</h3>
            <p className="text-xs text-slate-500">Chronological history of background and manual tender sync runs</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Last 15 Cycles</span>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
          {(data?.recentJobs || []).slice(0, 10).map((job) => (
            <div key={job.id} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <SourceBadge code={job.source?.code || 'PORTAL'} className="text-[10px] px-2 py-0.5" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {job.source?.name || 'Tender Portal Sync'}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{new Date(job.startedAt).toLocaleTimeString()}</span>
                    <span>•</span>
                    <span className="text-emerald-500 font-mono">+{job.recordsCreated} created</span>
                    <span>•</span>
                    <span className="text-slate-400">{job.recordsUpdated} updated</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                    job.status === 'SUCCESS'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {job.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {fullFetchOpen && (
        <CgFullFetchModal
          onClose={() => setFullFetchOpen(false)}
          onImported={(r) => {
            queryClient.invalidateQueries();
            showToast({
              type: 'success',
              title: 'Chhattisgarh full fetch complete',
              message: `${r.recordsFound.toLocaleString('en-IN')} tenders read from ${r.pagesRead} pages: ${r.recordsCreated.toLocaleString('en-IN')} new, ${r.recordsUpdated.toLocaleString('en-IN')} updated.`
            });
          }}
        />
      )}
    </div>
  );
};
