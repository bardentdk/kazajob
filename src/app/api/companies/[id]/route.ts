import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getCompanyOverview, isCompanyMember } from '@/lib/queries/companies'

// GET /api/companies/[id] — vue d'ensemble (infos + abonnement + compteurs).
// Réservé aux membres : l'abonnement et la compo de l'équipe ne sont pas publics.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  const { id } = await params
  if (!(await isCompanyMember(userId, id))) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }
  return NextResponse.json(await getCompanyOverview(id))
}
