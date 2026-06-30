import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createTraining, listRecruiterTrainings } from '@/lib/queries/trainings'
import { canPublishTraining, getActiveMembership } from '@/lib/queries/companies'

// GET /api/recruiter/trainings — mes formations
export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  return NextResponse.json(await listRecruiterTrainings(userId))
}

// POST /api/recruiter/trainings  { ...payload, companyId? } → { id }
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
    // Permission : seul un membre actif d'une entreprise peut publier (l'entreprise
    // active du recruteur, jamais un companyId arbitraire fourni par le client).
    const membership = await getActiveMembership(userId)
    if (!membership) {
      return NextResponse.json(
        { error: 'Vous devez rejoindre ou créer une entreprise avant de publier une formation.' },
        { status: 403 },
      )
    }
    companyId = membership.companyId
    // Plafond de formations actives selon le forfait ou la campagne de lancement.
    const quota = await canPublishTraining(companyId)
    if (!quota.ok) {
      const error = quota.reason === 'expired'
        ? 'Votre essai ou abonnement a expiré. Activez votre abonnement pour publier de nouvelles formations.'
        : `Vous avez atteint la limite de ${quota.max} formation(s) active(s) du forfait ${quota.planName}. Désactivez une formation ou passez à un forfait supérieur.`
      return NextResponse.json({ error }, { status: 403 })
    }
  }

  const id = await createTraining(userId, body, companyId)
  return NextResponse.json({ id })
}
