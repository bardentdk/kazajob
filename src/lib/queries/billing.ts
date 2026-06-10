/**
 * KAZAJOB — Requêtes Drizzle liées à la facturation Stripe.
 * Couche serveur. Le contexte de facturation est réservé à l'owner de l'entreprise.
 */
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { companies, companySubscriptions, profiles } from '@/lib/db/schema'

type SubRow = typeof companySubscriptions.$inferSelect

/** Contexte de facturation (owner uniquement) : entreprise + owner + abonnement. */
export async function getOwnerBillingContext(
  actorId: string,
  companyId: string,
): Promise<
  | { error: 'Entreprise introuvable' | 'Non autorisé' }
  | { error: null; company: { id: string; name: string }; owner: { email: string; fullName: string } | null; subscription: SubRow | null }
> {
  const [company] = await db
    .select({ id: companies.id, name: companies.name, ownerId: companies.ownerId })
    .from(companies).where(eq(companies.id, companyId)).limit(1)
  if (!company) return { error: 'Entreprise introuvable' }
  if (company.ownerId !== actorId) return { error: 'Non autorisé' }

  const [owner] = await db
    .select({ email: profiles.email, fullName: profiles.fullName })
    .from(profiles).where(eq(profiles.id, actorId)).limit(1)

  const [subscription] = await db
    .select().from(companySubscriptions)
    .where(eq(companySubscriptions.companyId, companyId)).limit(1)

  return {
    error: null,
    company: { id: company.id, name: company.name },
    owner: owner ?? null,
    subscription: subscription ?? null,
  }
}

/** Met à jour l'état Stripe d'un abonnement (idempotent, utilisé par le webhook). */
export async function saveStripeState(
  companyId: string,
  data: {
    customerId?: string | null
    subscriptionId?: string | null
    status?: string
    planId?: string
    currentPeriodEnd?: Date | null
  },
): Promise<void> {
  const set: Record<string, unknown> = {}
  if (data.customerId !== undefined)       set.stripeCustomerId = data.customerId
  if (data.subscriptionId !== undefined)   set.stripeSubscriptionId = data.subscriptionId
  if (data.status !== undefined)           set.status = data.status
  if (data.planId !== undefined && data.planId) set.planId = data.planId
  if (data.currentPeriodEnd !== undefined) set.currentPeriodEnd = data.currentPeriodEnd
  if (Object.keys(set).length === 0) return
  await db.update(companySubscriptions).set(set).where(eq(companySubscriptions.companyId, companyId))
}

/** Retrouve l'entreprise liée à un abonnement Stripe (fallback webhook sans metadata). */
export async function getCompanyByStripeSubscription(subscriptionId: string): Promise<string | null> {
  const [row] = await db
    .select({ companyId: companySubscriptions.companyId })
    .from(companySubscriptions)
    .where(eq(companySubscriptions.stripeSubscriptionId, subscriptionId)).limit(1)
  return row?.companyId ?? null
}

/** Mappe un statut d'abonnement Stripe vers notre énumération. */
export function mapStripeStatus(s: string): string {
  switch (s) {
    case 'trialing':           return 'trial'
    case 'active':             return 'active'
    case 'past_due':           return 'past_due'
    case 'unpaid':             return 'expired'
    case 'canceled':           return 'cancelled'
    case 'incomplete_expired': return 'expired'
    default:                   return 'active'
  }
}
