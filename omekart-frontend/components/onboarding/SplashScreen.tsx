'use client';

import { useEffect } from 'react';
import { useOnboarding } from './OnboardingProvider';

const FLOAT_ICON_PATHS = [
  "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125a1.125 1.125 0 0 0 1.125-1.125V9.75M3.375 14.25h1.625M19.5 14.25h1.625m-16.5 0v-4.5A2.25 2.25 0 0 1 6.75 7.5h9.75a2.25 2.25 0 0 1 2.25 2.25v4.5m-16.5 0h16.5m-5.25-6.75V3.375c0-.621-.504-1.125-1.125-1.125h-3c-.621 0-1.125 0-1.125 1.125v3.375",
  "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5z",
  "M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.5a.75.75 0 0 0 .75-.75V14a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75v3.25c0 .414.336.75.75.75z",
  "M2.25 12c0-1.1.9-2 2-2h15.5c1.1 0 2 .9 2 2v1c0 .55-.45 1-1 1H3.25c-.55 0-1-.45-1-1v-1zM3.5 10c0-3.3 2.7-6 6-6h5c3.3 0 6 2.7 6 6M2.5 16h19M4.5 16c0 2.2 1.8 4 4 4h7c2.2 0 4-1.8 4-4",
  "M8.25 21h7.5M6 17.25a3.375 3.375 0 014.28-3.235A3.75 3.75 0 0118 15.75M6 17.25a3.375 3.375 0 003.375 3.375h5.25A3.375 3.375 0 0018 17.25m-12 0h12",
  "M11.42 15.17L17.25 21A1.5 1.5 0 0019.5 21l1.5-1.5a1.5 1.5 0 000-2.12l-5.83-5.83m-3.75 3.75a3.75 3.75 0 11-5.3-5.3 3.75 3.75 0 015.3 5.3zm0 0l6.16-6.16m-6.16 6.16l-6.16-6.16M15 3h6v6",
  "M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941",
  "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 15h9M9 18h6",
  "M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0z",
  "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0 0a8.987 8.987 0 0 1-5.251-1.682m5.251 1.682a8.987 8.987 0 0 0 5.251-1.682m-5.251 1.682V12m0 0h5.251m-5.251 0H6.749m0 0a8.985 8.985 0 0 1 3.562-6.915M6.749 12a8.986 8.986 0 0 0 3.562 6.915M20.25 12a8.986 8.986 0 0 1-3.562 6.915M20.25 12a8.985 8.985 0 0 0-3.562-6.915M10.311 5.085a4.5 4.5 0 0 1 3.378 0m-3.378 13.83a4.5 4.5 0 0 0 3.378 0",
];

const FLOAT_POSITIONS = [
  "top-[8%] left-[10%] -rotate-12 animate-float-slow",
  "top-[9%] right-[12%] rotate-12 animate-float-delayed",
  "top-[26%] left-[6%] rotate-45 animate-float-fast",
  "top-[24%] right-[7%] -rotate-[15deg] animate-float-slow",
  "top-[48%] left-[7%] -rotate-12 animate-float-delayed",
  "top-[50%] right-[6%] rotate-12 animate-float-fast",
  "bottom-[28%] left-[8%] rotate-[15deg] animate-float-slow",
  "bottom-[30%] right-[8%] -rotate-12 animate-float-delayed",
  "bottom-[10%] left-[12%] rotate-12 animate-float-fast",
  "bottom-[9%] right-[14%] -rotate-45 animate-float-slow",
];

export default function SplashScreen() {
  const { navigateTo } = useOnboarding();

  useEffect(() => {
    const t = setTimeout(() => navigateTo('welcome'), 2600);
    return () => clearTimeout(t);
  }, [navigateTo]);

  return (
    <section className="flex flex-col items-center justify-between flex-1 py-16 relative overflow-hidden select-none">
      <div className="absolute inset-0 pointer-events-none w-full h-full z-0">
        {FLOAT_ICON_PATHS.map((d, i) => (
          <svg
            key={i}
            className={`absolute w-10 h-10 text-violet-600/10 ${FLOAT_POSITIONS[i]}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={d} />
          </svg>
        ))}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        <div className="w-56 h-56 md:w-64 md:h-64 mb-4 flex items-center justify-center">
          <img
            src="/onboarding/logo.jpg"
            alt="OmeKart Logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1472851294608-062f824d286b?auto=format&fit=crop&q=80&w=200';
            }}
          />
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-[#15056E] via-[#6A11FF] to-[#9C27FF] bg-clip-text text-transparent">
          OmeKart
        </h1>
        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-2 uppercase">
          Products · Foods · Services
        </p>
      </div>

      <div className="w-full flex flex-col items-center space-y-2 relative z-10">
        <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </section>
  );
}