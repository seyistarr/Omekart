'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, CircleMarker } from 'leaflet';
import { useOnboarding } from './OnboardingProvider';
import { useAdministrativeRegions, useCities, useCountries } from './LocationDataProvider';
import { DEFAULT_LAT_LNG } from '@/lib/onboarding/onboardingData';
import 'leaflet/dist/leaflet.css';

interface PhotonFeature {
  properties: {
    name?: string;
    street?: string;
    city?: string;
    state?: string;
  };
  geometry: { coordinates: [number, number] }; // [lon, lat]
}

export default function DeliveryAddressScreen() {
  const { navigateTo, address, setAddress } = useOnboarding();
  const { countries, countriesLoading, countriesError } = useCountries();
  const { regions, loading: regionsLoading, error: regionsError } = useAdministrativeRegions(address.countryId);
  const { cities, loading: citiesLoading, error: citiesError } = useCities(address.regionId);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<CircleMarker | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [streetInput, setStreetInput] = useState(address.street);
  const [cityInput, setCityInput] = useState(address.city);
  const [suggestions, setSuggestions] = useState<PhotonFeature[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!address.countryId && countries.length === 1) {
      const [country] = countries;
      setAddress({ countryId: country.id, country: country.name });
    }
  }, [address.countryId, countries, setAddress]);

  // Initialize Leaflet on mount (client-only)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const startLatLng: [number, number] =
        address.lat != null && address.lng != null ? [address.lat, address.lng] : DEFAULT_LAT_LNG;

      const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(
        startLatLng,
        13
      );
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(
        map
      );
      const marker = L.circleMarker(startLatLng, {
        radius: 8,
        fillColor: '#8b5cf6',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      }).addTo(map);

      mapRef.current = map;
      markerRef.current = marker;
      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function fetchSuggestions(query: string) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 3) {
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
        );
        const payload = await res.json();
        setSuggestions(payload.features || []);
        setShowSuggestions((payload.features || []).length > 0);
      } catch {
        setShowSuggestions(false);
      }
    }, 250);
  }

  function selectSuggestion(feature: PhotonFeature) {
    const props = feature.properties;
    const label = [props.name, props.street, props.city || props.state].filter(Boolean).join(', ');
    const city = props.city || props.state || '';
    const [lon, lat] = feature.geometry.coordinates;

    setStreetInput(label);
    setCityInput(city);
    setShowSuggestions(false);

    if (mapRef.current && markerRef.current) {
      mapRef.current.setView([lat, lon], 16);
      markerRef.current.setLatLng([lat, lon]);
    }
    setAddress({ street: label, city, lat, lng: lon });
  }

  function focusMap() {
    if (mapRef.current && markerRef.current) {
      mapRef.current.invalidateSize();
      mapRef.current.panTo(markerRef.current.getLatLng());
    }
  }

  function handleVerify() {
    if (!address.countryId || !streetInput.trim() || !cityInput.trim()) {
      alert('Validation Constraint: Please input your address configuration details.');
      return;
    }
    setAddress({ street: streetInput.trim(), city: cityInput.trim() });
    navigateTo('loading');
  }

  return (
    <section className="flex flex-col flex-1 py-1 justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateTo('location-services')}
            className="w-9 h-9 rounded-xl border border-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <i className="fas fa-arrow-left text-sm" />
          </button>
          <div className="flex space-x-1">
            <span className="w-5 h-1.5 rounded-full bg-violet-600" />
            <span className="w-2 h-1.5 rounded-full bg-slate-200" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery Address</h2>
        <p className="text-sm text-slate-500 mt-1 mb-4">Find your delivery address and see it on the map.</p>

        <div className="space-y-3 relative z-50">
          <div className="relative">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Street Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <i className="fas fa-search text-xs" />
              </span>
              <input
                type="text"
                value={streetInput}
                onChange={(e) => {
                  setStreetInput(e.target.value);
                  fetchSuggestions(e.target.value);
                }}
                placeholder="Start typing address..."
                autoComplete="off"
                className="w-full pl-9 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-800 font-medium"
              />
              <button
                type="button"
                onClick={focusMap}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-violet-600 transition-colors"
              >
                <i className="fas fa-map-marked-alt text-sm" />
              </button>
            </div>
            {showSuggestions && (
              <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-50">
                {suggestions.map((feature, i) => {
                  const props = feature.properties;
                  const label = [props.name, props.street, props.city || props.state].filter(Boolean).join(', ');
                  return (
                    <div
                      key={i}
                      onClick={() => selectSuggestion(feature)}
                      className="px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 truncate"
                    >
                      <i className="fas fa-map-pin text-slate-400 mr-2" />
                      {label}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Country
            </label>
            <select
              value={address.countryId}
              disabled={countriesLoading}
              onChange={(e) => {
                const country = countries.find((item) => item.id === e.target.value);
                setAddress({
                  countryId: country?.id ?? '',
                  country: country?.name ?? '',
                  regionId: '',
                  region: '',
                  cityId: '',
                  city: '',
                });
                setCityInput('');
              }}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-800 font-medium disabled:opacity-60"
            >
              <option value="">{countriesLoading ? 'Loading countries...' : 'Select country'}</option>
              {countries.map((country) => (
                <option key={country.id} value={country.id}>
                  {country.name}
                </option>
              ))}
            </select>
            {countriesError && <p className="text-xs text-red-500 mt-1">{countriesError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                State / Region
              </label>
              <select
                value={address.regionId}
                disabled={!address.countryId || regionsLoading}
                onChange={(e) => {
                  const region = regions.find((item) => item.id === e.target.value);
                  setAddress({
                    regionId: region?.id ?? '',
                    region: region?.name ?? '',
                    cityId: '',
                    city: '',
                  });
                  setCityInput('');
                }}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-800 font-medium disabled:opacity-60"
              >
                <option value="">{regionsLoading ? 'Loading...' : 'Select region'}</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {regionsError && <p className="text-xs text-red-500 mt-1">{regionsError}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                City
              </label>
              {cities.length > 0 ? (
                <select
                  value={address.cityId}
                  disabled={!address.regionId || citiesLoading}
                  onChange={(e) => {
                    const city = cities.find((item) => item.id === e.target.value);
                    setAddress({ cityId: city?.id ?? '', city: city?.name ?? '' });
                    setCityInput(city?.name ?? '');
                  }}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-800 font-medium disabled:opacity-60"
                >
                  <option value="">{citiesLoading ? 'Loading...' : 'Select city'}</option>
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={cityInput}
                  onChange={(e) => {
                    setCityInput(e.target.value);
                    setAddress({ city: e.target.value, cityId: '' });
                  }}
                  placeholder={citiesLoading ? 'Loading...' : 'City'}
                  disabled={!address.countryId || citiesLoading}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-violet-500 focus:bg-white transition-all text-slate-800 font-medium disabled:opacity-60"
                />
              )}
              {citiesError && <p className="text-xs text-red-500 mt-1">{citiesError}</p>}
            </div>
          </div>
        </div>

        <div
          ref={mapContainerRef}
          className="w-full h-48 bg-slate-100 rounded-2xl mt-4 border border-slate-200/60 overflow-hidden relative z-10"
        />
      </div>
      <button
        onClick={handleVerify}
        className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-violet-600/10 transition-all mt-4"
      >
        Verify and Enter Feed
      </button>
    </section>
  );
}
