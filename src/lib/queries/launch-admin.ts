/**
 * KAZAJOB — Administration de la campagne de lancement (Administration > Lancement).
 * Pilotage par état (state machine) + configuration, sans redéploiement ni variable
 * d'environnement, sans jamais toucher à Stripe ni aux abonnements payants existants.
 * Réservé au rôle admin. Concurrence optimiste (`version`) + audit systématique.
 */
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { launchCampaigns } from '@/lib/db/schema'
import { canTransitionCampaignState, effectiveCampaignStatus, type CampaignState, type EffectiveCampaignStatus } from '@/lib/launch'
import { serialize } from './_serialize'
import { writeAudit } from './audit'

export interface CampaignAdminRow {
  id: string; name: string; slug: string; state: CampaignState
  starts_at: string | null; ends_at: string | null; end_mode: string
  free_publishing_enabled: boolean; new_subscriptions_enabled: boolean
  jobs_allowed: boolean; trainings_allowed: boolean
  max_active_jobs_per_company: number; max_active_trainings_per_company: number
  grant_duration_days: number; require_admin_approval: boolean; auto_publish: boolean
  end_of_campaign_behavior: string; recruiter_message: string | null
  version: number; updated_at: string | null
  effective_status: EffectiveCampaignStatus
}

/** Toutes les campagnes (les plus récentes en premier) + leur statut effectif calculé. */
export async function listCampaignsAdmin(): Promise<CampaignAdminRow[]> {
  const rows = await db.select().from(launchCampaigns).orderBy(desc(launchCampaigns.updatedAt))
  return rows.map((c) => ({
    ...serialize<Omit<CampaignAdminRow, 'effective_status'>>(c),
    effective_status: effectiveCampaignStatus(c.state as CampaignState, c.startsAt, c.endsAt),
  }))
}

export interface CampaignCreateInput {
  name: string
  slug: string
  startsAt?: string | null
  endsAt?: string | null
  grantDurationDays?: number
  maxActiveJobsPerCompany?: number
  maxActiveTrainingsPerCompany?: number
  recruiterMessage?: string | null
}

/** Crée une nouvelle campagne à l'état DRAFT (jamais active d'emblée). Auditée. */
export async function createCampaign(
  actorId: string, actorEmail: string | null, input: CampaignCreateInput,
): Promise<{ id: string } | { error: string }> {
  const name = input.name.trim()
  const slug = input.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  if (!name || !slug) return { error: 'Nom et identifiant requis.' }

  const [existing] = await db.select({ id: launchCampaigns.id }).from(launchCampaigns).where(eq(launchCampaigns.slug, slug)).limit(1)
  if (existing) return { error: 'Cet identifiant de campagne existe déjà.' }

  const [created] = await db.insert(launchCampaigns).values({
    name, slug,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null,
    grantDurationDays: input.grantDurationDays ?? 90,
    maxActiveJobsPerCompany: input.maxActiveJobsPerCompany ?? 3,
    maxActiveTrainingsPerCompany: input.maxActiveTrainingsPerCompany ?? 3,
    recruiterMessage: input.recruiterMessage ?? null,
    createdBy: actorId, updatedBy: actorId,
  }).returning({ id: launchCampaigns.id })

  await writeAudit({
    actorId, actorEmail, action: 'launch_campaign.created', targetType: 'launch_campaign', targetId: created.id,
    newValues: { name, slug },
  })
  return { id: created.id }
}

export interface CampaignConfigPatch {
  name?: string
  startsAt?: string | null
  endsAt?: string | null
  endMode?: 'fixed_date' | 'manual'
  freePublishingEnabled?: boolean
  newSubscriptionsEnabled?: boolean
  jobsAllowed?: boolean
  trainingsAllowed?: boolean
  maxActiveJobsPerCompany?: number
  maxActiveTrainingsPerCompany?: number
  grantDurationDays?: number
  requireAdminApproval?: boolean
  autoPublish?: boolean
  endOfCampaignBehavior?: 'keep_until_listing_expiry' | 'cutoff_immediately'
  recruiterMessage?: string | null
}

const CONFIG_FIELDS: (keyof CampaignConfigPatch)[] = [
  'name', 'startsAt', 'endsAt', 'endMode', 'freePublishingEnabled', 'newSubscriptionsEnabled',
  'jobsAllowed', 'trainingsAllowed', 'maxActiveJobsPerCompany', 'maxActiveTrainingsPerCompany',
  'grantDurationDays', 'requireAdminApproval', 'autoPublish', 'endOfCampaignBehavior', 'recruiterMessage',
]

/** Met à jour la configuration d'une campagne (jamais son état — voir `transitionCampaignState`). */
export async function updateCampaignConfig(
  actorId: string, actorEmail: string | null, campaignId: string,
  patch: CampaignConfigPatch, expectedVersion: number,
): Promise<{ error: string | null }> {
  const [before] = await db.select().from(launchCampaigns).where(eq(launchCampaigns.id, campaignId)).limit(1)
  if (!before) return { error: 'Campagne introuvable.' }
  if (before.version !== expectedVersion) return { error: 'Cette campagne a été modifiée ailleurs — rechargez la page.' }

  const set: Record<string, unknown> = { updatedBy: actorId, updatedAt: new Date(), version: before.version + 1 }
  for (const k of CONFIG_FIELDS) {
    if (patch[k] === undefined) continue
    set[k] = (k === 'startsAt' || k === 'endsAt') ? (patch[k] ? new Date(patch[k] as string) : null) : patch[k]
  }

  await db.update(launchCampaigns).set(set).where(eq(launchCampaigns.id, campaignId))
  await writeAudit({
    actorId, actorEmail, action: 'launch_campaign.config_updated', targetType: 'launch_campaign', targetId: campaignId,
    oldValues: before, newValues: patch,
  })
  return { error: null }
}

/** Transition d'état (activer/mettre en pause/reprendre/terminer/annuler) — validée par la state machine, auditée. */
export async function transitionCampaignState(
  actorId: string, actorEmail: string | null, campaignId: string,
  toState: CampaignState, expectedVersion: number,
): Promise<{ error: string | null }> {
  const [before] = await db.select().from(launchCampaigns).where(eq(launchCampaigns.id, campaignId)).limit(1)
  if (!before) return { error: 'Campagne introuvable.' }
  if (before.version !== expectedVersion) return { error: 'Cette campagne a été modifiée ailleurs — rechargez la page.' }

  const fromState = before.state as CampaignState
  if (fromState === toState) return { error: null }
  if (!canTransitionCampaignState(fromState, toState)) {
    return { error: `Transition « ${fromState} → ${toState} » non autorisée.` }
  }

  await db.update(launchCampaigns)
    .set({ state: toState, updatedBy: actorId, updatedAt: new Date(), version: before.version + 1 })
    .where(eq(launchCampaigns.id, campaignId))

  await writeAudit({
    actorId, actorEmail, action: 'launch_campaign.state_changed', targetType: 'launch_campaign', targetId: campaignId,
    oldValues: { state: fromState }, newValues: { state: toState },
  })
  return { error: null }
}
