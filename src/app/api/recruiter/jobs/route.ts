import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createJob, listRecruiterJobs } from '@/lib/queries/jobs'
import { canPublishJob, getActiveMembership } from '@/lib/queries/companies'

// GET /api/recruiter/jobs — mes offres
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await listRecruiterJobs(userId))
}

// POST /api/recruiter/jobs  { ...payload, companyId? } → { id }
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  if (session.user.role !== 'recruiter' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Réservé aux recruteurs' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))

  // L'admin plateforme n'est pas soumis aux quotas d'entreprise.
  let companyId: string | null = body.companyId ?? null
  if (session.user.role !== 'admin') {
    // Permission : seul un membre actif d'une entreprise peut publier.
    const membership = await getActiveMembership(userId)
    if (!membership) {
      return NextResponse.json(
        { error: 'Vous devez rejoindre ou créer une entreprise avant de publier une offre.' },
        { status: 403 },
      )
    }
    companyId = membership.companyId
    // Plafond d'offres actives selon le forfait.
    const quota = await canPublishJob(companyId)
    if (!quota.ok) {
      return NextResponse.json(
        { error: `Vous avez atteint la limite de ${quota.max} offre(s) active(s) du forfait ${quota.planName}. Désactivez une offre ou passez à un forfait supérieur.` },
        { status: 403 },
      )
    }
  }

  const id = await createJob(userId, body, companyId)
  return NextResponse.json({ id })
}
