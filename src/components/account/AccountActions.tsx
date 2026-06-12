'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { Download, Trash2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'

/** Bloc RGPD : export de ses données + suppression définitive du compte. */
export function AccountActions() {
  const [deleting, setDeleting] = useState(false)

  const exportData = () => { window.location.href = '/api/account' }

  const deleteAccount = async () => {
    if (!confirm('Supprimer définitivement ton compte et toutes tes données ?\nCette action est irréversible.')) return
    setDeleting(true)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) {
      await signOut({ redirect: false })
      window.location.href = '/'
    } else {
      alert('Suppression impossible. Réessaie ou contacte kazajob.re@gmail.com.')
      setDeleting(false)
    }
  }

  return (
    <div className="kz-card bg-white overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E8DDC9] flex items-center gap-2" style={{ background: KZ.cream2 }}>
        <ShieldCheck size={16} className="text-[#6B5A4A]" />
        <span className="text-sm font-bold text-[#1A1410]">Mes données &amp; confidentialité</span>
      </div>
      <div className="p-6">
        <p className="text-sm text-[#6B5A4A] mb-4 leading-relaxed">
          Conformément au RGPD, tu peux télécharger l&apos;ensemble de tes données ou supprimer
          définitivement ton compte à tout moment.
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Button kind="outline" size="md" icon={<Download size={15} />} onClick={exportData}>
            Exporter mes données
          </Button>
          <Button kind="danger" size="md" icon={<Trash2 size={15} />} loading={deleting} onClick={deleteAccount}>
            Supprimer mon compte
          </Button>
        </div>
      </div>
    </div>
  )
}
