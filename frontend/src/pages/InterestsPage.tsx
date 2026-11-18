import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, BellRing, Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { sourceService } from '../services/sourceService';
import { interestService } from '../services/interestService';
import { InterestPicker, pickableCategories } from '../components/interests/InterestPicker';
import { PageHeader } from '../components/ui/PageHeader';
import { Panel } from '../components/ui/Panel';

const MAX = 20;

/** "What do you deal in?" Shown right after sign-up and reachable any time from the account menu. */
export const InterestsPage: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const onboarding = !!(useLocation().state as { onboarding?: boolean } | null)?.onboarding;

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => sourceService.getCategories(),
    staleTime: 300000
  });
  const { data: saved, isLoading: savedLoading } = useQuery({
    queryKey: ['interests', user?.id],
    queryFn: () => interestService.getInterests(),
    enabled: !!user
  });

  const options = useMemo(() => pickableCategories(categories), [categories]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // Start from what is already saved. Legacy duplicate categories are mapped to the one shown by name.
  useEffect(() => {
    if (!saved || hydrated || options.length === 0) return;
    const byName = new Map(options.map((o) => [o.name.trim().toLowerCase(), o.id]));
    setSelected(new Set(saved.map((c) => byName.get(c.name.trim().toLowerCase()) ?? c.id)));
    setHydrated(true);
  }, [saved, options, hydrated]);

  const save = useMutation({
    mutationFn: () => interestService.setInterests([...selected]),
    onSuccess: (result) => {
      queryClient.setQueryData(['interests', user?.id], result);
      queryClient.invalidateQueries({ queryKey: ['forYou'] });
      showToast({
        type: 'success',
        title: result.length ? 'Interests saved' : 'Interests cleared',
        message: result.length ? 'We will notify you about new notices in these categories.' : 'You will not get category notifications.'
      });
      navigate('/');
    },
    onError: (err: any) => {
      showToast({ type: 'error', title: 'Could not save', message: err.response?.data?.error?.message || err.message || 'Please try again.' });
    }
  });

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (!authLoading && !user) return <Navigate to="/login" replace />;

  const loading = catsLoading || savedLoading;

  return (
    <div className="space-y-8 pb-6">
      <PageHeader
        icon={<Sparkles className="w-6 h-6" />}
        eyebrow={onboarding ? 'Welcome to AuctionLens' : 'Personalise'}
        title={onboarding && user ? `What do you deal in, ${user.name.split(' ')[0]}?` : 'My interests'}
        description="Pick the categories you care about. We will notify you when a new auction or bid is published in them, and fill your home page with matching notices."
      />

      <Panel
        title={`Categories${selected.size ? ` · ${selected.size} selected` : ''}`}
        icon={<BellRing className="w-4 h-4" />}
        action={selected.size > 0 ? <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-semibold text-slate-500 hover:text-rose-500 transition-colors">Clear all</button> : undefined}
      >
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" aria-busy>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-[74px] rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <InterestPicker categories={options} selected={selected} onToggle={toggle} max={MAX} />
        )}
      </Panel>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          You can change this any time from the account menu. For finer control (state, price, keywords) use{' '}
          <Link to="/alerts" className="font-semibold text-emerald-600 dark:text-emerald-300 hover:underline">alert rules</Link>.
        </p>
        <div className="flex items-center gap-3">
          {onboarding && (
            <button type="button" onClick={() => navigate('/')} className="btn-ghost border border-slate-200 dark:border-white/10 !py-3">
              Skip for now
            </button>
          )}
          <button type="button" onClick={() => save.mutate()} disabled={save.isPending || loading || (onboarding && selected.size === 0)} className="btn-primary !py-3">
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {onboarding ? 'Save & continue' : 'Save interests'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
