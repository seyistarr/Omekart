import { OnboardingGuard } from '@/components/shared/OnboardingGuard'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <OnboardingGuard>
          {children}
        </OnboardingGuard>
      </body>
    </html>
  )
}