import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { loginOwner, OWNER_EMAIL } from '../services/authService';

export default function OwnerLogin({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginOwner(email, password);
      if (onNavigate) {
        onNavigate('owner-dashboard');
      } else {
        window.location.pathname = '/owner-dashboard';
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            src="/variety-momo-logo.jpg"
            alt="Variety Momo Logo"
            className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-brand-500/50"
          />
        </div>
        <h2 className="mt-4 text-center font-outfit text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Owner Portal Login
        </h2>
        <p className="mt-1 text-center text-xs sm:text-sm text-stone-400">
          Variety Momo • Mecheda, West Bengal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-stone-900 py-8 px-6 shadow-2xl rounded-3xl sm:px-10 border border-stone-800">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-300">
                Owner Email
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-stone-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={OWNER_EMAIL}
                  className="bg-stone-950 text-white block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-stone-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300">
                Password
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-stone-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-stone-950 text-white block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-stone-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs sm:text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all active:scale-98"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>Access Owner Dashboard</span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-800 text-center">
            <button
              onClick={() => onNavigate ? onNavigate('home') : window.location.pathname = '/'}
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Public Storefront</span>
            </button>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Secured via Supabase Auth & PostgreSQL Row-Level Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
