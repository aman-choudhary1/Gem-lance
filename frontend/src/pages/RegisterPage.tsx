import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, m } from 'framer-motion';
import { AlertCircle, ArrowRight, Check, Eye, EyeOff, Loader2, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthShell } from '../components/auth/AuthShell';
import { AuthField } from '../components/auth/AuthField';

const MIN_LENGTH = 8; // matches the server-side rule

const LEVELS = [
  { label: 'Too short', bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  { label: 'Weak', bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
  { label: 'Fair', bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  { label: 'Good', bar: 'bg-lime-500', text: 'text-lime-600 dark:text-lime-400' },
  { label: 'Strong', bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' }
];

function assess(password: string) {
  const rules = [
    { ok: password.length >= MIN_LENGTH, label: `At least ${MIN_LENGTH} characters` },
    { ok: /[a-z]/.test(password) && /[A-Z]/.test(password), label: 'Upper & lower case letters' },
    { ok: /\d/.test(password), label: 'A number' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'A symbol' }
  ];
  const passed = rules.filter((r) => r.ok).length;
  // 0 = too short; otherwise 1..4 from the rules met (the length rule is already true here), with a bonus for 12+ chars.
  const score = password.length < MIN_LENGTH ? 0 : Math.min(4, passed + (password.length >= 12 ? 1 : 0));
  return { rules, score };
}

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shakeKey, setShakeKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { rules, score } = useMemo(() => assess(password), [password]);
  const level = LEVELS[score];
  const canSubmit = name.trim().length >= 2 && email.length > 3 && password.length >= MIN_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !canSubmit) return;
    setError(null);
    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/interests', { state: { onboarding: true } });
    } catch (err: any) {
      const details = err.response?.data?.error?.details as Array<{ message: string }> | undefined;
      setError(details?.[0]?.message || err.response?.data?.error?.message || err.message || 'Could not create your account.');
      setShakeKey((k) => k + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save auctions, build a watchlist and set alerts — it's free."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-emerald-600 dark:text-emerald-300 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <AnimatePresence>
        {error && (
          <m.div key={shakeKey} role="alert" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: 20 }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} className="overflow-hidden">
            <div className="animate-shake flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-px" />
              <span>{error}</span>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField label="Full name" icon={<User className="w-[18px] h-[18px]" />} name="name" autoComplete="name" required minLength={2} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />

        <AuthField label="Email address" icon={<Mail className="w-[18px] h-[18px]" />} type="email" name="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />

        <div>
          <AuthField
            label="Password"
            icon={<Lock className="w-[18px] h-[18px]" />}
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="new-password"
            required
            minLength={MIN_LENGTH}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={`At least ${MIN_LENGTH} characters`}
            trailing={
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/10 transition">
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            }
          />

          <AnimatePresence initial={false}>
            {password.length > 0 && (
              <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="pt-3 space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 grid grid-cols-4 gap-1.5" aria-hidden>
                      {[1, 2, 3, 4].map((i) => (
                        <span key={i} className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                          <m.span className={`block h-full ${level.bar}`} initial={false} animate={{ width: score >= i ? '100%' : '0%' }} transition={{ duration: 0.3 }} />
                        </span>
                      ))}
                    </div>
                    <span className={`text-xs font-semibold w-16 text-right ${level.text}`} aria-live="polite">{level.label}</span>
                  </div>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    {rules.map((r) => (
                      <li key={r.label} className={`flex items-center gap-1.5 text-xs transition-colors ${r.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors ${r.ok ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10'}`}>
                          {r.ok && <Check className="w-2.5 h-2.5" strokeWidth={3.5} />}
                        </span>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </div>

        <m.button whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading || !canSubmit} className="btn-primary w-full !py-3.5 !text-[15px] !rounded-2xl">
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Creating account…
            </>
          ) : (
            <>
              Create account <ArrowRight className="w-4 h-4" />
            </>
          )}
        </m.button>

        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          We never ask for your government-portal credentials, and we never place bids on your behalf.
        </p>
      </form>
    </AuthShell>
  );
};
