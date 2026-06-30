'use client'

import { useEffect } from 'react'

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const cleanup = async () => {
      const registrations =
        'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistrations() : []

      await Promise.all(registrations.map((registration) => registration.unregister()))

      let cacheCount = 0
      if ('caches' in window) {
        const keys = await caches.keys()
        cacheCount = keys.length
        await Promise.all(keys.map((key) => caches.delete(key)))
      }

      if ((registrations.length > 0 || cacheCount > 0) && !sessionStorage.getItem('omekart_cache_cleaned')) {
        sessionStorage.setItem('omekart_cache_cleaned', 'true')
        window.location.reload()
      }
    }

    cleanup().catch(console.error)
  }, [])

  return null
}
