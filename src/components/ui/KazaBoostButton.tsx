'use client'

import { useState } from 'react'
import { Zap, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'
import { KZ, KAZA_BOOST_COST_XP, KAZA_BOOST_HOURS } from '@/lib/constants'

interface KazaBoostButtonProps {
  profileId: string
  xp: number
  boostedUntil?: string | null
  onBoost?: () => void | Promise<void>
}

export function KazaBoostButton({ profileId, xp, boostedUntil, onBoost }: KazaBoostButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const supabase = createClient()

  const isActive = !!boostedUntil && new Date(boostedUntil) > new Date()
  const canBoost = xp >= KAZA_BOOST_COST_XP && !isActive

  const handleBoost = async () => {
    if (!canBoost) return
    setLoading(true)
    setError('')

    const expiry = new Date()
    expiry.setHours(expiry.getHours() + KAZA_BOOST_HOURS)

    const { error: err } = await supabase
      .from('profiles')
      .update({ boosted_until: expiry.toISOString(), xp: xp - KAZA_BOOST_COST_XP })
      .eq('id', profileId)

    if (err) setError('Erreur lors du boost. Réessayez.')
    else await onBoost?.()
    setLoading(false)
  }

  if (isActive) {
    const until = new Date(boostedUntil!).toLocaleString('fr-FR', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    })
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-xl border border-[#1A1410]"
        style={{ background: KZ.yellowSoft }}
      >
        <Zap size={18} color={KZ.yellow} fill={KZ.yellow} className="shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-bold text-[#1A1410]">⚡ Profil boosté !</div>
          <div className="flex items-center gap-1 text-[11px] text-[#6B5A4A] mt-0.5">
            <Clock size={10} />
            <span>Prioritaire jusqu&apos;au {until}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        kind="outline"
        size="sm"
        full
        icon={<Zap size={14} color={KZ.yellow} fill={canBoost ? KZ.yellow : 'none'} />}
        onClick={handleBoost}
        loading={loading}
        disabled={!canBoost}
      >
        KazaBoost · {KAZA_BOOST_COST_XP} XP · {KAZA_BOOST_HOURS}h
      </Button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      {xp < KAZA_BOOST_COST_XP && !isActive && (
        <p className="text-[11px] text-[#6B5A4A] text-center">
          Il vous faut encore{' '}
          <span className="font-bold" style={{ color: KZ.orange }}>{KAZA_BOOST_COST_XP - xp} XP</span>
          {' '}pour booster votre profil
        </p>
      )}
    </div>
  )
}
