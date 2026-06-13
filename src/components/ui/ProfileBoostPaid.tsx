'use client'

import { useState } from 'react'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { KZ, PROFILE_BOOST_OPTIONS } from '@/lib/constants'

/**
 * Boost de profil PAYANT (Stripe one-shot), en complément du KazaBoost XP gratuit.
 * Met le profil en avant dans les recherches recruteurs pour la durée choisie.
 */
export function ProfileBoostPaid({ boostedUntil }: { boostedUntil?: string | null }) {
  const [open, setOpen] = useState(false)
  const [days, setDays] = useState(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isActive = !!boostedUntil && new Date(boostedUntil) > new Date()

  const handleBoost = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/billing/profile-boost-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) { window.location.href = data.url as string; return }
      setError(res.status === 503
        ? 'Le paiement est momentanément indisponible. Réessaie dans un instant.'
        : (data.error as string) || 'Impossible d\'ouvrir le paiement.')
    } catch {
      setError('Connexion au paiement impossible. Réessaie.')
    }
    setLoading(false)
  }

  return (
    <>
      <Button kind="primary" size="sm" full icon={<Rocket size={14} />} onClick={() => setOpen(true)}>
        Boost premium {isActive ? '· prolonger' : '· longue durée'}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Mettre mon profil en avant" size="md">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.orangeSoft }}>
            <Rocket size={18} color={KZ.orange} />
            <p className="text-sm font-semibold text-[#1A1410]">
              Remonte en priorité dans les recherches recruteurs + badge « Profil mis en avant ».
            </p>
          </div>

          {isActive && boostedUntil && (
            <p className="text-xs text-[#6B5A4A]">
              Déjà mis en avant jusqu&apos;au <strong className="text-[#1A1410]">{new Date(boostedUntil).toLocaleDateString('fr-FR')}</strong> — un achat prolonge la durée.
            </p>
          )}

          <div className="flex flex-col gap-2">
            {PROFILE_BOOST_OPTIONS.map((opt) => {
              const selected = days === opt.days
              return (
                <button key={opt.days} onClick={() => setDays(opt.days)}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                  style={{ borderColor: selected ? KZ.orange : KZ.line, background: selected ? KZ.orangeSoft : 'white' }}>
                  <div className="w-7 h-7 rounded-full border-2 border-[#1A1410] flex items-center justify-center shrink-0"
                    style={{ background: selected ? KZ.orange : 'white' }}>
                    {selected && <Rocket size={12} color="white" />}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-[#1A1410]">{opt.label}</span>
                    {opt.tag && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]" style={{ background: KZ.yellowSoft }}>{opt.tag}</span>}
                  </div>
                  <span className="text-lg font-extrabold text-[#1A1410]">{Math.floor(opt.priceCts / 100)}€</span>
                </button>
              )
            })}
          </div>

          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          <Button kind="primary" size="lg" full loading={loading} icon={<Rocket size={15} />} onClick={handleBoost}>
            Payer et activer
          </Button>
          <p className="text-[11px] text-center text-[#6B5A4A]">Paiement unique sécurisé par Stripe. Sans abonnement.</p>
        </div>
      </Modal>
    </>
  )
}
