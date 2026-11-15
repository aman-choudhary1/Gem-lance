import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../services/alertService';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import { Bell, CheckCheck, ExternalLink, Clock } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['allNotificationsPage', user?.id],
    queryFn: () => alertService.getNotifications(),
    enabled: !!user,
    refetchInterval: 15000
  });

  const markAllMutation = useMutation({
    mutationFn: () => alertService.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotificationsPage'] });
    }
  });

  const markSingleMutation = useMutation({
    mutationFn: (id: string) => alertService.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotificationsPage'] });
    }
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-2xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Notification Center</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Real-time feed of alerts triggered by your active monitoring rules.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-slate-500" />}
          title="No notifications received yet"
          description="Whenever a newly indexed forward auction matches one of your alert rules, a direct notification will appear here."
          actionLabel="Manage Alert Rules"
          onAction={() => (window.location.href = '/alerts')}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition flex items-start justify-between gap-4 ${
                n.read
                  ? 'bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-400'
                  : 'bg-slate-900/80 border-emerald-500/30 shadow-md'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0"></span>}
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{n.title}</h4>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{n.message}</p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                  {n.auction && (
                    <Link
                      to={`/auctions/${n.auction.externalId}`}
                      className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      Inspect Lot &rarr;
                    </Link>
                  )}
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => markSingleMutation.mutate(n.id)}
                  className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 p-1.5 shrink-0"
                  title="Mark as read"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
