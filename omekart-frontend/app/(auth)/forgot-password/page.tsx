// app/(auth)/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password reset logic (Supabase auth resetPasswordForEmail)
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Check your email</h1>
          <p className="text-sm text-slate-500 mb-4">
            We sent a password reset link to <strong>{email}</strong>.
          </p>
          <Link href="/login" className="text-violet-600 font-semibold hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Reset Password</h1>
        <p className="text-sm text-slate-500 mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl shadow-sm transition-all"
          >
            Send Reset Link
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-violet-600 font-medium hover:underline">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}