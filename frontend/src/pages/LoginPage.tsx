import React, { useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { demoLoginEnabled } from '../config/demo';
import { AuthShell } from '../components/auth/AuthShell';
import { AuthField } from '../components/auth/AuthField';

export const LoginPage: React.FC = () => {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const fail = (message: string) => {
    setError(message);
    setShakeKey((k) => k + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err: any) {
      fail(err.response?.data?.error?.message || err.message || 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role: 'ADMIN' | 'BUYER') => {
    setError(null);
    setIsLoading(true);
    try {
      await loginAsDemo(role);
      navigate(from, { replace: true });
    } catch (err: any) {
      fail(err.message || 'Demo sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to see your saved auctions and alerts."
      footer={
        <>
          New to AuctionLens?{' '}
          <Link to="/register" className="font-semibold text-emerald-600 dark:text-emerald-300 hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <AnimatePresence>
        {error && (
          <m.div
            key={shakeKey}
            role="alert"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="animate-shake flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate={false}>
        <AuthField
          ref={emailRef}
          label="Email address"
          icon={<Mail className="w-[18px] h-[18px]" />}
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          invalid={!!error}
        />

        <AuthField
          label="Password"
          icon={<Lock className="w-[18px] h-[18px]" />}
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyUp={(e) => setCapsOn(e.getModifierState('CapsLock'))}
          onBlur={() => setCapsOn(false)}
          placeholder="Your password"
          invalid={!!error}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10 transition"
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          }
          hint={capsOn ? <span className="text-amber-600 dark:text-amber-400 font-medium">Caps Lock is on</span> : undefined}
        />

        <m.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading || !email || !password} className="btn-primary w-full !py-3.5 !text-[15px] !rounded-2xl">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight className="w-4 h-4" />
            </>
          )}
        </m.button>
      </form>

      {demoLoginEnabled && (
        <div className="mt-7">
          <div className="relative flex items-center justify-center mb-4">
            <span className="absolute inset-x-0 h-px bg-slate-200 dark:bg-white/10" />
            <span className="relative px-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Development only
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={isLoading} onClick={() => handleDemo('BUYER')} className="btn-ghost border border-slate-200 dark:border-white/10 !py-2.5">
              Demo buyer
            </button>
            <button type="button" disabled={isLoading} onClick={() => handleDemo('ADMIN')} className="btn-ghost border border-slate-200 dark:border-white/10 !py-2.5">
              Demo admin
            </button>
          </div>
        </div>
      )}
    </AuthShell>
  );
};
