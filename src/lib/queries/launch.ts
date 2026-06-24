/**
 * KAZAJOB — Couche serveur de l'offre gratuite KazaLaunch.
 *
 * Garanties :
 * - L'activation ne passe JAMAIS par Stripe (aucun customer/subscription créé).
 * - Une seule activation par entreprise (contrainte unique sur launch_eligibility).
 * - Expiration à 3 mois calendaires, sans prélèvement automatique.
 * - Toutes les vérifications d'éligibilité sont faites côté serveur.
 */
import { and, eq, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { companies, companySubscriptions, jobs, launchEligibility, subscriptionPlans } from '@/lib/db/schema'
import { LAUNCH_PLAN_ID } from '@/lib/constants'
import {
  launchExpiry, launchGloballyAvailable, daysUntil, launchAlertLevel,
  type LaunchEligibility, type PlanAvailability,
} from '@/lib/launch'
import { writeAudit } from './audit'

/** Statuts d'abonnement payant incompatibles avec une activation gratuite. */
const ACTIVE_PAID_STATUSES = new Set(['trial', 'active', 'past_due'])

/** Ligne du plan KazaLaunch en base (flags de disponibilité pilotés par l'admin). */
async function getLaunchPlanRow(): Promise<PlanAvailability & { exists: boolean }> {
  const [p] = await db
    .select({
      isActive: subscriptionPlans.isActive, isPublic: subscriptionPlans.isPublic,
      isSelectable: subscriptionPlans.isSelectable, startsAt: subscriptionPlans.startsAt,
      endsAt: subscriptionPlans.endsAt,
    })
    .from(subscriptionPlans).where(eq(subscriptionPlans.id, LAUNCH_PLAN_ID)).limit(1)
  if (!p) return { exists: false, isActive: false, isPublic: false, isSelectable: false, startsAt: null, endsAt: null }
  return { exists: true, ...p }
}

export interface EligibilityResult {
  status:      LaunchEligibility
  expiresAt:   string | null   // aperçu de la date de fin si activé maintenant
  durationMonths: number
}

/**
 * Éligibilité d'une entreprise à KazaLaunch (décision 100 % serveur).
 * Ordre : disponibilité globale → identité entreprise → déjà utilisée → abonnement payant actif.
 */
export async function checkLaunchEligibility(companyId: string | null | undefined): Promise<EligibilityResult> {
  const out = (status: LaunchEligibility): EligibilityResult => ({ status, expiresAt: null, durationMonths: 3 })

  if (!companyId) return out('company_identity_required')

  const plan = await getLaunchPlanRow()
  if (!plan.exists) return out('offer_disabled')
  const avail = launchGloballyAvailable(plan)
  if (avail !== 'ok') return out(avail)

  const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, companyId)).limit(1)
  if (!company) return out('company_identity_required')

  // Déjà bénéficié ? (historique immuable, indépendant de l'abonnement courant)
  const [used] = await db.select({ id: launchEligibility.id })
    .from(launchEligibility).where(eq(launchEligibility.companyId, companyId)).limit(1)
  if (used) return out('already_used')

  // Abonnement payant actif incompatible ?
  const [sub] = await db.select({ planId: companySubscriptions.planId, status: companySubscriptions.status })
    .from(companySubscriptions).where(eq(companySubscriptions.companyId, companyId)).limit(1)
  if (sub && sub.planId !== LAUNCH_PLAN_ID && ACTIVE_PAID_STATUSES.has(sub.status)) {
    return out('active_paid_plan')
  }

  const previewExpiry = launchExpiry(new Date())
  return { status: 'eligible', expiresAt: previewExpiry.toISOString(), durationMonths: 3 }
}

export interface ActivationResult {
  ok:        boolean
  status:    LaunchEligibility | 'activated'
  expiresAt?: string
}

/**
 * Active KazaLaunch pour une entreprise (re-vérifie l'éligibilité côté serveur).
 * Idempotent vis-à-vis de l'historique : la contrainte unique empêche une 2ᵉ activation.
 */
export async function activateLaunch(
  companyId: string,
  actorId: string,
): Promise<ActivationResult> {
  const elig = await checkLaunchEligibility(companyId)
  if (elig.status !== 'eligible') return { ok: false, status: elig.status }

  const activatedAt = new Date()
  const expiresAt = launchExpiry(activatedAt)

  // 1. Historique immuable d'abord : si la ligne existe déjà → double activation refusée.
  const [siretRow] = await db.select({ siret: companies.siret }).from(companies).where(eq(companies.id, companyId)).limit(1)
  const inserted = await db.insert(launchEligibility).values({
    companyId, siret: siretRow?.siret ?? null, planSlug: LAUNCH_PLAN_ID,
    firstActivatedAt: activatedAt, expiresAt, status: 'active', activatedBy: actorId,
  }).onConflictDoNothing({ target: launchEligibility.companyId }).returning({ id: launchEligibility.id })

  if (inserted.length === 0) return { ok: false, status: 'already_used' }

  // 2. Abonnement applicatif gratuit (AUCUN appel Stripe).
  await db.insert(companySubscriptions).values({
    companyId, planId: LAUNCH_PLAN_ID, status: 'active', seatsUsed: 1,
    launchActivatedAt: activatedAt, launchExpiresAt: expiresAt,
  }).onConflictDoUpdate({
    target: companySubscriptions.companyId,
    set: { planId: LAUNCH_PLAN_ID, status: 'active', launchActivatedAt: activatedAt, launchExpiresAt: expiresAt },
  })

  await writeAudit({
    actorId, action: 'launch_plan.activated', targetType: 'company', targetId: companyId,
    newValues: { planId: LAUNCH_PLAN_ID, activatedAt: activatedAt.toISOString(), expiresAt: expiresAt.toISOString() },
  })

  return { ok: true, status: 'activated', expiresAt: expiresAt.toISOString() }
}

export interface LaunchStatus {
  active:      boolean
  activatedAt: string | null
  expiresAt:   string | null
  daysLeft:    number
  alertLevel:  ReturnType<typeof launchAlertLevel>
  expired:     boolean
}

/** État KazaLaunch d'une entreprise pour le dashboard (compte à rebours réel). */
export async function getLaunchStatus(companyId: string): Promise<LaunchStatus | null> {
  const [sub] = await db.select({
    planId: companySubscriptions.planId, status: companySubscriptions.status,
    activatedAt: companySubscriptions.launchActivatedAt, expiresAt: companySubscriptions.launchExpiresAt,
  }).from(companySubscriptions).where(eq(companySubscriptions.companyId, companyId)).limit(1)

  if (!sub || sub.planId !== LAUNCH_PLAN_ID || !sub.expiresAt) return null
  const expiresAt = sub.expiresAt
  const daysLeft = daysUntil(expiresAt)
  const expired = sub.status === 'expired' || daysLeft <= 0
  return {
    active: !expired,
    activatedAt: sub.activatedAt?.toISOString() ?? null,
    expiresAt: expiresAt.toISOString(),
    daysLeft,
    alertLevel: expired ? 'expired' : launchAlertLevel(daysLeft),
    expired,
  }
}

/**
 * Cron : passe au statut `expired` les abonnements KazaLaunch dont la date de fin
 * est dépassée. Ne supprime aucune donnée, ne crée aucun prélèvement. Idempotent.
 * Renvoie le nombre d'abonnements expirés.
 */
export async function expireLaunchSubscriptions(now: Date = new Date()): Promise<number> {
  const expiredSubs = await db.update(companySubscriptions)
    .set({ status: 'expired' })
    .where(and(
      eq(companySubscriptions.planId, LAUNCH_PLAN_ID),
      eq(companySubscriptions.status, 'active'),
      lt(companySubscriptions.launchExpiresAt, now),
    ))
    .returning({ companyId: companySubscriptions.companyId })

  if (expiredSubs.length > 0) {
    await db.update(launchEligibility)
      .set({ status: 'expired' })
      .where(and(eq(launchEligibility.status, 'active'), lt(launchEligibility.expiresAt, now)))
    await writeAudit({ action: 'launch_plan.auto_expired', targetType: 'system', newValues: { count: expiredSubs.length } })
  }
  return expiredSubs.length
}

/** Compteurs d'impact pour l'administration (avant désactivation/migration). */
export async function getLaunchUsage(): Promise<{ companies: number; activeJobs: number }> {
  const [{ value: companiesCount }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(companySubscriptions)
    .where(eq(companySubscriptions.planId, LAUNCH_PLAN_ID))

  const [{ value: activeJobs }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(jobs)
    .innerJoin(companySubscriptions, eq(jobs.companyId, companySubscriptions.companyId))
    .where(and(eq(companySubscriptions.planId, LAUNCH_PLAN_ID), eq(jobs.isActive, true)))

  return { companies: companiesCount, activeJobs }
}
