'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Sparkles, Shield, CheckCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import { KZ } from '@/lib/constants'

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
  const supabase = createClient()
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

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
    await supabase.from('profiles').update({ [key]: value, updated_at: new Date().toISOString() }).eq('id', profile.id)
    setSettings(prev => ({ ...prev, [key]: value }))
    await refetch?.()
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  const handleFrequency = async (freq: 'instant' | 'daily' | 'weekly') => {
    if (!profile) return
    setSaving('freq')
    await supabase.from('profiles').update({ email_alert_frequency: freq, updated_at: new Date().toISOString() }).eq('id', profile.id)
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
    {
      icon: <Sparkles size={18} />,
      title: 'Emails KazaIA — conseils & astuces',
      description: 'Suggestions personnalisées pour améliorer ton profil, préparer tes entretiens et optimiser tes candidatures.',
      key: 'email_tips_enabled',
      value: true,
      badge: 'Bientôt',
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
    </div>
  )
}
