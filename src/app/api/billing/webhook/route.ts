import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { saveStripeState, mapStripeStatus, getCompanyByStripeSubscription } from '@/lib/queries/billing'
import { activateJobBoost } from '@/lib/queries/jobs'
import { activateProfileBoost } from '@/lib/queries/profiles'
import { incrementRedemption } from '@/lib/queries/promos'

// POST /api/billing/webhook — événements Stripe (signature vérifiée, pas d'auth session).
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 503 })

  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 })

  const raw = await req.text()
  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret)
  } catch {
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      // Paiement initié : on lie le customer + l'abonnement à l'entreprise.
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        // Paiement unique de boost d'offre (mode payment).
        if (s.metadata?.kind === 'job_boost' && s.metadata.jobId) {
          await activateJobBoost(s.metadata.jobId, parseInt(s.metadata.days ?? '0', 10))
          break
        }
        // Paiement unique de boost de profil candidat (mode payment).
        if (s.metadata?.kind === 'profile_boost' && s.metadata.userId) {
          await activateProfileBoost(s.metadata.userId, parseInt(s.metadata.days ?? '0', 10))
          break
        }
        const companyId = s.metadata?.companyId
        if (companyId) {
          await saveStripeState(companyId, {
            customerId: typeof s.customer === 'string' ? s.customer : s.customer?.id ?? null,
            subscriptionId: typeof s.subscription === 'string' ? s.subscription : s.subscription?.id ?? null,
            planId: s.metadata?.planId,
          })
          if (s.metadata?.promoCode) await incrementRedemption(s.metadata.promoCode)
        }
        break
      }

      // Cycle de vie de l'abonnement (essai → actif, past_due, annulation…).
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const companyId = sub.metadata?.companyId ?? (await getCompanyByStripeSubscription(sub.id))
        if (companyId) {
          const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
          await saveStripeState(companyId, {
            subscriptionId: sub.id,
            status: event.type === 'customer.subscription.deleted' ? 'cancelled' : mapStripeStatus(sub.status),
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            planId: sub.metadata?.planId,
          })
        }
        break
      }
    }
  } catch (err) {
    console.error('[Stripe webhook]', err)
    return NextResponse.json({ error: 'Erreur de traitement.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
