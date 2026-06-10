'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Building2, Check, ArrowRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { KZ } from '@/lib/constants'

interface InvitePreview {
  company: { name: string; logo_url: string | null } | null
  role: 'member' | 'admin'
  email: string | null
}

const ROLE_LABEL: Record<string, string> = { admin: 'Administrateur', member: 'Recruteur' }

function JoinContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('invite') ?? ''
  const [invite, setInvite] = useState<InvitePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) { setError('Lien d\'invitation manquant.'); setLoading(false); return }
    fetch(`/api/invitations/${token}`)
      .then(async (r) => {
        if (r.ok) setInvite((await r.json()) as InvitePreview)
        else setError('Cette invitation est invalide ou a expiré.')
      })
      .catch(() => setError('Erreur de chargement.'))
      .finally(() => setLoading(false))
  }, [token])

  const accept = async () => {
    setAccepting(true); setError('')
    const res = await fetch(`/api/invitations/${token}/accept`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (res.ok) router.push('/recruiter/company/team')
    else { setError(data.error ?? 'Impossible d\'accepter l\'invitation.'); setAccepting(false) }
  }

  if (loading) return <PageLoader />

  if (error && !invite) {
    return (
      <div className="max-w-[480px] mx-auto text-center py-16">
        <AlertCircle size={44} className="mx-auto mb-4" style={{ color: KZ.orange }} />
        <h1 className="text-xl font-bold text-[#1A1410] mb-2">Invitation indisponible</h1>
        <p className="text-sm text-[#6B5A4A] mb-6">{error}</p>
        <Button kind="outline" onClick={() => router.push('/recruiter/dashboard')}>Retour au tableau de bord</Button>
      </div>
    )
  }

  return (
    <div className="max-w-[480px] mx-auto py-12">
      <div className="kz-card p-7 bg-white text-center">
        <div className="w-16 h-16 rounded-2xl border border-[#1A1410] flex items-center justify-center mx-auto mb-5"
          style={{ background: KZ.violetSoft }}>
          {invite?.company?.logo_url
            ? <img src={invite.company.logo_url} alt="" className="w-full h-full object-cover rounded-2xl" />
            : <Building2 size={26} style={{ color: KZ.violet }} />}
        </div>
        <p className="kz-eyebrow mb-2" style={{ color: KZ.violet }}>Invitation équipe</p>
        <h1 className="text-2xl font-extrabold text-[#1A1410] mb-2">
          Rejoindre {invite?.company?.name ?? 'l\'entreprise'}
        </h1>
        <p className="text-sm text-[#6B5A4A] mb-4">
          Vous êtes invité(e) à rejoindre cet espace recruteur en tant que{' '}
          <Badge color="violet" size="sm">{ROLE_LABEL[invite?.role ?? 'member']}</Badge>
        </p>

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm mb-4">{error}</div>
        )}

        <Button kind="violet" size="lg" full loading={accepting} onClick={accept} iconRight={<ArrowRight size={15} />}>
          Accepter l&apos;invitation
        </Button>
        <button onClick={() => router.push('/recruiter/dashboard')}
          className="mt-3 text-xs font-semibold text-[#6B5A4A] hover:text-[#1A1410]">
          Plus tard
        </button>
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JoinContent />
    </Suspense>
  )
}
