'use client'

import { useEffect } from 'react'

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((registration) => {
        registration.unregister()
      })
    }).catch(console.error)
  }, [])

  return null
}
