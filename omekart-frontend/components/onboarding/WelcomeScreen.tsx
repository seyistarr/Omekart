'use client';

import { useOnboarding } from './OnboardingProvider';

const VERTICALS = [
  {
    tag: 'Marketplace',
    title: 'Shop Products',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
  },
  {
    tag: 'Fresh & Hot',
    title: 'Order Foods',
    img: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=400',
  },
  {
    tag: 'On Demand',
    title: 'Book Services',
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
  },
];

export default function WelcomeScreen() {
  const { navigateTo } = useOnboarding();

  return (
    <section className="flex flex-col justify-between flex-1 py-2">
      <div className="mt-4">
        <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
          Everything you need,
          <br />
          delivered fast.
        </h1>
        <p className="text-slate-500 text-sm mt-2.5 font-medium leading-relaxed">
          Explore standard products, restaurant meals, and local professional services in one
          unified checkout window.
        </p>
      </div>

      <div className="space-y-3 my-6">
        {VERTICALS.map((v) => (
          <div
            key={v.title}
            className="relative w-full h-24 rounded-xl overflow-hidden group border border-slate-100 bg-slate-900 flex items-end p-4"
          >
            <img src={v.img} alt={v.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            <div className="relative z-10 flex justify-between items-center w-full">
              <div>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">{v.tag}</span>
                <h3 className="text-base font-bold text-white tracking-wide">{v.title}</h3>
              </div>
              <span className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-xs">
                <i className="fas fa-arrow-right" />
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full space-y-2">
        <button
          onClick={() => navigateTo('create-account')}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3 rounded-xl transition-all shadow-sm active:scale-[0.995]"
        >
          Get Started
        </button>
        <button
          onClick={() => navigateTo('login')}
          className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-all active:scale-[0.995] hover:bg-slate-50"
        >
          Sign In
        </button>
      </div>
    </section>
  );
}