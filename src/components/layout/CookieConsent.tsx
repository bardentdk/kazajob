'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'

const KEY = 'kazajob_cookie_consent'

/**
 * Bandeau de consentement cookies.
 * Kazajob n'utilise que des cookies essentiels (session) — pas de traçage tiers.
 * Le choix est mémorisé localement ; aucun script non essentiel n'est chargé.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try { if (!localStorage.getItem(KEY)) setShow(true) } catch { /* SSR / storage off */ }
  }, [])

  const choose = (v: 'accepted' | 'refused') => {
    try { localStorage.setItem(KEY, v) } catch { /* noop */ }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-3 sm:p-4" role="dialog" aria-label="Consentement cookies">
      <div
        className="max-w-[760px] mx-auto rounded-2xl border border-[#1A1410] bg-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ boxShadow: '4px 4px 0 #1A1410' }}
      >
        <div className="flex items-start gap-3 flex-1">
          <div className="w-9 h-9 rounded-xl border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: KZ.yellowSoft }}>
            <Cookie size={16} className="text-[#1A1410]" />
          </div>
          <p className="text-xs sm:text-sm text-[#2A2018] leading-relaxed">
            Kazajob utilise uniquement des <strong>cookies essentiels</strong> au fonctionnement (session de connexion).
            Aucun traçage publicitaire ni revente de données.{' '}
            <Link href="/legal/cookies" className="font-bold underline" style={{ color: KZ.violet }}>En savoir plus</Link>.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button kind="outline" size="md" onClick={() => choose('refused')}>Refuser</Button>
          <Button kind="primary" size="md" onClick={() => choose('accepted')}>Accepter</Button>
        </div>
      </div>
    </div>
  )
}
