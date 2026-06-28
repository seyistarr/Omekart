
'use client';

import { useMemo, useState } from 'react';
import { COUNTRY_CODES, CountryCode } from '@/lib/onboarding/countryCodes';

interface CountryCodeModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (country: CountryCode) => void;
}

export default function CountryCodeModal({ open, onClose, onSelect }: CountryCodeModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) => c.commonName.toLowerCase().includes(q) || c.dialString.includes(q)
    );
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-end justify-center transition-opacity duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-t-2xl shadow-xl max-h-[80vh] flex flex-col transform transition-transform duration-200 ease-out translate-y-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-950 text-sm">Select Country Code</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors"
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>
        <div className="p-3 bg-slate-50 border-b border-slate-100">
          <div className="relative bg-white rounded-lg border border-slate-200/80 focus-within:border-violet-500 transition-all duration-150">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-300">
              <i className="fas fa-search text-xs" />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country name or code..."
              className="w-full pl-9 pr-4 py-2 bg-transparent text-xs focus:outline-none font-medium text-slate-700 placeholder-slate-300"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[50vh]">
          {filtered.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-300 font-medium">No countries found</div>
          ) : (
            filtered.map((country) => (
              <button
                key={country.dialString + country.commonName}
                type="button"
                onClick={() => onSelect(country)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 active:bg-slate-100 rounded-lg transition-colors text-left text-xs text-slate-700 font-medium group"
              >
                <div className="flex items-center space-x-3 truncate">
                  <span className="text-base leading-none">{country.flagIcon || '🏳️'}</span>
                  <span className="truncate font-semibold text-slate-800">{country.commonName}</span>
                </div>
                <span className="text-violet-600 font-bold tracking-wide">{country.dialString}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}