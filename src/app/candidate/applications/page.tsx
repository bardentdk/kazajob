'use client'

import Link from 'next/link'
import { Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import { useApplications } from '@/features/applications/useApplications'
import { useAuth } from '@/features/auth/useAuth'
import { APPLICATION_STATUSES, KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'

const STATUS_TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'pending', label: 'En attente' },
  { key: 'viewed', label: 'Vues' },
  { key: 'interview', label: 'Entretien' },
  { key: 'offer', label: 'Offres' },
  { key: 'rejected', label: 'Refusees' },
] as const

type TabKey = (typeof STATUS_TABS)[number]['key']

import { useState } from 'react'

export default function ApplicationsPage() {
  const { profile } = useAuth()
  const { applications, loading } = useApplications(profile?.id)
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const filtered = activeTab === 'all'
    ? applications
    : applications.filter((a) => a.status === activeTab)

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="mb-6">
        <h1 className="kz-h2 text-[#1A1410] mb-1">Mes candidatures</h1>
        <p className="text-sm text-[#6B5A4A]">{applications.length} candidature(s) au total</p>
      </div>

      {/* Tabs status */}
      <div className="flex gap-1.5 mb-6 p-1 rounded-xl border border-[#1A1410] bg-white overflow-x-auto">
        {STATUS_TABS.map((tab) => {
          const cnt = tab.key === 'all' ? applications.length : applications.filter((a) => a.status === tab.key).length
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
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]"
                  style={{ background: activeTab === tab.key ? KZ.orange : KZ.cream2, color: KZ.ink }}
                >
                  {cnt}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Aucune candidature"
          description="Commence a postuler aux offres qui te correspondent !"
          icon={<Briefcase size={28} />}
          action={<Link href="/candidate/jobs"><Button kind="primary">Voir les offres</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((app) => {
            const statusInfo = APPLICATION_STATUSES[app.status] ?? { label: app.status, color: 'cream' }
            const company = app.job?.company
            const companyInit = (company?.name ?? 'CO').slice(0, 2).toUpperCase()

            return (
              <div key={app.id} className="kz-card p-5 bg-white flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl border border-[#1A1410] flex items-center justify-center font-bold text-sm text-[#1A1410] shrink-0"
                  style={{ background: KZ.cream2 }}
                >
                  {companyInit}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-[#1A1410] truncate">{app.job?.title}</div>
                  <div className="text-sm text-[#6B5A4A]">
                    {company?.name} · {app.job?.location} · {timeAgo(app.created_at)}
                  </div>
                </div>
                <Badge color={statusInfo.color as BadgeColor}>
                  {statusInfo.label}
                </Badge>
                <Link href={`/candidate/jobs/${app.job_id}`}>
                  <Button kind="soft" size="sm">Voir l&apos;offre</Button>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
