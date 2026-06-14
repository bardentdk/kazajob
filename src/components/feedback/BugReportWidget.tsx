'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bug, Paperclip, Check, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { uploadFile } from '@/features/profile/useUpload'
import { KZ } from '@/lib/constants'

/**
 * Bouton flottant + modal de signalement de bug (candidat & recruteur).
 * `stacked` : remonte le bouton pour ne pas chevaucher le chat KazaIA (côté candidat).
 */
export function BugReportWidget({ stacked = false }: { stacked?: boolean }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [critical, setCritical] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const reset = () => { setMessage(''); setCritical(false); setFile(null); setError(''); setDone(false) }
  const close = () => { if (!loading) { setOpen(false); setTimeout(reset, 200) } }

  const submit = async () => {
    if (!message.trim()) { setError('Décris le problème en quelques mots.'); return }
    setLoading(true); setError('')
    let attachmentUrl: string | null = null
    if (file) {
      const { url, error: upErr } = await uploadFile(file, 'bug-reports')
      if (upErr) { setError('Échec de l\'envoi de la pièce jointe : ' + upErr); setLoading(false); return }
      attachmentUrl = url
    }
    try {
      const res = await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page: pathname, message, attachmentUrl, severity: critical ? 'critical' : 'normal' }),
      })
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? 'Erreur') }
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Une erreur est survenue. Réessaie.')
    }
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Signaler un bug"
        className={`fixed ${stacked ? 'bottom-24' : 'bottom-6'} right-6 z-30 flex items-center gap-2 h-11 px-4 rounded-full border-2 border-[#1A1410] font-bold text-xs transition-all hover:scale-105 active:scale-95`}
        style={{ background: KZ.yellow, color: KZ.ink, boxShadow: '3px 3px 0 #1A1410' }}
      >
        <Bug size={16} />
        <span className="hidden sm:inline">Signaler un bug</span>
      </button>

      <Modal open={open} onClose={close} title="Signaler un bug" size="md">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <div className="w-16 h-16 rounded-full border-2 border-[#1A1410] flex items-center justify-center" style={{ background: KZ.greenSoft }}>
              <Check size={28} color={KZ.green} />
            </div>
            <h3 className="text-base font-bold text-[#1A1410]">Merci pour ton signalement !</h3>
            <p className="text-sm text-[#6B5A4A]">L&apos;équipe Kazajob a été notifiée et va regarder ça au plus vite.</p>
            <Button kind="primary" size="md" onClick={close}>Fermer</Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft }}>
              <Bug size={18} color={KZ.violet} />
              <p className="text-sm font-semibold text-[#1A1410]">Aide-nous à améliorer Kazajob en signalant ce qui ne va pas.</p>
            </div>

            {/* Page concernée (auto-détectée) */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Page concernée</label>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-[#E8DDC9] bg-[#FBEFE0]">
                <code className="text-xs text-[#2A2018] truncate flex-1">{pathname}</code>
                <span className="text-[10px] text-[#6B5A4A] shrink-0">auto-détectée</span>
              </div>
            </div>

            <Textarea
              label="Décris le problème *"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ex : le bouton « Postuler » ne fait rien quand je clique dessus…"
              rows={4}
            />

            {/* Pièce jointe */}
            <div>
              <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Pièce jointe (capture d&apos;écran, optionnel)</label>
              {file ? (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-[#1A1410]" style={{ background: KZ.greenSoft }}>
                  <Paperclip size={14} />
                  <span className="text-xs text-[#1A1410] truncate flex-1">{file.name}</span>
                  <button onClick={() => setFile(null)} className="text-[#6B5A4A] hover:text-red-600"><X size={14} /></button>
                </div>
              ) : (
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-[#1A1410] cursor-pointer hover:bg-[#FBEFE0]">
                  <Paperclip size={14} />
                  <span className="text-xs font-semibold text-[#1A1410]">Ajouter un fichier (image, PDF…)</span>
                  <input type="file" accept="image/*,.pdf" className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                </label>
              )}
            </div>

            {/* Gravité */}
            <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border-2"
              style={{ borderColor: critical ? KZ.orange : KZ.line, background: critical ? KZ.orangeSoft : 'white' }}>
              <input type="checkbox" checked={critical} onChange={(e) => setCritical(e.target.checked)} className="w-4 h-4 accent-[#FF6B35]" />
              <AlertTriangle size={16} color={critical ? KZ.orange : KZ.mute} />
              <span className="text-sm font-semibold text-[#1A1410]">C&apos;est bloquant — je ne peux pas continuer</span>
            </label>

            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            <div className="flex gap-2.5">
              <Button kind="soft" size="lg" full onClick={close}>Annuler</Button>
              <Button kind="primary" size="lg" full loading={loading} icon={<Bug size={15} />} onClick={submit}>Envoyer</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
