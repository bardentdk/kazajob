'use client'

import { useEffect, useState } from 'react'
import { UserPlus, Check, X, Shield, Users, Crown, LogOut, Link2, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'
import type { CompanyMember, CompanyJoinRequest, CompanyInvitation } from '@/lib/types'
import type { BadgeColor } from '@/lib/types'

const ROLE_BADGE: Record<string, BadgeColor> = { owner: 'orange', admin: 'violet', member: 'cream' }
const ROLE_ICON: Record<string, React.ReactNode> = {
  owner: <Crown size={12} />, admin: <Shield size={12} />, member: <Users size={12} />,
}

export default function CompanyTeamPage() {
  const { profile } = useAuth()
  const [members, setMembers]   = useState<CompanyMember[]>([])
  const [requests, setRequests] = useState<CompanyJoinRequest[]>([])
  const [invitations, setInvitations] = useState<CompanyInvitation[]>([])
  const [loading, setLoading]   = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Invitation
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole]   = useState<'member' | 'admin'>('member')
  const [inviteLink, setInviteLink]   = useState('')
  const [inviting, setInviting]       = useState(false)
  const [copied, setCopied]           = useState(false)

  const myMembership = members.find(m => m.recruiter_id === profile?.id)
  const isOwner = myMembership?.role === 'owner'
  const isOwnerOrAdmin = !!myMembership && ['owner', 'admin'].includes(myMembership.role)

  const fetchAll = async () => {
    if (!profile?.company_id) return
    try {
      const [teamRes, invRes] = await Promise.all([
        fetch(`/api/companies/${profile.company_id}/team`),
        fetch(`/api/companies/${profile.company_id}/invitations`),
      ])
      if (teamRes.ok) {
        const { members: m, requests: r } = await teamRes.json()
        setMembers((m ?? []) as CompanyMember[])
        setRequests((r ?? []) as CompanyJoinRequest[])
      }
      if (invRes.ok) setInvitations((await invRes.json()) as CompanyInvitation[])
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [profile?.company_id])

  const handleRequest = async (req: CompanyJoinRequest, approve: boolean) => {
    if (!profile?.company_id) return
    setProcessingId(req.id)
    const res = await fetch(`/api/company-requests/${req.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approve }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(data.error ?? 'Action impossible. Réessayez.')
      setProcessingId(null)
      return
    }
    fetch('/api/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'join_response', requestId: req.id, approved: approve }),
    }).catch(() => {})
    await fetchAll()
    setProcessingId(null)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Retirer ce membre de l\'équipe ?')) return
    setProcessingId(memberId)
    const res = await fetch(`/api/company-members/${memberId}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Action impossible.') }
    await fetchAll()
    setProcessingId(null)
  }

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'member') => {
    setProcessingId(memberId)
    const res = await fetch(`/api/company-members/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: newRole }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Action impossible.') }
    await fetchAll()
    setProcessingId(null)
  }

  const handleTransfer = async (memberId: string, name: string) => {
    if (!profile?.company_id) return
    if (!confirm(`Transférer la propriété de l'entreprise à ${name} ? Vous deviendrez administrateur.`)) return
    setProcessingId(memberId)
    const res = await fetch(`/api/companies/${profile.company_id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? 'Action impossible.') }
    await fetchAll()
    setProcessingId(null)
  }

  const handleLeave = async () => {
    if (!profile?.company_id) return
    if (!confirm('Quitter cette entreprise ? Vous perdrez l\'accès à son espace recruteur.')) return
    const res = await fetch(`/api/companies/${profile.company_id}/leave`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) { window.location.href = '/recruiter/dashboard' }
    else alert(data.error ?? 'Action impossible.')
  }

  const handleCreateInvite = async () => {
    if (!profile?.company_id) return
    setInviting(true); setInviteLink(''); setCopied(false)
    const res = await fetch(`/api/companies/${profile.company_id}/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail.trim() || undefined, role: inviteRole }),
    })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.token) {
      setInviteLink(`${window.location.origin}/recruiter/join?invite=${data.token}`)
      if (inviteEmail.trim()) {
        fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'team_invitation', token: data.token }),
        }).catch(() => {})
      }
      setInviteEmail('')
      await fetchAll()
    } else {
      alert(data.error ?? 'Impossible de créer l\'invitation.')
    }
    setInviting(false)
  }

  const handleRevoke = async (invId: string) => {
    setProcessingId(invId)
    await fetch(`/api/company-invitations/${invId}`, { method: 'DELETE' })
    await fetchAll()
    setProcessingId(null)
  }

  const copyLink = () => {
    navigator.clipboard?.writeText(inviteLink).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div className="max-w-[700px] mx-auto">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Mon entreprise</p>
          <h1 className="text-2xl font-extrabold text-[#1A1410]">Gestion de l&apos;équipe</h1>
        </div>
        {myMembership && !isOwner && (
          <Button kind="outline" size="sm" icon={<LogOut size={14} />} onClick={handleLeave}>Quitter</Button>
        )}
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
                      <button onClick={() => handleRequest(req, true)} disabled={processingId === req.id}
                        className="w-8 h-8 rounded-lg border border-[#19A974] flex items-center justify-center hover:bg-[#D6F0E0]">
                        <Check size={15} color={KZ.green} />
                      </button>
                      <button onClick={() => handleRequest(req, false)} disabled={processingId === req.id}
                        className="w-8 h-8 rounded-lg border border-red-300 flex items-center justify-center hover:bg-red-50">
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

      {/* Inviter un recruteur */}
      {isOwnerOrAdmin && (
        <div className="kz-card p-5 bg-white mb-5">
          <h2 className="text-sm font-bold text-[#1A1410] mb-1 flex items-center gap-2">
            <Link2 size={15} color={KZ.violet} /> Inviter un recruteur
          </h2>
          <p className="text-xs text-[#6B5A4A] mb-3">
            Générez un lien d&apos;invitation (valable 7 jours). Avec un e-mail, l&apos;invitation est aussi envoyée directement.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="E-mail (optionnel)"
              type="email"
              className="flex-1"
            />
            <Select
              options={[{ value: 'member', label: 'Recruteur' }, { value: 'admin', label: 'Admin' }]}
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'member' | 'admin')}
              className="w-full sm:w-36"
            />
            <Button kind="violet" size="md" loading={inviting} onClick={handleCreateInvite}>Générer</Button>
          </div>

          {inviteLink && (
            <div className="mt-3 flex items-center gap-2 p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft }}>
              <code className="flex-1 min-w-0 text-[11px] text-[#1A1410] truncate">{inviteLink}</code>
              <button onClick={copyLink} className="flex items-center gap-1 text-xs font-bold shrink-0" style={{ color: KZ.violet }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copié' : 'Copier'}
              </button>
            </div>
          )}

          {/* Invitations en attente */}
          {invitations.length > 0 && (
            <div className="mt-4 flex flex-col gap-2">
              <p className="text-xs font-bold text-[#6B5A4A]">Invitations en attente ({invitations.length})</p>
              {invitations.map(inv => (
                <div key={inv.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-[#1A1410] truncate">{inv.email ?? 'Lien d\'invitation'}</div>
                    <div className="text-[10px] text-[#6B5A4A]">Rôle : {inv.role === 'admin' ? 'Admin' : 'Recruteur'}</div>
                  </div>
                  <button onClick={() => handleRevoke(inv.id)} disabled={processingId === inv.id}
                    className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-red-400 hover:text-red-500 transition-colors" title="Révoquer">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
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
              const memberIsOwner = m.role === 'owner'
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
                    {/* Transfert de propriété : owner uniquement, sur un autre membre */}
                    {isOwner && !isSelf && !memberIsOwner && (
                      <button
                        onClick={() => handleTransfer(m.id, p?.full_name ?? 'ce membre')}
                        disabled={processingId === m.id}
                        className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-[#FF6B35] text-xs transition-colors"
                        title="Transférer la propriété"
                      >
                        <Crown size={12} />
                      </button>
                    )}
                    {isOwnerOrAdmin && !isSelf && !memberIsOwner && (
                      <>
                        <button
                          onClick={() => handleChangeRole(m.id, m.role === 'admin' ? 'member' : 'admin')}
                          disabled={processingId === m.id}
                          className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-[#6D3BEB] text-xs transition-colors"
                          title={m.role === 'admin' ? 'Rétrograder' : 'Promouvoir admin'}
                        >
                          <Shield size={12} />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          disabled={processingId === m.id}
                          className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-red-400 hover:text-red-500 text-xs transition-colors"
                          title="Retirer"
                        >
                          <X size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
