'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from './OnboardingProvider';
import { createClient } from '@/lib/supabase/client';

export default function LoadingScreen() {
  const router = useRouter();
  const { signup, address, avatarUrl, userId } = useOnboarding();
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    const finaliseOnboarding = async () => {
      if (!userId) {
        console.warn('No user ID available for finalisation.');
        setSaving(false);
        return;
      }

      const supabase = createClient();
      const phone = `${signup.countryCode}${signup.phoneBody.replace(/\s/g, '')}`;
      const defaultAddress = address.street ? `${address.street}, ${address.city}` : null;

      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: userId,
          display_name: signup.fullName,
          phone: phone,
          avatar_url: avatarUrl,
          default_address: defaultAddress,
          default_lat: address.lat,
          default_lng: address.lng,
          onboarding_completed: true,
        }, {
          onConflict: 'user_id',
        })

      if (error) {
        console.error('Failed to save profile:', error);
        // Continue to dashboard anyway
      }

      setSaving(false);
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/buyer');
      }, 800);
    };

    finaliseOnboarding();
  }, [userId, signup, address, avatarUrl, router]);

  return (
    <section className="flex flex-col flex-1 py-1 justify-center items-center text-center">
      <div className="my-auto">
        <div className="relative w-16 h-16 mb-6 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
          <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {saving ? 'Saving Your Profile...' : 'Building Your Feed'}
        </h2>
        <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto">
          {saving
            ? 'We are finalising your account setup.'
            : 'Configuring targeted market items and dynamic content modules near your coordinates.'}
        </p>
      </div>
    </section>
  );
}
