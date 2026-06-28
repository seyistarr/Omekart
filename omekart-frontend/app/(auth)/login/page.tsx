// app/(auth)/login/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the onboarding login screen if needed
    router.push('/onboarding');
  }, [router]);

  return null;
}