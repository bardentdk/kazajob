/**
 * KAZAJOB — Vérification Stripe avant purge.
 * Détecte les abonnements actifs/en essai/impayés. Ne modifie RIEN côté Stripe.
 * N'expose aucun secret (uniquement des identifiants d'abonnement).
 */
import { STRIPE_ENABLED, getStripe } from '@/lib/stripe'

export interface StripePreflight {
  enabled:   boolean
  reachable: boolean
  active:    { id: string; status: string; customer: string }[]
  note:      string
}

const LIVE_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid'])

export async function stripePreflight(): Promise<StripePreflight> {
  if (!STRIPE_ENABLED) {
    return { enabled: false, reachable: false, active: [], note: 'STRIPE_SECRET_KEY absent → Stripe désactivé, aucun abonnement joignable via API.' }
  }
  try {
    const stripe = getStripe()
    const list = await stripe.subscriptions.list({ status: 'all', limit: 100 })
    const active = list.data
      .filter((s) => LIVE_STATUSES.has(s.status))
      .map((s) => ({ id: s.id, status: s.status, customer: typeof s.customer === 'string' ? s.customer : s.customer.id }))
    return { enabled: true, reachable: true, active, note: `${active.length} abonnement(s) actif(s)/essai/impayé détecté(s).` }
  } catch (e) {
    return { enabled: true, reachable: false, active: [], note: `Échec interrogation Stripe : ${String(e).slice(0, 160)}` }
  }
}
