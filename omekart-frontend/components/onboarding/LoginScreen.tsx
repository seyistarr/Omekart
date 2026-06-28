'use client';

import { useState } from 'react';
import { useOnboarding } from './OnboardingProvider';
import { createClient } from '@/lib/supabase/client';

export default function LoginScreen() {
  const { navigateTo, login, setLogin, setUserId } = useOnboarding();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: login.emailOrPhone,
      password: login.password,
    });

    if (error) {
      alert(error.message);
      setIsSubmitting(false);
      return;
    }

    if (data.user) {
      setUserId(data.user.id);
    }

    // For MVP, navigate to hubs; later you can check onboarding_completed
    navigateTo('hubs');
    setIsSubmitting(false);
  }

  return (
    <section className="flex flex-col flex-1 py-4">
      <div className="flex items-center space-x-3 mb-4">
        <button
          onClick={() => navigateTo('welcome')}
          className="w-8 h-8 rounded-lg border border-slate-200/70 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <i className="fas fa-chevron-left text-[10px]" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-950 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-400 font-medium">Log in to continue shopping</p>
        </div>
      </div>

      <div className="w-full flex justify-center mb-5">
        <div className="w-full h-32 rounded-xl overflow-hidden relative border border-slate-100 bg-violet-950 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=500"
            alt="Marketplace Banner"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-violet-950 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4">
            <span className="text-[9px] uppercase font-bold tracking-widest text-violet-400 bg-violet-900/60 backdrop-blur-sm px-2 py-0.5 rounded">
              Exclusive Network
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email or Phone
            </label>
            <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-100/10 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all duration-150">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <i className="far fa-user text-xs" />
              </span>
              <input
                type="text"
                required
                value={login.emailOrPhone}
                onChange={(e) => setLogin({ emailOrPhone: e.target.value })}
                placeholder="you@company.com"
                className="w-full pl-9 pr-4 py-2.5 bg-transparent focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <a href="/forgot-password" className="text-xs font-bold text-violet-600 hover:underline">
                Forgot Password?
              </a>
            </div>
            <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-100/10 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all duration-150">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <i className="fas fa-lock text-[10px]" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={login.password}
                onChange={(e) => setLogin({ password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2.5 bg-transparent focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className={`far ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 space-y-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all active:scale-[0.995] disabled:opacity-50"
          >
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </button>
          <p className="text-center text-xs text-slate-400 font-medium pt-1">
            New to OmeKart?{' '}
            <button
              type="button"
              onClick={() => navigateTo('create-account')}
              className="text-violet-600 font-bold hover:underline"
            >
              Create an Account
            </button>
          </p>
        </div>
      </form>
    </section>
  );
}