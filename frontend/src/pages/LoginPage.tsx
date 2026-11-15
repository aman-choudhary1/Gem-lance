import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Gavel, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loginAsDemo } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async (role: 'ADMIN' | 'BUYER') => {
    setIsLoading(true);
    try {
      await loginAsDemo(role);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-16">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/40">
            <Gavel className="w-6 h-6 text-slate-950" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Sign in to AuctionLens</h1>
          <p className="text-xs text-slate-400">
            Access your saved watchlists, alert rules, and monitor multi-portal forward auctions.
          </p>
        </div>

        {/* One-Click Demo Logins */}
        <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <Sparkles className="w-3.5 h-3.5" /> Fast Evaluation (Instant Demo)
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('BUYER')}
              className="px-3 py-2 text-xs rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 font-medium transition text-center"
            >
              Demo Buyer
            </button>
            <button
              type="button"
              onClick={() => handleDemo('ADMIN')}
              className="px-3 py-2 text-xs rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 font-medium transition text-center"
            >
              Demo Admin
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-300 block mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="buyer@auctionlens.io"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In to Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-emerald-400 font-semibold hover:underline">
            Register for free
          </Link>
        </div>
      </div>
    </div>
  );
};
