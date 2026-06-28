'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';

export type OnboardingStep =
  | 'splash'
  | 'welcome'
  | 'create-account'
  | 'login'
  | 'forgot-password'          // <-- ADDED
  | 'hubs'
  | 'profile'
  | 'verified'
  | 'location-services'
  | 'location-detection'
  | 'delivery-address'
  | 'loading';

export interface SignupFormState {
  fullName: string;
  countryCode: string;
  countryFlag: string;
  phoneBody: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreedToTerms: boolean;
}

export interface LoginFormState {
  emailOrPhone: string;
  password: string;
}

export interface AddressState {
  street: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
}

interface OnboardingState {
  step: OnboardingStep;
  signup: SignupFormState;
  login: LoginFormState;
  selectedHubs: Set<string>;
  avatarSrc: string | null;
  avatarUrl: string | null; // final URL after upload
  address: AddressState;
  userId: string | null;
}

interface OnboardingContextValue extends OnboardingState {
  navigateTo: (step: OnboardingStep) => void;
  isLeaving: boolean;
  setSignup: (patch: Partial<SignupFormState>) => void;
  setLogin: (patch: Partial<LoginFormState>) => void;
  toggleHub: (id: string) => void;
  setAvatarSrc: (src: string) => void;
  setAvatarUrl: (url: string) => void;
  setAddress: (patch: Partial<AddressState>) => void;
  setUserId: (id: string) => void;
}

const defaultSignup: SignupFormState = {
  fullName: '',
  countryCode: '+234',
  countryFlag: '🇳🇬',
  phoneBody: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreedToTerms: false,
};

const defaultLogin: LoginFormState = {
  emailOrPhone: '',
  password: '',
};

const defaultAddress: AddressState = {
  street: '',
  city: '',
  country: 'Nigeria',
  lat: null,
  lng: null,
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<OnboardingStep>('splash');
  const [isLeaving, setIsLeaving] = useState(false);
  const [signup, setSignupState] = useState<SignupFormState>(defaultSignup);
  const [login, setLoginState] = useState<LoginFormState>(defaultLogin);
  const [selectedHubs, setSelectedHubs] = useState<Set<string>>(new Set());
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [address, setAddressState] = useState<AddressState>(defaultAddress);
  const [userId, setUserId] = useState<string | null>(null);

  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigateTo = useCallback((next: OnboardingStep) => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setIsLeaving(true);
    transitionTimer.current = setTimeout(() => {
      setStep(next);
      setIsLeaving(false);
    }, 190);
  }, []);

  const setSignup = useCallback((patch: Partial<SignupFormState>) => {
    setSignupState((prev) => ({ ...prev, ...patch }));
  }, []);

  const setLogin = useCallback((patch: Partial<LoginFormState>) => {
    setLoginState((prev) => ({ ...prev, ...patch }));
  }, []);

  const toggleHub = useCallback((id: string) => {
    setSelectedHubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAddress = useCallback((patch: Partial<AddressState>) => {
    setAddressState((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      step,
      isLeaving,
      signup,
      login,
      selectedHubs,
      avatarSrc,
      avatarUrl,
      address,
      userId,
      navigateTo,
      setSignup,
      setLogin,
      toggleHub,
      setAvatarSrc,
      setAvatarUrl,
      setAddress,
      setUserId,
    }),
    [step, isLeaving, signup, login, selectedHubs, avatarSrc, avatarUrl, address, userId, navigateTo, setSignup, setLogin, toggleHub, setAvatarSrc, setAvatarUrl, setAddress, setUserId]
  );

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within an OnboardingProvider');
  return ctx;
}