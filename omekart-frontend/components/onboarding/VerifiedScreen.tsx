'use client';

import { useEffect, useState } from 'react';
import { useOnboarding } from './OnboardingProvider';
import { createClient } from '@/lib/supabase/client';

export default function VerifiedScreen() {
  const { navigateTo, userId } = useOnboarding();
  const [omekartId, setOmekartId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const fetchOmekartId = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('omekart_ids')
        .select('omekart_id')
        .eq('user_id', userId)
        .single();
      if (error) {
        console.error('Failed to fetch Omekart ID:', error);
        return;
      }
      setOmekartId(data?.omekart_id || null);
    };
    fetchOmekartId();
  }, [userId]);

  return (
    <section className="flex flex-col flex-1 py-1 justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateTo('profile')}
            className="w-9 h-9 rounded-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-chevron-left text-sm" />
          </button>
          <div className="flex space-x-1">
            <span className="w-2 h-1.5 rounded-full bg-violet-600/40" />
            <span className="w-2 h-1.5 rounded-full bg-violet-600/40" />
            <span className="w-5 h-1.5 rounded-full bg-violet-600" />
            <span className="w-2 h-1.5 rounded-full bg-slate-200" />
          </div>
        </div>
        <div className="flex flex-col items-center text-center px-2 my-6">
          <div className="w-24 h-24 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mb-6 border border-violet-100/50">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-7.618 3.03A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Identity Verified</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xs">
            Your system authorization profile has been verified and registered securely within our infrastructure.
          </p>
          {omekartId && (
            <div className="mt-3 px-4 py-2 bg-violet-50 rounded-xl border border-violet-100">
              <span className="text-xs text-slate-500">Your OmeKart ID</span>
              <p className="text-sm font-mono font-bold text-violet-700">{omekartId}</p>
            </div>
          )}
        </div>
        <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-4 space-y-3 mt-6">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-400 uppercase tracking-wider">Status Protocol</span>
            <span className="bg-violet-100 text-violet-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
              ACTIVE
            </span>
          </div>
          <div className="h-px bg-slate-200/50" />
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-400 uppercase tracking-wider">System Validation Node</span>
            <span className="text-slate-700 font-mono font-semibold">SECURE_AUTH_200</span>
          </div>
        </div>
      </div>
      <button
        onClick={() => navigateTo('location-services')}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl transition-all shadow-md shadow-violet-600/10"
      >
        Continue
      </button>
    </section>
  );
}