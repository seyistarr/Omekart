// components/onboarding/ForgetPasswordScreen.tsx
'use client';

import { useState } from 'react';
import { useOnboarding } from './OnboardingProvider';
import { createClient } from '@/lib/supabase/client';

export default function ForgetPasswordScreen() {
  const { navigateTo } = useOnboarding();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function sendResetLink() {
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      alert(error.message);
      setIsSubmitting(false);
      return;
    }

    setIsSent(true);
    setIsSubmitting(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendResetLink();
  }

  if (isSent) {
    return (
      <section className="flex flex-col flex-1 py-4">
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => navigateTo('login')}
            className="w-8 h-8 rounded-lg border border-slate-200/70 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-chevron-left text-[10px]" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-950 tracking-tight">Check Your Email</h2>
            <p className="text-xs text-slate-400 font-medium">We sent you a reset link</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-5">
            <i className="far fa-envelope-open text-2xl text-violet-600" />
          </div>
          <p className="text-sm font-semibold text-slate-800 mb-1">
            Reset link sent
          </p>
          <p className="text-xs text-slate-400 font-medium max-w-[240px] leading-relaxed">
            We've sent a password reset link to <span className="text-slate-600 font-bold">{email}</span>. Check your inbox and follow the instructions.
          </p>
        </div>

        <div className="pt-6 space-y-3">
          <button
            type="button"
            onClick={sendResetLink}
            disabled={isSubmitting}
            className="w-full bg-violet-50 hover:bg-violet-100 text-violet-700 font-semibold py-3 rounded-xl shadow-sm transition-all active:scale-[0.995] disabled:opacity-50"
          >
            {isSubmitting ? 'Resending...' : 'Resend Email'}
          </button>
          <button
            type="button"
            onClick={() => navigateTo('login')}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all active:scale-[0.995]"
          >
            Back to Login
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col flex-1 py-4">
      <div className="flex items-center space-x-3 mb-4">
        <button
          onClick={() => navigateTo('login')}
          className="w-8 h-8 rounded-lg border border-slate-200/70 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <i className="fas fa-chevron-left text-[10px]" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-950 tracking-tight">Forgot Password</h2>
          <p className="text-xs text-slate-400 font-medium">We'll send you a reset link</p>
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
              Email Address
            </label>
            <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-100/10 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all duration-150">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <i className="far fa-envelope text-xs" />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-9 pr-4 py-2.5 bg-transparent focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-300"
              />
            </div>
            <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
              Enter the email associated with your account and we'll send a link to reset your password.
            </p>
          </div>
        </div>

        <div className="pt-6 space-y-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all active:scale-[0.995] disabled:opacity-50"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p className="text-center text-xs text-slate-400 font-medium pt-1">
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="text-violet-600 font-bold hover:underline"
            >
              Log In
            </button>
          </p>
        </div>
      </form>
    </section>
  );
}