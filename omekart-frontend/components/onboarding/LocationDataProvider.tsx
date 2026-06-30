'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Country {
  id: string;
  name: string;
  iso_code: string;
  currency_code: string | null;
  phone_code: string | null;
}

export interface AdministrativeRegion {
  id: string;
  name: string;
  country_id: string;
}

export interface City {
  id: string;
  name: string;
  region_id: string;
}

interface LocationDataContextValue {
  countries: Country[];
  countriesLoading: boolean;
  countriesError: string | null;
  refreshCountries: () => Promise<void>;
}

const LocationDataContext = createContext<LocationDataContextValue | null>(null);

export function normalizePhoneCode(phoneCode: string | null | undefined) {
  if (!phoneCode) return '';
  const trimmed = phoneCode.trim();
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export function countryFlagFromIso(isoCode: string | null | undefined) {
  if (!isoCode || isoCode.length !== 2) return '';
  return isoCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export function LocationDataProvider({ children }: { children: ReactNode }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const [countriesError, setCountriesError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const refreshCountries = useCallback(async () => {
    setCountriesLoading(true);
    setCountriesError(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const { data, error } = await supabase
        .from('countries')
        .select('id,name,iso_code,currency_code,phone_code')
        .eq('is_active', true)
        .order('name')
        .abortSignal(controller.signal);

      if (error) {
        setCountries([]);
        setCountriesError(error.message);
      } else {
        setCountries(data ?? []);
      }
    } catch (error) {
      setCountries([]);
      setCountriesError(error instanceof Error ? error.message : 'Unable to load countries from Supabase.');
    } finally {
      clearTimeout(timeout);
      setCountriesLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    refreshCountries();
  }, [refreshCountries]);

  const value = useMemo(
    () => ({ countries, countriesLoading, countriesError, refreshCountries }),
    [countries, countriesLoading, countriesError, refreshCountries]
  );

  return <LocationDataContext.Provider value={value}>{children}</LocationDataContext.Provider>;
}

export function useCountries() {
  const context = useContext(LocationDataContext);
  if (!context) throw new Error('useCountries must be used within a LocationDataProvider');
  return context;
}

export function useAdministrativeRegions(countryId: string) {
  const [regions, setRegions] = useState<AdministrativeRegion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    const fetchRegions = async () => {
      if (!countryId) {
        setRegions([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('administrative_regions')
        .select('id,name,country_id')
        .eq('country_id', countryId)
        .eq('is_active', true)
        .order('name');

      if (!active) return;

      if (error) {
        setRegions([]);
        setError(error.message);
      } else {
        setRegions(data ?? []);
      }

      setLoading(false);
    };

    fetchRegions();

    return () => {
      active = false;
    };
  }, [countryId, supabase]);

  return { regions, loading, error };
}

export function useCities(regionId: string) {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let active = true;

    const fetchCities = async () => {
      if (!regionId) {
        setCities([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('cities')
        .select('id,name,region_id')
        .eq('region_id', regionId)
        .eq('is_active', true)
        .order('name');

      if (!active) return;

      if (error) {
        setCities([]);
        setError(error.message);
      } else {
        setCities(data ?? []);
      }

      setLoading(false);
    };

    fetchCities();

    return () => {
      active = false;
    };
  }, [regionId, supabase]);

  return { cities, loading, error };
}
