/**
 * KAZAJOB — Client Stripe (serveur).
 * Gardé : si STRIPE_SECRET_KEY est absent, l'app fonctionne mais les routes
 * de paiement renvoient une erreur claire (503) au lieu de crasher.
 */
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY

export const STRIPE_ENABLED = !!key

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!key) throw new Error('Stripe non configuré (STRIPE_SECRET_KEY manquant).')
  if (!_stripe) _stripe = new Stripe(key)
  return _stripe
}

/** URL de base pour les redirections Checkout / Portal. */
export const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kazajob.re'
