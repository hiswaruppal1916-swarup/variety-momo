import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowLeft,
  AlertCircle,
  Loader2,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { loginOwner, getOwnerSession, OWNER_EMAIL, OWNER_EMAILS } from '../services/authService';

export default function OwnerLogin({ onNavigate }) {
  const [email, setEmail] = useState(OWNER_EMAIL || 'owner@varietymomo.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [error, setError] = useState('');

  // 1. If an active owner session already exists, auto-navigate to owner dashboard
  useEffect(() => {
    let isMounted = true;
    async function checkExisting() {
      try {
        const session = await getOwnerSession();
        if (isMounted && session && session.profile?.role === 'OWNER') {
          if (onNavigate) {
            onNavigate('owner-dashboard', true);
          } else {
            window.location.pathname = '/owner-dashboard';
          }
          return;
        }
      } catch (err) {
        console.warn('Existing session check on login page:', err);
      } finally {
        if (isMounted) setCheckingExisting(false);
      }
    }

    checkExisting();
    return () => {
      isMounted = false;
    };
  }, [onNavigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await loginOwner(email, password);
      if (onNavigate) {
        onNavigate('owner-dashboard', true);
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

  if (checkingExisting) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center text-white gap-3 p-4">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-xs text-stone-400 font-medium">Checking owner authorization...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-stone-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 px-4 text-white">
      {/* Top Bar with Back to Store */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => onNavigate ? onNavigate('home') : window.location.pathname = '/'}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-200 hover:text-white text-xs font-bold transition-all border border-stone-800 shadow-sm active:scale-95 cursor-pointer"
          title="Back to Customer Storefront"
        >
          <ArrowLeft className="w-4 h-4 text-brand-400" />
          <span>Back to Store</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img
            src="/variety-momo-logo.jpg"
            alt="Variety Momo Logo"
            className="w-16 h-16 rounded-full object-cover shadow-lg ring-2 ring-brand-500/50"
          />
        </div>
        <div className="mt-3 flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-xs">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Owner Portal</span>
          </span>
        </div>
        <h2 className="mt-2 text-center font-outfit text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-stone-300">
                  Owner Email
                </label>
              </div>

              <div className="relative rounded-xl shadow-xs">
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

              {/* Quick Select Owner Emails */}
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-stone-500">Quick select:</span>
                {OWNER_EMAILS.slice(0, 2).map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setEmail(em)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors ${
                      email.toLowerCase().trim() === em.toLowerCase().trim()
                        ? 'bg-brand-500/20 text-brand-400 border-brand-500/40'
                        : 'bg-stone-800/80 text-stone-400 border-stone-700 hover:text-stone-200'
                    }`}
                  >
                    {em}
                  </button>
                ))}
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-stone-950 text-white block w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm border border-stone-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-200"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs sm:text-sm font-bold text-white bg-brand-600 hover:bg-brand-500 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 transition-all active:scale-98 cursor-pointer"
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
              className="inline-flex items-center gap-1.5 text-xs text-stone-400 hover:text-white transition-colors cursor-pointer"
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
