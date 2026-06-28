'use client';

import 'leaflet/dist/leaflet.css';
import { OnboardingProvider, useOnboarding } from '@/components/onboarding/OnboardingProvider';
import SplashScreen from '@/components/onboarding/SplashScreen';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import CreateAccountScreen from '@/components/onboarding/CreateAccountScreen';
import LoginScreen from '@/components/onboarding/LoginScreen';
import HubsScreen from '@/components/onboarding/HubsScreen';
import ProfileScreen from '@/components/onboarding/ProfileScreen';
import VerifiedScreen from '@/components/onboarding/VerifiedScreen';
import LocationServicesScreen from '@/components/onboarding/LocationServicesScreen';
import LocationDetectionScreen from '@/components/onboarding/LocationDetectionScreen';
import DeliveryAddressScreen from '@/components/onboarding/DeliveryAddressScreen';
import LoadingScreen from '@/components/onboarding/LoadingScreen';

function ActiveScreen() {
  const { step } = useOnboarding();

  switch (step) {
    case 'splash': return <SplashScreen />;
    case 'welcome': return <WelcomeScreen />;
    case 'create-account': return <CreateAccountScreen />;
    case 'login': return <LoginScreen />;
    case 'hubs': return <HubsScreen />;
    case 'profile': return <ProfileScreen />;
    case 'verified': return <VerifiedScreen />;
    case 'location-services': return <LocationServicesScreen />;
    case 'location-detection': return <LocationDetectionScreen />;
    case 'delivery-address': return <DeliveryAddressScreen />;
    case 'loading': return <LoadingScreen />;
    default: return <SplashScreen />;
  }
}

function OnboardingShell() {
  const { isLeaving } = useOnboarding();

  return (
    <main
      className={`
        w-full max-w-md min-h-screen h-screen bg-white 
        flex flex-col p-4 sm:p-6 
        relative justify-between 
        overflow-y-auto shadow-xl border-x border-slate-100
        transition-all duration-200
        ${isLeaving ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}
      `}
    >
      <ActiveScreen />
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center antialiased overflow-x-hidden">
      <OnboardingProvider>
        <OnboardingShell />
      </OnboardingProvider>
    </div>
  );
}