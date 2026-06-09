'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, Gift, Users, Share2, Link as LinkIcon, Smartphone, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { KZ, SITE_URL } from '@/lib/constants'

interface ReferralStats {
  count: number
  rewarded: number
}

export default function ReferralPage() {
  const { profile, refetch } = useAuth()
  const [stats, setStats] = useState<ReferralStats>({ count: 0, rewarded: 0 })
  const [copied, setCopied] = useState(false)
  const [generating, setGenerating] = useState(false)

  const referralCode = profile?.referral_code
  const referralLink = referralCode ? `${SITE_URL}/auth/register?ref=${referralCode}` : null

  useEffect(() => {
    if (!profile?.id) return
    fetch('/api/referral')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setStats(d as ReferralStats) })
      .catch(() => {})
  }, [profile?.id])

  const handleCopy = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWhatsApp = () => {
    if (!referralLink) return
    const text = `Rejoins-moi sur Kazajob — la plateforme emploi pour La Réunion ! Utilise mon lien : ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const generateCode = async () => {
    if (!profile?.id || referralCode) return
    setGenerating(true)
    await fetch('/api/referral', { method: 'POST' })
    await refetch?.()
    setGenerating(false)
  }

  const XP_PER_REFERRAL = 200

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="mb-6">
        <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Communauté</p>
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">
          Parrainage <span style={{ color: KZ.violet }}>974</span>
        </h1>
        <p className="text-sm text-[#6B5A4A] mt-1">
          Invitez vos proches à rejoindre Kazajob et gagnez des XP tous les deux.
        </p>
      </div>

      {/* Comment ça marche */}
      <div className="kz-card p-5 bg-white mb-4">
        <h2 className="text-sm font-bold text-[#1A1410] mb-4">Comment ça marche ?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: <LinkIcon size={20} />, step: '1', text: 'Copiez votre lien de parrainage unique' },
            { icon: <Smartphone size={20} />, step: '2', text: 'Partagez-le à vos amis ou sur les réseaux' },
            { icon: <Gift size={20} />, step: '3', text: `+${XP_PER_REFERRAL} XP pour vous ET votre filleul à l'inscription` },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center text-center gap-2 p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
              <div className="w-10 h-10 rounded-xl border border-[#1A1410] flex items-center justify-center" style={{ background: KZ.violetSoft, color: KZ.violet }}>{s.icon}</div>
              <div className="w-6 h-6 rounded-full border border-[#1A1410] flex items-center justify-center text-xs font-extrabold" style={{ background: KZ.orangeSoft }}>
                {s.step}
              </div>
              <p className="text-xs text-[#2A2018] font-medium">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Votre code */}
      <div className="kz-card p-5 bg-white mb-4">
        <h2 className="text-sm font-bold text-[#1A1410] mb-3">Votre lien de parrainage</h2>
        {referralCode ? (
          <>
            {/* Code visuel */}
            <div
              className="flex items-center justify-center p-4 rounded-xl border-2 border-dashed border-[#1A1410] mb-4"
              style={{ background: KZ.violetSoft }}
            >
              <span className="text-2xl font-extrabold tracking-[0.25em]" style={{ color: KZ.violet }}>
                {referralCode}
              </span>
            </div>

            {/* Lien complet */}
            <div className="flex items-center gap-2 p-3 rounded-xl border border-[#E8DDC9] mb-4" style={{ background: KZ.cream2 }}>
              <span className="flex-1 text-xs text-[#6B5A4A] truncate font-mono">{referralLink}</span>
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg border border-[#1A1410] transition-colors hover:bg-[#E5DCFF] shrink-0"
                style={{ background: copied ? KZ.greenSoft : KZ.paper }}
                title="Copier le lien"
              >
                {copied ? <Check size={14} color={KZ.green} /> : <Copy size={14} />}
              </button>
            </div>

            {/* Boutons de partage */}
            <div className="flex gap-2 flex-wrap">
              <Button kind="primary" size="sm" icon={<Copy size={13} />} onClick={handleCopy} full>
                {copied ? 'Lien copié !' : 'Copier le lien'}
              </Button>
              <Button kind="outline" size="sm" icon={<Share2 size={13} />} onClick={handleWhatsApp} full>
                WhatsApp
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-[#6B5A4A] mb-3">Vous n&apos;avez pas encore de code de parrainage.</p>
            <Button kind="primary" size="md" icon={<Gift size={15} />} loading={generating} onClick={generateCode}>
              Générer mon code
            </Button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="kz-card p-5 bg-white text-center">
          <div className="text-3xl font-extrabold text-[#1A1410] mb-1">{stats.count}</div>
          <div className="text-xs text-[#6B5A4A] font-medium flex items-center justify-center gap-1">
            <Users size={12} /> Filleuls inscrits
          </div>
        </div>
        <div className="kz-card p-5 bg-white text-center">
          <div className="text-3xl font-extrabold mb-1" style={{ color: KZ.violet }}>
            +{stats.rewarded * XP_PER_REFERRAL}
          </div>
          <div className="text-xs text-[#6B5A4A] font-medium flex items-center justify-center gap-1">
            <Gift size={12} /> XP gagnés
          </div>
        </div>
      </div>

      {/* Note */}
      <div
        className="p-4 rounded-xl border border-[#1A1410] text-sm text-[#2A2018] leading-relaxed"
        style={{ background: KZ.yellowSoft }}
      >
        <strong className="flex items-center gap-1.5 mb-1"><Info size={14} /> Note :</strong> Les XP sont crédités lorsque votre filleul complète son profil à plus de 50%.
        Les parrainages sont limités à des profils réels — tout abus entraîne la suspension du compte.
      </div>
    </div>
  )
}
