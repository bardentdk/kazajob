'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Suivi de pages vues anonyme (path + horodatage, sans IP ni cookie → RGPD OK).
 * N'enregistre pas la navigation admin (pour ne pas polluer les stats).
 */
export function PageViewTracker() {
  const pathname = usePathname()
  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return
    try {
      const body = JSON.stringify({ path: pathname })
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }))
      } else {
        fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true })
      }
    } catch { /* noop */ }
  }, [pathname])
  return null
}
