'use client';

import { useOnboarding } from './OnboardingProvider';
import { HUB_MATRIX_DATA } from '@/lib/onboarding/onboardingData';

export default function HubsScreen() {
  const { navigateTo, selectedHubs, toggleHub } = useOnboarding();

  function handleContinue() {
    if (selectedHubs.size < 3) {
      alert('Validation Constraint: Please select at least 3 categories to tailor your workspace environment.');
      return;
    }
    // Persist selection (swap for a Supabase user_preferences upsert when wired up)
    try {
      localStorage.setItem('omekart_isolated_b_hubs', JSON.stringify(Array.from(selectedHubs)));
    } catch {
      /* no-op */
    }
    navigateTo('profile');
  }

  return (
    <section className="flex flex-col flex-1 py-1 justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => alert('Bridge Pipeline: Navigation link backward directed toward [Part A] Core Layout UI Trigger.')}
            className="w-9 h-9 rounded-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-arrow-left text-sm" />
          </button>
          <div className="flex space-x-1">
            <span className="w-5 h-1.5 rounded-full bg-violet-600" />
            <span className="w-2 h-1.5 rounded-full bg-slate-200" />
            <span className="w-2 h-1.5 rounded-full bg-slate-200" />
            <span className="w-2 h-1.5 rounded-full bg-slate-200" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Personalize Your Hubs</h2>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          Select 3 or more categories to configure your personal dynamic workspace.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {HUB_MATRIX_DATA.map((item) => {
            const selected = selectedHubs.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleHub(item.id)}
                className={`category-card group relative h-28 rounded-xl overflow-hidden cursor-pointer bg-slate-900 shadow-sm border select-none transition-all duration-200 ${
                  selected ? 'border-violet-500 ring-2 ring-violet-500/40' : 'border-slate-100'
                }`}
              >
                <img
                  src={item.img}
                  alt={item.name}
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
                {selected && (
                  <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] flex items-center justify-center shadow-md z-10">
                    <i className="fas fa-check" />
                  </span>
                )}
                <div className="absolute bottom-2 left-2.5 right-2.5 z-10">
                  <span className="text-xs font-bold text-white tracking-wide leading-tight drop-shadow-sm">
                    {item.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-50 mt-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Choice Counter</span>
          <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
            <span className="text-violet-600">{selectedHubs.size}</span> Selected
          </span>
        </div>
        <button
          onClick={handleContinue}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-violet-600/10 transition-all transform active:scale-[0.99]"
        >
          Continue
        </button>
      </div>
    </section>
  );
}