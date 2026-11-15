import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, m } from 'framer-motion';
import { alertService } from '../services/alertService';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import { PageHeader } from '../components/ui/PageHeader';
import { formatRelativeTime } from '../utils/formatters';
import { Bell, CheckCheck, Clock, ArrowRight } from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['allNotificationsPage', user?.id],
    queryFn: () => alertService.getNotifications(),
    enabled: !!user,
    refetchInterval: 15000
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['allNotificationsPage'] });
  const markAll = useMutation({ mutationFn: () => alertService.markAllNotificationsRead(), onSuccess: refresh });
  const markOne = useMutation({ mutationFn: (id: string) => alertService.markNotificationRead(id), onSuccess: refresh });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        icon={<Bell className="w-6 h-6" />}
        eyebrow="Inbox"
        title="Notifications"
        description="New notices that matched your alert rules appear here."
        tone="from-violet-500 to-fuchsia-500"
        actions={
          unreadCount > 0 && (
            <button onClick={() => markAll.mutate()} disabled={markAll.isPending} className="btn-ghost border border-slate-200 dark:border-white/10">
              <CheckCheck className="w-4 h-4 text-emerald-500" /> Mark all read ({unreadCount})
            </button>
          )
        }
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-slate-200/70 dark:bg-white/[0.05] relative overflow-hidden">
              <div className="absolute inset-0 shimmer" />
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-violet-500" />}
          title="You are all caught up"
          description="When a newly indexed notice matches one of your alert rules, it will show up here."
          actionLabel="Manage alert rules"
          onAction={() => navigate('/alerts')}
        />
      ) : (
        <ul className="space-y-2.5">
          <AnimatePresence initial={false}>
            {notifications.map((n, i) => (
              <m.li
                key={n.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.35 }}
                className={`relative p-4 pl-5 rounded-2xl border flex items-start justify-between gap-4 overflow-hidden ${
                  n.read ? 'bg-white/60 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.06]' : 'bg-white dark:bg-slate-900/80 border-emerald-500/30 shadow-md shadow-emerald-500/5'
                }`}
              >
                {!n.read && <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-cyan-400" />}
                <div className="space-y-1 min-w-0">
                  <h2 className={`text-sm ${n.read ? 'font-semibold text-slate-700 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>{n.title}</h2>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{n.message}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1" title={new Date(n.createdAt).toLocaleString()}>
                      <Clock className="w-3 h-3" /> {formatRelativeTime(n.createdAt)}
                    </span>
                    {n.auction && (
                      <Link to={`/auctions/${n.auction.externalId}`} className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:gap-1.5 transition-all">
                        View notice <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
                {!n.read && (
                  <button
                    onClick={() => markOne.mutate(n.id)}
                    aria-label="Mark as read"
                    title="Mark as read"
                    className="p-2 rounded-lg text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition shrink-0"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </m.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
};
