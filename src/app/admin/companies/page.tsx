'use client'

import { useEffect, useState } from 'react'
import { Building2, Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { EmptyState } from '@/components/feedback/EmptyState'
import type { Company } from '@/lib/types'
import { KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/companies')
        if (res.ok) setCompanies((await res.json()) as Company[])
      } catch { /* noop */ }
      setLoading(false)
    }
    load()
  }, [])

  const toggleVerified = async (company: Company) => {
    await fetch(`/api/admin/companies/${company.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verified: !company.is_verified }),
    })
    setCompanies((prev) => prev.map((c) => c.id === company.id ? { ...c, is_verified: !c.is_verified } : c))
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="kz-h2 text-[#1A1410] mb-1">Entreprises</h1>
        <p className="text-sm text-[#6B5A4A]">{companies.length} entreprise(s)</p>
      </div>

      {loading ? <PageLoader /> : companies.length === 0 ? (
        <EmptyState title="Aucune entreprise" icon={<Building2 size={28} />} />
      ) : (
        <div className="flex flex-col gap-3">
          {companies.map((company) => (
            <div key={company.id} className="kz-card p-5 bg-white flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl border border-[#1A1410] flex items-center justify-center font-bold text-[#1A1410] shrink-0" style={{ background: KZ.cream2 }}>
                {company.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base font-bold text-[#1A1410]">{company.name}</h3>
                  {company.is_verified && <Badge color="green" size="sm">Verifie</Badge>}
                </div>
                <div className="text-sm text-[#6B5A4A]">
                  {company.location ?? '—'} · {company.sector ?? 'Secteur non precise'} · {timeAgo(company.created_at)}
                </div>
              </div>
              <button
                onClick={() => toggleVerified(company)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1A1410] text-sm font-semibold transition-colors"
                style={{ background: company.is_verified ? KZ.greenSoft : KZ.cream2 }}
              >
                {company.is_verified ? <X size={14} /> : <Check size={14} />}
                {company.is_verified ? 'Retirer' : 'Verifier'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
