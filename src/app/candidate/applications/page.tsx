'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Briefcase, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useApplications } from '@/features/applications/useApplications'
import { useAuth } from '@/features/auth/useAuth'
import { APPLICATION_STATUSES, KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { BadgeColor } from '@/lib/types'

const STATUS_TABS = [
  { key: 'all',       label: 'Toutes' },
  { key: 'pending',   label: 'En attente' },
  { key: 'viewed',    label: 'Vues' },
  { key: 'interview', label: 'Entretien' },
  { key: 'offer',     label: 'Offres' },
  { key: 'rejected',  label: 'Refusées' },
] as const

type TabKey = (typeof STATUS_TABS)[number]['key']

export default function ApplicationsPage() {
  const { profile } = useAuth()
  const { applications, loading, refetch } = useApplications(profile?.id)
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)
  const supabase = createClient()

  const filtered = (activeTab === 'all'
    ? applications
    : applications.filter((a) => a.status === activeTab)
  ).filter(a => (a.status as string) !== 'withdrawn')

  const handleCancel = async () => {
    if (!cancelId) return
    setCancelling(true)
    await supabase
      .from('applications')
      .update({ status: 'withdrawn', updated_at: new Date().toISOString() })
      .eq('id', cancelId)
    await refetch?.()
    setCancelling(false)
    setCancelId(null)
  }

  const cancelTarget = applications.find(a => a.id === cancelId)

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1410] mb-1">Mes candidatures</h1>
        <p className="text-sm text-[#6B5A4A]">{applications.filter(a => (a.status as string) !== 'withdrawn').length} candidature(s) active(s)</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-6 p-1 rounded-xl border border-[#1A1410] bg-white overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const cnt = tab.key === 'all'
            ? applications.filter(a => (a.status as string) !== 'withdrawn').length
            : applications.filter((a) => a.status === tab.key).length
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all border-[1.5px]"
              style={activeTab === tab.key
                ? { background: KZ.ink, color: KZ.cream, borderColor: KZ.ink, boxShadow: '2px 2px 0 #FF6B35' }
                : { background: 'transparent', color: KZ.text, borderColor: 'transparent' }}
            >
              {tab.label}
              {cnt > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]"
                  style={{ background: activeTab === tab.key ? KZ.orange : KZ.cream2, color: KZ.ink }}>
                  {cnt}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState
          title="Aucune candidature"
          description="Commence à postuler aux offres qui te correspondent !"
          icon={<Briefcase size={28} />}
          action={<Link href="/candidate/jobs"><Button kind="primary">Voir les offres</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => {
            const statusInfo = APPLICATION_STATUSES[app.status as keyof typeof APPLICATION_STATUSES]
              ?? { label: app.status, color: 'cream' }
            const company = app.job?.company
            const companyInit = (company?.name ?? 'CO').slice(0, 2).toUpperCase()
            const canCancel = !['hired', 'rejected', 'withdrawn'].includes(app.status)

            return (
              <div key={app.id} className="kz-card p-5 bg-white flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl border border-[#1A1410] flex items-center justify-center font-bold text-sm text-[#1A1410] shrink-0" style={{ background: KZ.cream2 }}>
                  {companyInit}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-[#1A1410] truncate">{app.job?.title}</div>
                  <div className="text-sm text-[#6B5A4A]">
                    {company?.name} · {app.job?.location} · {timeAgo(app.created_at)}
                  </div>
                </div>
                <Badge color={statusInfo.color as BadgeColor}>{statusInfo.label}</Badge>
                <Link href={`/candidate/jobs/${app.job_id}`}>
                  <Button kind="soft" size="sm">Voir l&apos;offre</Button>
                </Link>
                {canCancel && (
                  <button
                    onClick={() => setCancelId(app.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#E8DDC9] text-[#6B5A4A] hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                    title="Retirer ma candidature"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Modal confirmation annulation */}
      <Modal open={!!cancelId} onClose={() => setCancelId(null)} title="Retirer ma candidature">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-[#2A2018]">
            Tu es sur le point de retirer ta candidature pour{' '}
            <strong>{cancelTarget?.job?.title}</strong>{' '}
            chez <strong>{cancelTarget?.job?.company?.name}</strong>.
          </p>
          <div className="p-3 rounded-xl border border-[#E8DDC9] text-xs text-[#6B5A4A]" style={{ background: KZ.yellowSoft }}>
            Le recruteur sera informé que tu as retiré ta candidature. Cette action est irréversible.
          </div>
          <div className="flex gap-3">
            <Button kind="soft" size="md" full onClick={() => setCancelId(null)}>Annuler</Button>
            <Button kind="danger" size="md" full loading={cancelling} onClick={handleCancel}>
              Retirer ma candidature
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
