/**
 * KAZAJOB — Couche serveur de la campagne de lancement (accès gratuit temporaire).
 *
 * Garanties :
 * - L'activation ne passe JAMAIS par Stripe (aucun customer/subscription créé,
 *   aucune ligne `company_subscriptions` insérée).
 * - Une seule activation par (entreprise, campagne) — contrainte unique en base.
 * - Au plus une campagne ACTIVE par entreprise à la fois (index partiel en base).
 * - Toutes les vérifications d'éligibilité sont faites côté serveur.
 *
 * Une campagne n'est PAS un forfait commercial : voir src/lib/entitlements.ts
 * (`resolvePublishingAccess`) pour la décision de publication qui la combine
 * aux abonnements payants.
 */
import { and, desc, eq, isNotNull, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { companies, companySubscriptions, jobs, launchCampaignEnrollments, launchCampaigns, notifications, trainingOffers } from '@/lib/db/schema'
import {
  daysUntil, launchAlertLevel, dueLaunchReminder, effectiveCampaignStatus,
  type LaunchEligibility, type CampaignState,
} from '@/lib/launch'
import { writeAudit } from './audit'

/** Statuts d'abonnement payant incompatibles avec une activation gratuite. */
const ACTIVE_PAID_STATUSES = new Set(['trial', 'active', 'past_due'])

type CampaignRow = typeof launchCampaigns.$inferSelect

/**
 * La campagne « courante » : celle qui est effectivement ACTIVE, sinon la prochaine
 * SCHEDULED, sinon aucune. Peu de campagnes existent en base (quelques unités sur
 * la durée de vie du produit) → filtrage en mémoire, pas besoin de SQL avancé.
 */
async function getCurrentCampaign(now: Date = new Date()): Promise<CampaignRow | null> {
  const rows = await db.select().from(launchCampaigns).orderBy(desc(launchCampaigns.updatedAt))
  const withStatus = rows.map((c) => ({ c, status: effectiveCampaignStatus(c.state as CampaignState, c.startsAt, c.endsAt, now) }))
  const active = withStatus.find((r) => r.status === 'active')
  if (active) return active.c
  const scheduled = withStatus
    .filter((r) => r.status === 'scheduled')
    .sort((a, b) => (a.c.startsAt?.getTime() ?? 0) - (b.c.startsAt?.getTime() ?? 0))
  return scheduled[0]?.c ?? null
}

/**
 * Les nouveaux abonnements Stripe sont-ils autorisés ? Une campagne active peut
 * suspendre temporairement les nouvelles souscriptions payantes (`new_subscriptions_enabled`)
 * pour orienter les entreprises vers l'accès gratuit pendant la période de lancement.
 * N'affecte jamais les abonnements déjà existants (renouvellement, changement de forfait géré ailleurs).
 */
export async function checkNewSubscriptionsAllowed(): Promise<{ allowed: boolean; campaignName: string | null }> {
  const campaign = await getCurrentCampaign()
  if (!campaign) return { allowed: true, campaignName: null }
  const status = effectiveCampaignStatus(campaign.state as CampaignState, campaign.startsAt, campaign.endsAt)
  if (status !== 'active') return { allowed: true, campaignName: null }
  return { allowed: campaign.newSubscriptionsEnabled, campaignName: campaign.name }
}

export interface ActiveCampaignEnrollment {
  campaignId:                    string
  campaignName:                  string
  jobsAllowed:                   boolean
  trainingsAllowed:              boolean
  maxActiveJobsPerCompany:       number
  maxActiveTrainingsPerCompany:  number
  freePublishingEnabled:         boolean
  effectiveActive:               boolean   // tient compte de endOfCampaignBehavior
  expiresAt:                     Date
}

/**
 * Enrôlement actif d'une entreprise (au plus un, garanti par l'index partiel en base).
 * Utilisé par `resolvePublishingAccess` (entitlements.ts) — ne fait AUCUNE décision
 * métier ici, se contente de restituer l'état brut + le statut effectif de la campagne.
 */
export async function getActiveCampaignEnrollment(companyId: string, now: Date = new Date()): Promise<ActiveCampaignEnrollment | null> {
  const [row] = await db
    .select({ enrollment: launchCampaignEnrollments, campaign: launchCampaigns })
    .from(launchCampaignEnrollments)
    .innerJoin(launchCampaigns, eq(launchCampaignEnrollments.campaignId, launchCampaigns.id))
    .where(and(eq(launchCampaignEnrollments.companyId, companyId), eq(launchCampaignEnrollments.status, 'active')))
    .limit(1)
  if (!row) return null

  const { enrollment, campaign } = row
  if (now >= enrollment.expiresAt) return null

  const campaignStatus = effectiveCampaignStatus(campaign.state as CampaignState, campaign.startsAt, campaign.endsAt, now)
  // `keep_until_listing_expiry` (défaut) : l'entreprise garde l'accès jusqu'à SA propre
  // expiration, même si la campagne globale est terminée. `cutoff_immediately` : l'accès
  // s'arrête dès que la campagne n'est plus active/paused, sans attendre l'expiration individuelle.
  const effectiveActive = campaign.endOfCampaignBehavior === 'cutoff_immediately'
    ? (campaignStatus === 'active' || campaignStatus === 'paused')
    : true

  return {
    campaignId: campaign.id, campaignName: campaign.name,
    jobsAllowed: campaign.jobsAllowed, trainingsAllowed: campaign.trainingsAllowed,
    maxActiveJobsPerCompany: campaign.maxActiveJobsPerCompany,
    maxActiveTrainingsPerCompany: campaign.maxActiveTrainingsPerCompany,
    freePublishingEnabled: campaign.freePublishingEnabled,
    effectiveActive,
    expiresAt: enrollment.expiresAt,
  }
}

export interface EligibilityResult {
  status:         LaunchEligibility
  expiresAt:      string | null   // aperçu de la date de fin si activé maintenant
  campaignId?:    string
  campaignName?:  string
}

/**
 * Éligibilité d'une entreprise à la campagne courante (décision 100 % serveur).
 * Ordre : disponibilité de la campagne → identité entreprise → déjà enrôlée → abonnement payant actif.
 */
export async function checkLaunchEligibility(companyId: string | null | undefined): Promise<EligibilityResult> {
  const out = (status: LaunchEligibility): EligibilityResult => ({ status, expiresAt: null })

  if (!companyId) return out('company_identity_required')

  const campaign = await getCurrentCampaign()
  if (!campaign) return out('offer_disabled')
  const status = effectiveCampaignStatus(campaign.state as CampaignState, campaign.startsAt, campaign.endsAt)
  if (status === 'scheduled') return out('offer_not_started')
  if (status === 'ended' || status === 'cancelled') return out('offer_ended')
  if (status === 'draft' || status === 'paused' || !campaign.freePublishingEnabled) return out('offer_disabled')

  const [company] = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, companyId)).limit(1)
  if (!company) return out('company_identity_required')

  // Déjà enrôlée dans CETTE campagne ? (historique immuable, contrainte unique en base)
  const [used] = await db.select({ id: launchCampaignEnrollments.id })
    .from(launchCampaignEnrollments)
    .where(and(eq(launchCampaignEnrollments.companyId, companyId), eq(launchCampaignEnrollments.campaignId, campaign.id)))
    .limit(1)
  if (used) return out('already_used')

  // Abonnement payant actif incompatible ?
  const [sub] = await db.select({ status: companySubscriptions.status })
    .from(companySubscriptions).where(eq(companySubscriptions.companyId, companyId)).limit(1)
  if (sub && ACTIVE_PAID_STATUSES.has(sub.status)) return out('active_paid_plan')

  const previewExpiry = new Date(Date.now() + campaign.grantDurationDays * 86_400_000)
  return { status: 'eligible', expiresAt: previewExpiry.toISOString(), campaignId: campaign.id, campaignName: campaign.name }
}

export interface ActivationResult {
  ok:        boolean
  status:    LaunchEligibility | 'activated'
  expiresAt?: string
}

/**
 * Enrôle une entreprise dans la campagne courante (re-vérifie l'éligibilité côté serveur).
 * AUCUN appel Stripe, AUCUNE ligne `company_subscriptions` créée.
 * Idempotent vis-à-vis de l'historique : la contrainte unique empêche une 2ᵉ activation.
 */
export async function activateLaunch(companyId: string, actorId: string): Promise<ActivationResult> {
  const elig = await checkLaunchEligibility(companyId)
  if (elig.status !== 'eligible' || !elig.campaignId) return { ok: false, status: elig.status }

  const [campaign] = await db.select().from(launchCampaigns).where(eq(launchCampaigns.id, elig.campaignId)).limit(1)
  if (!campaign) return { ok: false, status: 'offer_disabled' }

  const activatedAt = new Date()
  const expiresAt = new Date(activatedAt.getTime() + campaign.grantDurationDays * 86_400_000)

  const [siretRow] = await db.select({ siret: companies.siret }).from(companies).where(eq(companies.id, companyId)).limit(1)
  const inserted = await db.insert(launchCampaignEnrollments).values({
    campaignId: campaign.id, companyId, siret: siretRow?.siret ?? null,
    firstActivatedAt: activatedAt, expiresAt, status: 'active', activatedBy: actorId,
  }).onConflictDoNothing({ target: [launchCampaignEnrollments.companyId, launchCampaignEnrollments.campaignId] })
    .returning({ id: launchCampaignEnrollments.id })

  if (inserted.length === 0) return { ok: false, status: 'already_used' }

  await writeAudit({
    actorId, action: 'launch_campaign.enrolled', targetType: 'company', targetId: companyId,
    newValues: { campaignId: campaign.id, activatedAt: activatedAt.toISOString(), expiresAt: expiresAt.toISOString() },
  })

  return { ok: true, status: 'activated', expiresAt: expiresAt.toISOString() }
}

export interface LaunchStatus {
  active:        boolean
  activatedAt:   string | null
  expiresAt:     string | null
  daysLeft:      number
  alertLevel:    ReturnType<typeof launchAlertLevel>
  expired:       boolean
  campaignName:  string
  jobsMax:       number
  trainingsMax:  number
}

/** État de campagne d'une entreprise pour le dashboard (compte à rebours réel). */
export async function getLaunchStatus(companyId: string): Promise<LaunchStatus | null> {
  const [row] = await db
    .select({ enrollment: launchCampaignEnrollments, campaign: launchCampaigns })
    .from(launchCampaignEnrollments)
    .innerJoin(launchCampaigns, eq(launchCampaignEnrollments.campaignId, launchCampaigns.id))
    .where(and(eq(launchCampaignEnrollments.companyId, companyId), eq(launchCampaignEnrollments.status, 'active')))
    .limit(1)
  if (!row) return null

  const { enrollment, campaign } = row
  const daysLeft = daysUntil(enrollment.expiresAt)
  const expired = daysLeft <= 0
  return {
    active: !expired,
    activatedAt: enrollment.firstActivatedAt.toISOString(),
    expiresAt: enrollment.expiresAt.toISOString(),
    daysLeft,
    alertLevel: expired ? 'expired' : launchAlertLevel(daysLeft),
    expired,
    campaignName: campaign.name,
    jobsMax: campaign.maxActiveJobsPerCompany,
    trainingsMax: campaign.maxActiveTrainingsPerCompany,
  }
}

/**
 * Cron : passe au statut `expired` les enrôlements de campagne dont la date de fin
 * est dépassée. Ne supprime aucune donnée, ne crée aucun prélèvement. Idempotent.
 * Renvoie le nombre d'enrôlements expirés.
 */
export async function expireLaunchSubscriptions(now: Date = new Date()): Promise<number> {
  const expired = await db.update(launchCampaignEnrollments)
    .set({ status: 'expired' })
    .where(and(eq(launchCampaignEnrollments.status, 'active'), lt(launchCampaignEnrollments.expiresAt, now)))
    .returning({ companyId: launchCampaignEnrollments.companyId })

  if (expired.length > 0) {
    await writeAudit({ action: 'launch_campaign.auto_expired', targetType: 'system', newValues: { count: expired.length } })
  }
  return expired.length
}

/**
 * Cron : envoie les rappels d'expiration de campagne (paliers configurables par
 * campagne, défaut J-30/15/7/3/1/0) en notification in-app, sans doublon (clé
 * d'idempotence = palier stocké dans last_reminder_milestone).
 * Renvoie le nombre de rappels envoyés.
 */
export async function processLaunchReminders(now: Date = new Date()): Promise<number> {
  const rows = await db.select({
    companyId: launchCampaignEnrollments.companyId,
    expiresAt: launchCampaignEnrollments.expiresAt,
    lastReminder: launchCampaignEnrollments.lastReminderMilestone,
    reminderDays: launchCampaigns.reminderDaysBeforeEnd,
    campaignName: launchCampaigns.name,
    ownerId: companies.ownerId,
  })
    .from(launchCampaignEnrollments)
    .innerJoin(launchCampaigns, eq(launchCampaignEnrollments.campaignId, launchCampaigns.id))
    .innerJoin(companies, eq(launchCampaignEnrollments.companyId, companies.id))
    .where(and(eq(launchCampaignEnrollments.status, 'active'), isNotNull(launchCampaignEnrollments.expiresAt)))

  let sent = 0
  for (const r of rows) {
    if (!r.ownerId) continue
    const daysLeft = daysUntil(r.expiresAt, now)
    const palier = dueLaunchReminder(daysLeft, r.lastReminder ?? null, r.reminderDays)
    if (palier === null) continue

    const dateStr = r.expiresAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const title = palier === 0 ? `${r.campaignName} expire aujourd'hui` : `${r.campaignName} expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`
    const message = `Votre accès gratuit se termine le ${dateStr}. À cette date, la publication de nouvelles offres/formations sera bloquée jusqu'au choix d'un forfait payant. Vos candidatures et données restent accessibles. Aucun prélèvement automatique n'aura lieu.`

    await db.insert(notifications).values({
      userId: r.ownerId, type: 'launch_reminder', title, message,
      link: '/recruiter/company', data: { palier, expiresAt: r.expiresAt.toISOString() },
    })
    await db.update(launchCampaignEnrollments)
      .set({ lastReminderMilestone: palier })
      .where(and(eq(launchCampaignEnrollments.companyId, r.companyId), eq(launchCampaignEnrollments.status, 'active')))
    sent++
  }
  return sent
}

/** Compteurs d'impact pour l'administration (avant pause/extension/arrêt d'une campagne). */
export async function getLaunchUsage(campaignId?: string): Promise<{ companies: number; activeJobs: number; activeTrainings: number }> {
  const scope = campaignId
    ? and(eq(launchCampaignEnrollments.status, 'active'), eq(launchCampaignEnrollments.campaignId, campaignId))
    : eq(launchCampaignEnrollments.status, 'active')

  const [{ value: companiesCount }] = await db
    .select({ value: countAll() })
    .from(launchCampaignEnrollments)
    .where(scope)

  const [{ value: activeJobs }] = await db
    .select({ value: countAll() })
    .from(jobs)
    .innerJoin(launchCampaignEnrollments, eq(jobs.companyId, launchCampaignEnrollments.companyId))
    .where(and(scope, eq(jobs.isActive, true)))

  const [{ value: activeTrainings }] = await db
    .select({ value: countAll() })
    .from(trainingOffers)
    .innerJoin(launchCampaignEnrollments, eq(trainingOffers.companyId, launchCampaignEnrollments.companyId))
    .where(and(scope, eq(trainingOffers.isActive, true)))

  return { companies: companiesCount, activeJobs, activeTrainings }
}

function countAll() {
  return sql<number>`count(*)::int`
}
