import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStripe, STRIPE_ENABLED } from '@/lib/stripe'
import { getActiveMembership } from '@/lib/queries/companies'
import { getOwnerBillingContext, saveStripeState } from '@/lib/queries/billing'

// POST /api/billing/cancel → { ok, mode }
// Résilie l'abonnement. Réservé à l'owner.
// - Abonnement Stripe : résiliation à la fin de la période payée (accès conservé jusque-là).
// - Essai sans paiement : statut passé à "cancelled" en base (accès coupé).
export async function POST() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const membership = await getActiveMembership(userId)
  if (!membership) return NextResponse.json({ error: 'Aucune entreprise active.' }, { status: 400 })

  const ctx = await getOwnerBillingContext(userId, membership.companyId)
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.error === 'Non autorisé' ? 403 : 404 })
  }

  const subId = ctx.subscription?.stripeSubscriptionId

  if (subId && STRIPE_ENABLED) {
    try {
      await getStripe().subscriptions.update(subId, { cancel_at_period_end: true })
    } catch (err) {
      console.error('[cancel]', err)
      return NextResponse.json({ error: 'Échec de la résiliation. Réessaie.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true, mode: 'period_end' })
  }

  // Essai sans abonnement Stripe → on coupe l'accès.
  await saveStripeState(ctx.company.id, { status: 'cancelled' })
  return NextResponse.json({ ok: true, mode: 'immediate' })
}
