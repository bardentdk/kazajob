import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStripe, STRIPE_ENABLED, APP_URL } from '@/lib/stripe'
import { getActiveMembership } from '@/lib/queries/companies'
import { getOwnerBillingContext } from '@/lib/queries/billing'

// POST /api/billing/portal → { url } — portail de gestion d'abonnement Stripe (owner).
export async function POST() {
  if (!STRIPE_ENABLED) return NextResponse.json({ error: 'Paiement non configuré.' }, { status: 503 })

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const membership = await getActiveMembership(userId)
  if (!membership) return NextResponse.json({ error: 'Aucune entreprise active.' }, { status: 400 })

  const ctx = await getOwnerBillingContext(userId, membership.companyId)
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.error === 'Non autorisé' ? 403 : 404 })
  }
  if (!ctx.subscription?.stripeCustomerId) {
    return NextResponse.json({ error: 'Aucun abonnement à gérer pour le moment.' }, { status: 400 })
  }

  const stripe = getStripe()
  const portal = await stripe.billingPortal.sessions.create({
    customer: ctx.subscription.stripeCustomerId,
    return_url: `${APP_URL}/recruiter/company`,
  })

  return NextResponse.json({ url: portal.url })
}
