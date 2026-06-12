'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Shield, CheckCheck, Gamepad2 } from 'lucide-react'
import { AccountActions } from '@/components/account/AccountActions'
import { useGamification } from '@/features/gamification/useGamification'
import { useApplications } from '@/features/applications/useApplications'
import { useFavorites } from '@/features/favorites/useFavorites'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'

async function patchProfile(patch: Record<string, unknown>) {
  await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className="relative inline-flex h-6 w-11 items-center rounded-full border border-[#1A1410] transition-colors shrink-0"
      style={{ background: checked ? KZ.green : KZ.cream2, boxShadow: '2px 2px 0 #1A1410' }}
    >
      <span
        className="inline-block w-4 h-4 rounded-full bg-white border border-[#1A1410] transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  )
}

interface SettingRow {
  icon: React.ReactNode
  title: string
  description: string
  key: string
  value: boolean
  badge?: string
}

export default function CandidateSettingsPage() {
  const { profile, refetch } = useAuth()
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const { applications } = useApplications(profile?.id)
  const { favorites } = useFavorites(profile?.id)
  const gami = useGamification(profile, applications.length, favorites.length)

  const [settings, setSettings] = useState({
    email_alerts_enabled:  true,
    email_alert_frequency: 'daily' as 'instant' | 'daily' | 'weekly',
  })

  useEffect(() => {
    if (profile) {
      setSettings({
        email_alerts_enabled:  profile.email_alerts_enabled ?? true,
        email_alert_frequency: (profile.email_alert_frequency as 'instant' | 'daily' | 'weekly') ?? 'daily',
      })
    }
  }, [profile])

  const handleToggle = async (key: string, value: boolean) => {
    if (!profile) return
    setSaving(key)
    await patchProfile({ [key]: value })
    setSettings(prev => ({ ...prev, [key]: value }))
    await refetch?.()
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  const handleFrequency = async (freq: 'instant' | 'daily' | 'weekly') => {
    if (!profile) return
    setSaving('freq')
    await patchProfile({ email_alert_frequency: freq })
    setSettings(prev => ({ ...prev, email_alert_frequency: freq }))
    await refetch?.()
    setSaving(null)
    setSaved('freq')
    setTimeout(() => setSaved(null), 2000)
  }

  const NOTIF_SETTINGS: SettingRow[] = [
    {
      icon: <Bell size={18} />,
      title: 'Notifications dans l\'app',
      description: 'Alertes temps réel quand le statut de tes candidatures change ou qu\'un entretien est planifié.',
      key: 'app_notifications',
      value: true,
      badge: 'Toujours actif',
    },
    {
      icon: <Mail size={18} />,
      title: 'Alertes email — offres matchantes',
      description: 'Reçois par email les nouvelles offres qui correspondent à ton profil. Tu contrôles la fréquence ci-dessous.',
      key: 'email_alerts_enabled',
      value: settings.email_alerts_enabled,
    },
  ]

  const FREQ_OPTIONS = [
    { value: 'instant', label: 'En temps réel', desc: 'Dès qu\'une offre correspond' },
    { value: 'daily',   label: 'Résumé quotidien', desc: 'Un email par jour max' },
    { value: 'weekly',  label: 'Résumé hebdo', desc: 'Un email par semaine' },
  ] as const

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="mb-7">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1410] mb-1">Paramètres</h1>
        <p className="text-sm text-[#6B5A4A]">Contrôle tes notifications et préférences de communication.</p>
      </div>

      {/* Notifications */}
      <div className="kz-card bg-white mb-5">
        <div className="px-6 py-4 border-b border-[#E8DDC9] flex items-center gap-2" style={{ background: KZ.cream2 }}>
          <Bell size={16} className="text-[#6B5A4A]" />
          <span className="text-sm font-bold text-[#1A1410]">Notifications &amp; alertes</span>
        </div>

        <div className="divide-y divide-[#F5F0E8]">
          {NOTIF_SETTINGS.map((s) => (
            <div key={s.key} className="flex items-start gap-4 px-6 py-4">
              <div className="w-9 h-9 rounded-xl border border-[#E8DDC9] flex items-center justify-center shrink-0 text-[#6B5A4A]" style={{ background: KZ.cream2 }}>
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-bold text-[#1A1410]">{s.title}</span>
                  {s.badge && <Badge color="cream" size="sm">{s.badge}</Badge>}
                  {saved === s.key && <CheckCheck size={13} color={KZ.green} />}
                </div>
                <p className="text-xs text-[#6B5A4A] leading-relaxed">{s.description}</p>
              </div>
              <Toggle
                checked={s.value}
                onChange={(v) => handleToggle(s.key, v)}
                disabled={!!s.badge || saving === s.key}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Fréquence des alertes email */}
      {settings.email_alerts_enabled && (
        <div className="kz-card bg-white mb-5">
          <div className="px-6 py-4 border-b border-[#E8DDC9] flex items-center gap-2" style={{ background: KZ.cream2 }}>
            <Mail size={16} className="text-[#6B5A4A]" />
            <span className="text-sm font-bold text-[#1A1410]">Fréquence des alertes email</span>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {FREQ_OPTIONS.map((f) => {
              const active = settings.email_alert_frequency === f.value
              return (
                <button
                  key={f.value}
                  onClick={() => handleFrequency(f.value)}
                  className="flex flex-col items-start p-4 rounded-xl border-[1.5px] transition-all text-left"
                  style={active
                    ? { borderColor: KZ.orange, background: KZ.orangeSoft, boxShadow: '3px 3px 0 #1A1410' }
                    : { borderColor: '#E8DDC9', background: KZ.cream }}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-sm font-bold text-[#1A1410]">{f.label}</span>
                    {active && <div className="w-4 h-4 rounded-full border border-[#1A1410] flex items-center justify-center" style={{ background: KZ.orange }}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>}
                  </div>
                  <span className="text-xs text-[#6B5A4A]">{f.desc}</span>
                </button>
              )
            })}
          </div>
          {saved === 'freq' && (
            <div className="px-6 pb-4">
              <p className="text-xs font-semibold" style={{ color: KZ.green }}>Préférence sauvegardée</p>
            </div>
          )}
        </div>
      )}

      {/* Expérience — Gamification */}
      <div className="kz-card bg-white mb-5">
        <div className="px-6 py-4 border-b border-[#E8DDC9] flex items-center gap-2" style={{ background: KZ.violetSoft }}>
          <Gamepad2 size={16} style={{ color: KZ.violet }} />
          <span className="text-sm font-bold text-[#1A1410]">Expérience &amp; Gamification</span>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#1A1410]"
            style={{ background: KZ.violet, color: 'white' }}>BETA</span>
        </div>
        <div className="px-6 py-5">
          {/* Toggle principal */}
          <div className="flex items-start gap-4 mb-5">
            <div className="w-9 h-9 rounded-xl border border-[#E8DDC9] flex items-center justify-center shrink-0"
              style={{ background: KZ.violetSoft, color: KZ.violet }}>
              <Gamepad2 size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-[#1A1410]">Mode Quête actif</span>
                {gami.enabled && <Badge color="violet" size="sm">ON</Badge>}
              </div>
              <p className="text-xs text-[#6B5A4A] leading-relaxed">
                Transforme ton tableau de bord en jeu de quêtes — niveaux, XP, défis à accomplir.
                Désactive pour retrouver l&apos;interface classique.
              </p>
            </div>
            <Toggle
              checked={gami.enabled}
              onChange={() => gami.toggle()}
              disabled={saving === 'gami'}
            />
          </div>

          {/* Aperçu du niveau quand actif */}
          {gami.enabled && (
            <div
              className="rounded-xl border-2 border-[#1A1410] p-4"
              style={{ background: '#1A1410', boxShadow: '3px 3px 0 ' + gami.level.color }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{gami.level.emoji}</span>
                  <div>
                    <div className="text-[10px] opacity-60 font-bold" style={{ color: KZ.cream }}>TON NIVEAU</div>
                    <div className="text-sm font-extrabold" style={{ color: gami.level.color }}>{gami.level.title}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold" style={{ color: KZ.cream }}>
                    {gami.xp.toLocaleString('fr-FR')} XP
                  </div>
                  <div className="text-[10px] opacity-50" style={{ color: KZ.cream }}>
                    {gami.doneQuests.length}/{gami.quests.length} quêtes accomplies
                  </div>
                </div>
              </div>
              {/* Mini barre XP */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${gami.xpProgress}%`, background: gami.level.color }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confidentialité */}
      <div className="kz-card bg-white">
        <div className="px-6 py-4 border-b border-[#E8DDC9] flex items-center gap-2" style={{ background: KZ.cream2 }}>
          <Shield size={16} className="text-[#6B5A4A]" />
          <span className="text-sm font-bold text-[#1A1410]">Confidentialité</span>
        </div>
        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-xs text-[#6B5A4A] leading-relaxed">
            Tes données sont hébergées en Europe, chiffrées au repos et en transit.
            Kazajob ne revend jamais tes informations personnelles et ne t&apos;envoie
            jamais d&apos;emails commerciaux non sollicités.
          </p>
          <div className="flex gap-2 flex-wrap">
            <Badge color="green" size="sm">RGPD conforme</Badge>
            <Badge color="blue" size="sm">Hébergé en EU</Badge>
            <Badge color="violet" size="sm">0 revente de données</Badge>
          </div>
        </div>
      </div>

      <AccountActions />
    </div>
  )
}
