'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Check, X, Shield, Users, Crown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'
import type { CompanyMember, CompanyJoinRequest } from '@/lib/types'
import type { BadgeColor } from '@/lib/types'

const ROLE_BADGE: Record<string, BadgeColor> = { owner: 'orange', admin: 'violet', member: 'cream' }
const ROLE_ICON: Record<string, React.ReactNode> = {
  owner: <Crown size={12} />, admin: <Shield size={12} />, member: <Users size={12} />,
}

export default function CompanyTeamPage() {
  const { profile } = useAuth()
  const [members, setMembers]   = useState<CompanyMember[]>([])
  const [requests, setRequests] = useState<CompanyJoinRequest[]>([])
  const [loading, setLoading]   = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const isOwnerOrAdmin = members.find(m =>
    m.recruiter_id === profile?.id && ['owner', 'admin'].includes(m.role)
  )

  const fetchAll = async () => {
    if (!profile?.company_id) return
    try {
      const res = await fetch(`/api/companies/${profile.company_id}/team`)
      if (res.ok) {
        const { members: m, requests: r } = await res.json()
        setMembers((m ?? []) as CompanyMember[])
        setRequests((r ?? []) as CompanyJoinRequest[])
      }
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [profile?.company_id])

  const handleRequest = async (req: CompanyJoinRequest, approve: boolean) => {
    if (!profile?.company_id) return
    setProcessingId(req.id)
    await fetch(`/api/company-requests/${req.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve }),
    })
    // Notifier le demandeur par email (fire & forget)
    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'join_response', requestId: req.id, approved: approve }),
    }).catch(() => {})

    await fetchAll()
    setProcessingId(null)
  }

  const handleRemoveMember = async (memberId: string, _recruiterId: string) => {
    if (!confirm('Retirer ce membre de l\'équipe ?')) return
    setProcessingId(memberId)
    await fetch(`/api/company-members/${memberId}`, { method: 'DELETE' })
    await fetchAll()
    setProcessingId(null)
  }

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    setProcessingId(memberId)
    await fetch(`/api/company-members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    await fetchAll()
    setProcessingId(null)
  }

  return (
    <div className="max-w-[700px] mx-auto">
      <div className="mb-6">
        <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Mon entreprise</p>
        <h1 className="text-2xl font-extrabold text-[#1A1410]">Gestion de l&apos;équipe</h1>
      </div>

      {/* Demandes en attente */}
      {requests.length > 0 && (
        <div className="kz-card p-5 bg-white mb-5">
          <h2 className="text-sm font-bold text-[#1A1410] mb-3 flex items-center gap-2">
            <UserPlus size={15} color={KZ.orange} />
            Demandes d&apos;adhésion ({requests.length})
          </h2>
          <div className="flex flex-col gap-3">
            {requests.map(req => {
              const p = req.profile as { full_name: string; email: string } | undefined
              return (
                <div key={req.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#E8DDC9]"
                  style={{ background: KZ.yellowSoft }}>
                  <Avatar name={p?.full_name ?? '?'} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#1A1410]">{p?.full_name ?? '—'}</div>
                    <div className="text-xs text-[#6B5A4A]">{p?.email}</div>
                    {req.message && <p className="text-xs text-[#2A2018] mt-1 italic">&quot;{req.message}&quot;</p>}
                  </div>
                  {isOwnerOrAdmin && (
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRequest(req, true)}
                        disabled={processingId === req.id}
                        className="w-8 h-8 rounded-lg border border-[#19A974] flex items-center justify-center hover:bg-[#D6F0E0]"
                      >
                        <Check size={15} color={KZ.green} />
                      </button>
                      <button
                        onClick={() => handleRequest(req, false)}
                        disabled={processingId === req.id}
                        className="w-8 h-8 rounded-lg border border-red-300 flex items-center justify-center hover:bg-red-50"
                      >
                        <X size={15} color="#EF4444" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Membres actifs */}
      <div className="kz-card bg-white overflow-hidden">
        <div className="p-4 border-b border-[#E8DDC9] flex justify-between items-center">
          <h2 className="text-sm font-bold text-[#1A1410]">Membres ({members.length})</h2>
        </div>
        {loading ? (
          <div className="p-4 flex flex-col gap-2">
            {[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-[#FBEFE0] animate-pulse" />)}
          </div>
        ) : (
          <div className="divide-y divide-[#E8DDC9]">
            {members.map(m => {
              const p = m.profile as { full_name: string; email: string; avatar_url?: string | null } | undefined
              const isSelf = m.recruiter_id === profile?.id
              const isOwner = m.role === 'owner'
              return (
                <div key={m.id} className="flex items-center gap-3 p-4 hover:bg-[#FBEFE0] transition-colors">
                  <Avatar name={p?.full_name ?? '?'} src={p?.avatar_url ?? null} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#1A1410]">{p?.full_name ?? '—'}</span>
                      {isSelf && <Badge color="cream" size="sm">Vous</Badge>}
                    </div>
                    <div className="text-xs text-[#6B5A4A]">{p?.email}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge color={ROLE_BADGE[m.role] ?? 'cream'} size="sm">
                      <span className="flex items-center gap-1">{ROLE_ICON[m.role]} {m.role}</span>
                    </Badge>
                    {isOwnerOrAdmin && !isSelf && !isOwner && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleChangeRole(m.id, m.role === 'admin' ? 'member' : 'admin')}
                          disabled={processingId === m.id}
                          className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-[#6D3BEB] text-xs transition-colors"
                          title={m.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
                        >
                          <Shield size={12} />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m.id, m.recruiter_id)}
                          disabled={processingId === m.id}
                          className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-red-400 hover:text-red-500 text-xs transition-colors"
                          title="Retirer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-4 p-4 rounded-xl border border-[#E8DDC9] text-xs text-[#6B5A4A]" style={{ background: KZ.cream2 }}>
        <strong>Pour inviter un recruteur :</strong> partagez ce lien de création de compte —{' '}
        <code className="bg-white px-1 rounded text-[11px]">
          kazajob.re/auth/register?role=recruiter&ref={profile?.company_id?.slice(0, 8)}
        </code>
        <br />Il pourra ensuite rechercher votre entreprise et envoyer une demande d&apos;adhésion.
      </div>
    </div>
  )
}
