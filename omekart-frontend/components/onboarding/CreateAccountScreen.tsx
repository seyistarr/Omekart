'use client';

import { useState } from 'react';
import { useOnboarding } from './OnboardingProvider';
import CountryCodeModal from './CountryCodeModal';
import { createClient } from '@/lib/supabase/client';

export default function CreateAccountScreen() {
  const { navigateTo, signup, setSignup, setUserId } = useOnboarding();
  const [countryModalOpen, setCountryModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [matchError, setMatchError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordsMismatch =
    signup.confirmPassword.length > 0 && signup.password !== signup.confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (signup.password !== signup.confirmPassword) {
      setMatchError(true);
      return;
    }
    setMatchError(false);
    setIsSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: signup.email,
      password: signup.password,
      options: {
        data: {
          full_name: signup.fullName,
          phone: `${signup.countryCode}${signup.phoneBody.replace(/\s/g, '')}`,
        },
      },
    });

    if (error) {
      alert(error.message);
      setIsSubmitting(false);
      return;
    }

    // Store user ID in context for later steps
    if (data.user) {
      setUserId(data.user.id);
    }

    // Navigate to hubs
    navigateTo('hubs');
    setIsSubmitting(false);
  }

  return (
    <section className="flex flex-col flex-1 py-1 duration-300">
      <div className="flex items-center space-x-3 mb-5">
        <button
          onClick={() => navigateTo('welcome')}
          className="w-8 h-8 rounded-lg border border-slate-200/70 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
        >
          <i className="fas fa-chevron-left text-[10px]" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-slate-950 tracking-tight">Create your account</h2>
          <p className="text-xs text-slate-400 font-medium">Join the OmeKart marketplace network</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-100/10 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all duration-150">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <i className="far fa-user text-xs" />
              </span>
              <input
                type="text"
                required
                value={signup.fullName}
                onChange={(e) => setSignup({ fullName: e.target.value })}
                placeholder="John Doe"
                className="w-full pl-9 pr-4 py-2 bg-transparent focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="grid grid-cols-12 rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-100/10 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all duration-150 overflow-hidden">
              <button
                type="button"
                onClick={() => setCountryModalOpen(true)}
                className="col-span-4 border-r border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between px-3 text-sm font-medium text-slate-700 h-full min-h-[38px]"
              >
                <span>{signup.countryFlag}</span>
                <span className="tracking-wide ml-1">{signup.countryCode}</span>
                <i className="fas fa-chevron-down text-[8px] text-slate-400 ml-1" />
              </button>
              <div className="col-span-8 relative">
                <input
                  type="tel"
                  required
                  value={signup.phoneBody}
                  onChange={(e) => setSignup({ phoneBody: e.target.value })}
                  placeholder="(555) 000-0000"
                  className="w-full pl-4 pr-4 py-2 bg-transparent focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-300 tracking-wide"
                />
              </div>
            </div>
          </div>

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
                value={signup.email}
                onChange={(e) => setSignup({ email: e.target.value })}
                placeholder="you@company.com"
                className="w-full pl-9 pr-4 py-2 bg-transparent focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-100/10 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all duration-150">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <i className="fas fa-lock text-[10px]" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={signup.password}
                onChange={(e) => setSignup({ password: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-transparent focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-300"
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

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Confirm Password
            </label>
            <div className="relative rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-100/10 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-500/10 transition-all duration-150">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 pointer-events-none">
                <i className="fas fa-lock text-[10px]" />
              </span>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={signup.confirmPassword}
                onChange={(e) => setSignup({ confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 bg-transparent focus:outline-none text-sm font-medium text-slate-800 placeholder-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((s) => !s)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className={`far ${showConfirm ? 'fa-eye-slash' : 'fa-eye'} text-xs`} />
              </button>
            </div>
            {(matchError || passwordsMismatch) && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match.</p>
            )}
          </div>

          <div className="flex items-start space-x-2 pt-0.5">
            <input
              type="checkbox"
              required
              checked={signup.agreedToTerms}
              onChange={(e) => setSignup({ agreedToTerms: e.target.checked })}
              className="mt-0.5 accent-violet-600 rounded border-slate-300 w-3.5 h-3.5"
            />
            <label className="text-[11px] text-slate-400 leading-normal select-none font-medium">
              I agree to the{' '}
              <a href="/terms" className="text-[#15056E] font-bold hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/policy" className="text-[#15056E] font-bold hover:underline">
                Privacy Policy
              </a>
              .
            </label>
          </div>
        </div>

        <div className="space-y-2.5 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-all active:scale-[0.995] disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </button>
          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <span className="relative px-3 text-[9px] font-bold bg-white text-slate-300 uppercase tracking-widest">
              Or sign up with
            </span>
          </div>
          <button
            type="button"
            onClick={() => alert('Redirecting to secure Google verification gateway...')}
            className="w-full bg-white border border-slate-200 hover:border-slate-300 py-2 rounded-xl transition-all flex items-center justify-center space-x-2 font-semibold text-slate-600 text-sm active:scale-[0.995]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-8.77z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 4.93 12c0-.79.13-1.57.39-2.31V6.54H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.46l4.11-3.22z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 6.54l4.11 3.22c.94-2.85 3.57-4.96 6.68-4.96z" />
            </svg>
            <span>Google</span>
          </button>
          <p className="text-center text-xs text-slate-400 font-medium pt-1">
            Already have an account?{' '}
            <button type="button" onClick={() => navigateTo('login')} className="text-violet-600 font-bold hover:underline">
              Sign In
            </button>
          </p>
        </div>
      </form>

      <CountryCodeModal
        open={countryModalOpen}
        onClose={() => setCountryModalOpen(false)}
        onSelect={(country) => {
          setSignup({ countryCode: country.dialString, countryFlag: country.flagIcon });
          setCountryModalOpen(false);
        }}
      />
    </section>
  );
}