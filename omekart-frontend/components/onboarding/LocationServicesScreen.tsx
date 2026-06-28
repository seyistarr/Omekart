'use client';

import { useOnboarding } from './OnboardingProvider';

export default function LocationServicesScreen() {
  const { navigateTo } = useOnboarding();

  return (
    <section className="flex flex-col flex-1 py-1 justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateTo('verified')}
            className="w-9 h-9 rounded-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-chevron-left text-sm" />
          </button>
          <div className="flex space-x-1">
            <span className="w-2 h-1.5 rounded-full bg-violet-600/40" />
            <span className="w-2 h-1.5 rounded-full bg-violet-600/40" />
            <span className="w-2 h-1.5 rounded-full bg-violet-600/40" />
            <span className="w-5 h-1.5 rounded-full bg-violet-600" />
          </div>
        </div>
        <div className="flex flex-col items-center text-center px-2 my-4">
          <div className="w-full bg-slate-50 rounded-2xl p-6 mb-6 border border-slate-100 flex justify-center items-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="relative flex flex-col items-center">
              <div className="w-14 h-14 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-violet-600/20 z-10 animate-pulse">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="absolute w-24 h-24 rounded-full border border-violet-500/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-75" />
              <div className="absolute w-36 h-36 rounded-full border border-violet-500/10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-90" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Enable Location Services</h2>
          <p className="text-sm text-slate-500 mt-2 max-w-xs">
            Synchronize your exact coordinates to automate order logistics routing configurations seamlessly.
          </p>
        </div>
      </div>
      <div className="space-y-3">
        <button
          onClick={() => navigateTo('location-detection')}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center space-x-2.5 transition-all shadow-md shadow-violet-600/10"
        >
          <i className="fas fa-location-arrow text-sm" /> <span>Share Current Location</span>
        </button>
        <button
          onClick={() => navigateTo('delivery-address')}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded-xl transition-colors text-center block"
        >
          Enter Address Manually
        </button>
      </div>
    </section>
  );
}