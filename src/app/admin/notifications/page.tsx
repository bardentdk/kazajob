'use client'

import { useEffect, useState } from 'react'
import { Bell, Send, Users, User, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { KZ } from '@/lib/constants'
import type { BadgeColor } from '@/lib/types'

type Target = 'all' | 'candidate' | 'recruiter'

interface SentNotif {
  id: string
  title: string
  message: string
  target: Target
  sent_at: string
  recipients: number
}

const TARGET_OPTIONS: { value: Target; label: string; desc: string; color: BadgeColor }[] = [
  { value: 'all',       label: 'Tous les utilisateurs', desc: 'Candidats + Recruteurs',    color: 'violet' },
  { value: 'candidate', label: 'Candidats uniquement',  desc: 'Recherche d\'emploi',        color: 'orange' },
  { value: 'recruiter', label: 'Recruteurs uniquement', desc: 'Entreprises & recruteurs',   color: 'green'  },
]

export default function AdminNotificationsPage() {
  const [title, setTitle]       = useState('')
  const [message, setMessage]   = useState('')
  const [link, setLink]         = useState('')
  const [target, setTarget]     = useState<Target>('all')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [history, setHistory]   = useState<SentNotif[]>([])
  const [recipientCount, setRecipientCount] = useState(0)

  // Compter les destinataires
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/users/count?role=${target}`)
        if (res.ok) setRecipientCount((await res.json()).count ?? 0)
      } catch { /* noop */ }
    }
    load()
  }, [target])

  // Historique (stocké en local state pour la session)
  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return
    setSending(true)
    setSent(false)

    let recipients = 0
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, link, target }),
      })
      if (res.ok) recipients = (await res.json()).recipients ?? 0
    } catch { /* noop */ }

    // Historique local
    const newEntry: SentNotif = {
      id: crypto.randomUUID(),
      title: title.trim(),
      message: message.trim(),
      target,
      sent_at: new Date().toISOString(),
      recipients,
    }
    setHistory(h => [newEntry, ...h])
    setTitle(''); setMessage(''); setLink('')
    setSent(true)
    setSending(false)
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A1410]">Notifications</h1>
        <p className="text-sm text-[#6B5A4A] mt-1">Envoyer une notification push à vos utilisateurs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5">
        {/* Formulaire */}
        <div className="kz-card p-5 bg-white flex flex-col gap-4">
          <h2 className="text-sm font-bold text-[#1A1410] flex items-center gap-2">
            <Bell size={16} color={KZ.violet} /> Nouvelle notification
          </h2>

          {/* Cible */}
          <div>
            <label className="block text-sm font-semibold text-[#1A1410] mb-2">Destinataires</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TARGET_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTarget(opt.value)}
                  className="p-3 rounded-xl border-2 text-left transition-all"
                  style={{
                    borderColor: target === opt.value ? KZ.violet : KZ.line,
                    background: target === opt.value ? KZ.violetSoft : KZ.cream2,
                  }}
                >
                  <div className="text-xs font-bold text-[#1A1410]">{opt.label}</div>
                  <div className="text-[11px] text-[#6B5A4A]">{opt.desc}</div>
                </button>
              ))}
            </div>
            <p className="text-xs text-[#6B5A4A] mt-2 flex items-center gap-1">
              <Users size={12} />
              <strong>{recipientCount}</strong> destinataire{recipientCount > 1 ? 's' : ''}
            </p>
          </div>

          <Input
            label="Titre *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Nouveau : KazaEvents disponible !"
            maxLength={80}
          />

          <Textarea
            label="Message *"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Découvrez les prochains job datings en ligne sur Kazajob…"
            rows={3}
            maxLength={300}
          />

          <Input
            label="Lien (optionnel)"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="/candidate/events"
          />

          {sent && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-[#19A974] bg-[#D6F0E0]">
              <CheckCircle size={16} color={KZ.green} />
              <span className="text-sm font-bold text-[#1A1410]">Notification envoyée !</span>
            </div>
          )}

          <Button
            kind="primary"
            size="lg"
            full
            icon={<Send size={15} />}
            loading={sending}
            disabled={!title.trim() || !message.trim()}
            onClick={handleSend}
          >
            Envoyer à {recipientCount} utilisateur{recipientCount > 1 ? 's' : ''}
          </Button>
        </div>

        {/* Historique de session */}
        <div className="kz-card p-5 bg-white">
          <h2 className="text-sm font-bold text-[#1A1410] mb-4">Historique (session)</h2>
          {history.length === 0 ? (
            <div className="text-center py-8">
              <Bell size={24} className="mx-auto mb-2 opacity-30" />
              <p className="text-xs text-[#6B5A4A]">Aucune notification envoyée</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {history.map(h => (
                <div key={h.id} className="p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-[#1A1410] truncate">{h.title}</span>
                    <Badge color={h.target === 'all' ? 'violet' : h.target === 'candidate' ? 'orange' : 'green'} size="sm">
                      {h.target === 'all' ? 'Tous' : h.target === 'candidate' ? 'Candidats' : 'Recruteurs'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#6B5A4A] line-clamp-2">{h.message}</p>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#6B5A4A]">
                    <span className="flex items-center gap-1"><User size={10} />{h.recipients} destinataires</span>
                    <span>{new Date(h.sent_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
