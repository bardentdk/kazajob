import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getActiveMembership } from '@/lib/queries/companies'
import { activateLaunch } from '@/lib/queries/launch'

// POST /api/launch/activate  { confirmed: true } → active KazaLaunch (gratuit, sans Stripe).
// Owner de l'entreprise active uniquement. Re-vérifie l'éligibilité côté serveur.
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { confirmed } = await req.json().catch(() => ({}))
  if (confirmed !== true) {
    return NextResponse.json({ error: 'Confirmation requise.' }, { status: 400 })
  }

  const membership = await getActiveMembership(userId)
  if (!membership) return NextResponse.json({ error: 'Aucune entreprise active.' }, { status: 400 })
  if (membership.role !== 'owner') {
    return NextResponse.json({ error: 'Seul le propriétaire peut activer l\'offre.' }, { status: 403 })
  }

  const result = await activateLaunch(membership.companyId, userId)
  if (!result.ok) {
    // Statut d'éligibilité explicite → message exploitable côté client.
    return NextResponse.json({ error: 'Activation impossible.', status: result.status }, { status: 409 })
  }
  return NextResponse.json(result)
}
