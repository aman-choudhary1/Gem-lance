import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { authService } from '../services/authService';
import { AuthShell } from '../components/auth/AuthShell';
import { AuthField } from '../components/auth/AuthField';

const backToSignIn = (
  <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-300 hover:underline">
    Back to sign in
  </Link>
);

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;
  const tooShort = password.length > 0 && password.length < 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || mismatch || tooShort) return;
    setError(null);
    setIsLoading(true);
    try {
      await authService.resetPassword(token, password);
      navigate('/login', { replace: true, state: { notice: 'Password updated. Please sign in with your new password.' } });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Could not reset the password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title="Reset link missing" subtitle="This page needs the link from your reset email." footer={backToSignIn}>
        <Link to="/forgot-password" className="btn-primary w-full !py-3.5 !rounded-2xl">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Use at least 8 characters. You will be signed out on all devices." footer={backToSignIn}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div role="alert" className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-px" />
            <span>
              {error}{' '}
              <Link to="/forgot-password" className="underline font-semibold">
                Request a new link
              </Link>
            </span>
          </div>
        )}
        <AuthField
          label="New password"
          icon={<Lock className="w-[18px] h-[18px]" />}
          type={show ? 'text' : 'password'}
          name="new-password"
          autoComplete="new-password"
          required
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          invalid={tooShort}
          hint={tooShort ? <span className="text-rose-600 dark:text-rose-400">At least 8 characters</span> : undefined}
          trailing={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10 transition"
            >
              {show ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          }
        />
        <AuthField
          label="Confirm new password"
          icon={<Lock className="w-[18px] h-[18px]" />}
          type={show ? 'text' : 'password'}
          name="confirm-password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          invalid={mismatch}
          hint={mismatch ? <span className="text-rose-600 dark:text-rose-400">Passwords do not match</span> : undefined}
        />
        <button type="submit" disabled={isLoading || !password || !confirm || mismatch || tooShort} className="btn-primary w-full !py-3.5 !text-[15px] !rounded-2xl">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              Update password <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
};
