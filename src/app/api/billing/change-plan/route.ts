import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStripe, STRIPE_ENABLED } from '@/lib/stripe'
import { getActiveMembership } from '@/lib/queries/companies'
import { getOwnerBillingContext, saveStripeState } from '@/lib/queries/billing'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'

// POST /api/billing/change-plan  { planId } → { ok }
// Change le forfait de l'entreprise. Réservé à l'owner.
// - Abonnement Stripe actif : met à jour le prix de l'abonnement (proration).
// - Essai sans paiement : met simplement à jour le forfait en base (l'essai continue).
export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { planId } = await req.json().catch(() => ({}))
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === planId)
  if (!plan) return NextResponse.json({ error: 'Forfait inconnu.' }, { status: 400 })

  const membership = await getActiveMembership(userId)
  if (!membership) return NextResponse.json({ error: 'Aucune entreprise active.' }, { status: 400 })

  const ctx = await getOwnerBillingContext(userId, membership.companyId)
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.error === 'Non autorisé' ? 403 : 404 })
  }
  if (ctx.subscription?.planId === plan.id) {
    return NextResponse.json({ error: 'Vous êtes déjà sur ce forfait.' }, { status: 400 })
  }

  const subId = ctx.subscription?.stripeSubscriptionId

  // Abonnement Stripe en cours → on met à jour le prix de l'abonnement.
  if (subId && STRIPE_ENABLED) {
    try {
      const stripe = getStripe()
      const price = await stripe.prices.create({
        currency: 'eur',
        unit_amount: plan.priceCts,
        recurring: { interval: 'month' },
        product_data: { name: `Kazajob — Forfait ${plan.name}` },
      })
      const sub = await stripe.subscriptions.retrieve(subId)
      const itemId = sub.items.data[0]?.id
      if (!itemId) throw new Error('Aucun item d\'abonnement.')
      await stripe.subscriptions.update(subId, {
        items: [{ id: itemId, price: price.id }],
        proration_behavior: 'create_prorations',
        metadata: { companyId: ctx.company.id, planId: plan.id },
      })
    } catch (err) {
      console.error('[change-plan]', err)
      return NextResponse.json({ error: 'Échec de la mise à jour du forfait. Réessaie.' }, { status: 502 })
    }
  }

  // Met à jour le forfait en base (sans toucher au statut ni à l'essai).
  await saveStripeState(ctx.company.id, { planId: plan.id })
  return NextResponse.json({ ok: true })
}
