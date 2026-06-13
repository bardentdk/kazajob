import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getStripe, STRIPE_ENABLED, APP_URL } from '@/lib/stripe'
import { getActiveMembership } from '@/lib/queries/companies'
import { getOwnerBillingContext, saveStripeState } from '@/lib/queries/billing'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'

// POST /api/billing/checkout  { planId? } → { url }
// Crée une session Stripe Checkout (abonnement mensuel). Réservé à l'owner.
// Les jours d'essai restants sont reportés (trial_period_days) → conversion automatique à la fin.
export async function POST(req: NextRequest) {
  if (!STRIPE_ENABLED) return NextResponse.json({ error: 'Paiement non configuré.' }, { status: 503 })

  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const { planId } = await req.json().catch(() => ({}))

  const membership = await getActiveMembership(userId)
  if (!membership) return NextResponse.json({ error: 'Aucune entreprise active.' }, { status: 400 })

  const ctx = await getOwnerBillingContext(userId, membership.companyId)
  if (ctx.error) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.error === 'Non autorisé' ? 403 : 404 })
  }

  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === (planId || ctx.subscription?.planId))
  if (!plan) return NextResponse.json({ error: 'Forfait inconnu.' }, { status: 400 })

  const stripe = getStripe()

  // Customer Stripe : réutilise l'existant ou en crée un.
  let customerId = ctx.subscription?.stripeCustomerId ?? null
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.owner?.email,
      name: ctx.company.name,
      metadata: { companyId: ctx.company.id },
    })
    customerId = customer.id
    await saveStripeState(ctx.company.id, { customerId })
  }

  // Jours d'essai restants → reportés sur l'abonnement Stripe.
  let trialDays: number | undefined
  if (ctx.subscription?.status === 'trial' && ctx.subscription.trialEndsAt) {
    const remaining = Math.ceil((ctx.subscription.trialEndsAt.getTime() - Date.now()) / 86_400_000)
    if (remaining > 0) trialDays = remaining
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    // Collecte du moyen de paiement dès l'inscription (même pendant l'essai) → débit auto en fin d'essai.
    payment_method_collection: 'always',
    line_items: [{
      quantity: 1,
      price_data: {
        currency: 'eur',
        unit_amount: plan.priceCts,
        recurring: { interval: 'month' },
        product_data: { name: `Kazajob — Forfait ${plan.name}` },
      },
    }],
    subscription_data: {
      ...(trialDays ? { trial_period_days: trialDays } : {}),
      metadata: { companyId: ctx.company.id, planId: plan.id },
    },
    metadata: { companyId: ctx.company.id, planId: plan.id },
    allow_promotion_codes: true,
    success_url: `${APP_URL}/recruiter/company?billing=success`,
    cancel_url: `${APP_URL}/recruiter/company?billing=cancel`,
  })

  return NextResponse.json({ url: checkout.url })
}
