import React from 'react';
import { Link } from 'react-router-dom';
import { Gavel, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
        <Gavel className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-black text-white">404</h1>
      <h2 className="text-lg font-bold text-slate-200">Page Not Found</h2>
      <p className="text-xs text-slate-400">
        The auction page or directory location you are trying to visit does not exist or has moved.
      </p>
      <div className="pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-lg shadow-emerald-900/30"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home Dashboard
        </Link>
      </div>
    </div>
  );
};
