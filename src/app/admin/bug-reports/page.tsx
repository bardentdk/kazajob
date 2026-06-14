'use client'

import { useEffect, useState } from 'react'
import { Bug, AlertTriangle, Paperclip, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { KZ } from '@/lib/constants'

interface BugReport {
  id: string
  reporterName: string | null
  reporterEmail: string | null
  reporterRole: string | null
  page: string
  message: string
  attachmentUrl: string | null
  severity: 'normal' | 'critical'
  status: 'open' | 'in_progress' | 'resolved'
  createdAt: string
}

const STATUS_LABELS: Record<string, { label: string; color: 'orange' | 'violet' | 'green' }> = {
  open:        { label: 'Ouvert',     color: 'orange' },
  in_progress: { label: 'En cours',   color: 'violet' },
  resolved:    { label: 'Résolu',     color: 'green'  },
}

const FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'open', label: 'Ouverts' },
  { id: 'in_progress', label: 'En cours' },
  { id: 'resolved', label: 'Résolus' },
]

export default function AdminBugReportsPage() {
  const [reports, setReports] = useState<BugReport[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    try {
      const res = await fetch('/api/admin/bug-reports')
      if (res.ok) setReports((await res.json()) as BugReport[])
    } catch { /* noop */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const setStatus = async (id: string, status: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: status as BugReport['status'] } : r))
    await fetch(`/api/admin/bug-reports/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    })
  }

  const remove = async (id: string) => {
    if (!confirm('Supprimer ce signalement ?')) return
    setReports((prev) => prev.filter((r) => r.id !== id))
    await fetch(`/api/admin/bug-reports/${id}`, { method: 'DELETE' })
  }

  const shown = reports.filter((r) => filter === 'all' || r.status === filter)
  const openCount = reports.filter((r) => r.status === 'open').length
  const criticalCount = reports.filter((r) => r.severity === 'critical' && r.status !== 'resolved').length

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Support</p>
          <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">Signalements de bug</h1>
          <p className="text-sm text-[#6B5A4A] mt-1">
            {openCount} ouvert{openCount > 1 ? 's' : ''}
            {criticalCount > 0 && <span className="font-bold" style={{ color: KZ.orange }}> · {criticalCount} bloquant{criticalCount > 1 ? 's' : ''}</span>}
          </p>
        </div>
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full border border-[#1A1410] shrink-0" style={{ background: KZ.paper }}>
          {FILTERS.map((f) => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={filter === f.id ? { background: KZ.violet, color: 'white' } : { color: KZ.mute }}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? <PageLoader /> : shown.length === 0 ? (
        <EmptyState title="Aucun signalement" description="Les bugs signalés par les candidats et recruteurs apparaîtront ici." icon={<Bug size={28} />} />
      ) : (
        <div className="flex flex-col gap-3">
          {shown.map((r) => (
            <div key={r.id} className="kz-card p-4 bg-white"
              style={r.severity === 'critical' && r.status !== 'resolved' ? { borderColor: KZ.orange } : undefined}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0"
                  style={{ background: r.severity === 'critical' ? KZ.orangeSoft : KZ.violetSoft }}>
                  {r.severity === 'critical' ? <AlertTriangle size={16} color={KZ.orange} /> : <Bug size={16} color={KZ.violet} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {r.severity === 'critical' && <Badge color="orange" size="sm">Bloquant</Badge>}
                    <code className="text-xs text-[#1A1410] font-semibold">{r.page}</code>
                    <span className="text-[11px] text-[#6B5A4A]">· {new Date(r.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-sm text-[#2A2018] leading-relaxed whitespace-pre-wrap">{r.message}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-[#6B5A4A]">
                    <span>{r.reporterName ?? 'Anonyme'} ({r.reporterRole ?? '—'}) · {r.reporterEmail ?? '—'}</span>
                    {r.attachmentUrl && (
                      <a href={r.attachmentUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 font-semibold" style={{ color: KZ.violet }}>
                        <Paperclip size={12} />Pièce jointe
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge color={STATUS_LABELS[r.status].color} size="sm">{STATUS_LABELS[r.status].label}</Badge>
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}
                    className="text-xs font-semibold h-8 px-2 border border-[#1A1410] rounded-lg bg-white cursor-pointer">
                    <option value="open">Ouvert</option>
                    <option value="in_progress">En cours</option>
                    <option value="resolved">Résolu</option>
                  </select>
                  <button onClick={() => remove(r.id)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B5A4A] hover:text-red-600">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
