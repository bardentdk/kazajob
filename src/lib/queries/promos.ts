/**
 * KAZAJOB — Codes promo (réductions admin) synchronisés avec Stripe.
 * Notre base = source de vérité pour la validité (durée, fin, prolongation).
 * Stripe applique la remise via un Coupon (au checkout + sur les abonnements actifs).
 */
import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { promoCodes, companySubscriptions } from '@/lib/db/schema'
import { getStripe, STRIPE_ENABLED } from '@/lib/stripe'

export interface PromoInput {
  code: string
  description?: string | null
  discountType: 'percent' | 'amount'
  discountValue: number
  durationType: 'once' | 'repeating' | 'forever'
  durationMonths?: number | null
  startDate?: string | null
  endDate?: string | null
  maxRedemptions?: number | null
}

export function listPromos() {
  return db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt))
}

export async function createPromo(input: PromoInput): Promise<{ error?: string; id?: string }> {
  const code = (input.code ?? '').trim().toUpperCase()
  if (!code) return { error: 'Code requis' }
  if (!input.discountValue || input.discountValue <= 0) return { error: 'Valeur de réduction invalide' }
  if (input.discountType === 'percent' && input.discountValue > 100) return { error: 'Pourcentage max 100' }

  const [exists] = await db.select({ id: promoCodes.id }).from(promoCodes).where(eq(promoCodes.code, code)).limit(1)
  if (exists) return { error: 'Ce code existe déjà' }

  let stripeCouponId: string | null = null
  if (STRIPE_ENABLED) {
    try {
      const coupon = await getStripe().coupons.create({
        ...(input.discountType === 'percent'
          ? { percent_off: input.discountValue }
          : { amount_off: input.discountValue, currency: 'eur' }),
        duration: input.durationType,
        ...(input.durationType === 'repeating' ? { duration_in_months: input.durationMonths ?? 1 } : {}),
        name: `Kazajob ${code}`,
      })
      stripeCouponId = coupon.id
    } catch (e) {
      return { error: 'Échec création du coupon Stripe : ' + (e instanceof Error ? e.message : 'erreur') }
    }
  }

  const [row] = await db.insert(promoCodes).values({
    code,
    description: input.description ?? null,
    discountType: input.discountType,
    discountValue: input.discountValue,
    durationType: input.durationType,
    durationMonths: input.durationMonths ?? null,
    startDate: input.startDate ? new Date(input.startDate) : null,
    endDate: input.endDate ? new Date(input.endDate) : null,
    maxRedemptions: input.maxRedemptions ?? null,
    stripeCouponId,
  }).returning({ id: promoCodes.id })

  return { id: row.id }
}

export async function updatePromo(id: string, patch: { endDate?: string | null; active?: boolean }): Promise<void> {
  const set: Record<string, unknown> = {}
  if ('endDate' in patch) set.endDate = patch.endDate ? new Date(patch.endDate) : null
  if ('active' in patch) set.active = patch.active
  if (Object.keys(set).length) await db.update(promoCodes).set(set).where(eq(promoCodes.id, id))
}

export async function deletePromo(id: string): Promise<void> {
  const [p] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1)
  if (p?.stripeCouponId && STRIPE_ENABLED) {
    try { await getStripe().coupons.del(p.stripeCouponId) } catch { /* coupon déjà supprimé */ }
  }
  await db.delete(promoCodes).where(eq(promoCodes.id, id))
}

export interface PromoValidation { valid: boolean; reason?: string; label?: string; couponId?: string | null }

export async function validatePromo(code: string): Promise<PromoValidation> {
  if (!code?.trim()) return { valid: false }
  const [p] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.trim().toUpperCase())).limit(1)
  if (!p || !p.active) return { valid: false, reason: 'Code invalide' }
  if (p.startDate && new Date(p.startDate) > new Date()) return { valid: false, reason: 'Code pas encore actif' }
  if (p.endDate && new Date(p.endDate) < new Date()) return { valid: false, reason: 'Code expiré' }
  if (p.maxRedemptions !== null && p.usedCount >= p.maxRedemptions) return { valid: false, reason: 'Code épuisé' }
  const label = p.discountType === 'percent' ? `-${p.discountValue} %` : `-${Math.round(p.discountValue / 100)} €`
  return { valid: true, label, couponId: p.stripeCouponId }
}

export async function incrementRedemption(code: string): Promise<void> {
  await db.update(promoCodes)
    .set({ usedCount: sql`${promoCodes.usedCount} + 1` })
    .where(eq(promoCodes.code, code.trim().toUpperCase()))
}

/** Applique le coupon aux abonnements Stripe en cours (essai/actif). */
export async function applyToActiveSubscriptions(id: string): Promise<{ applied: number }> {
  const [p] = await db.select().from(promoCodes).where(eq(promoCodes.id, id)).limit(1)
  if (!p?.stripeCouponId || !STRIPE_ENABLED) return { applied: 0 }

  const subs = await db
    .select({ subId: companySubscriptions.stripeSubscriptionId })
    .from(companySubscriptions)
    .where(and(isNotNull(companySubscriptions.stripeSubscriptionId), inArray(companySubscriptions.status, ['trial', 'active'])))

  const stripe = getStripe()
  let applied = 0
  for (const s of subs) {
    if (!s.subId) continue
    try {
      await stripe.subscriptions.update(s.subId, { discounts: [{ coupon: p.stripeCouponId }] })
      applied++
    } catch { /* abonnement non éligible → on continue */ }
  }
  return { applied }
}
