import { OnboardingGuard } from '@/components/shared/OnboardingGuard'
import RegisterServiceWorker from './RegisterServiceWorker'
import './globals.css'

export const metadata = {
  metadataBase: new URL('https://omekart-frontend-seyistarrs-projects.vercel.app'),
  title: 'Omekart',
  description: 'Omekart marketplace - a fast mobile-first experience for buyers and sellers.',
  icons: [
    { rel: 'icon', url: '/onboarding/logo.jpg', type: 'image/jpeg' },
    { rel: 'apple-touch-icon', url: '/onboarding/logo.jpg', sizes: '192x192' },
  ],
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Omekart',
    description: 'Omekart marketplace - a fast mobile-first experience for buyers and sellers.',
    type: 'website',
    images: ['/onboarding/logo.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Omekart',
    description: 'Omekart marketplace - a fast mobile-first experience for buyers and sellers.',
    images: ['/onboarding/logo.jpg'],
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'mobile-web-app-capable': 'yes',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: 'no',
}

export const themeColor = '#7c3aed'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <RegisterServiceWorker />
        <OnboardingGuard>{children}</OnboardingGuard>
      </body>
    </html>
  )
}
