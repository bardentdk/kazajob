/**
 * KAZAJOB — Moteur central de droits (entitlements).
 *
 * Source de vérité UNIQUE des fonctionnalités et limites par forfait.
 * Côté serveur uniquement pour les getters DB ; les helpers purs sont isomorphes.
 *
 * À réutiliser partout (routes API, composants serveur, scripts) au lieu de
 * redériver les droits à la main. Le masquage d'un bouton dans l'UI ne protège
 * rien : les mutations sensibles DOIVENT appeler assertFeatureAccess / assertUsageLimit.
 */
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { companySubscriptions } from '@/lib/db/schema'
import { SUBSCRIPTION_PLANS, LAUNCH_PLAN_ID, type SubscriptionPlan } from '@/lib/constants'

// ── Clés de fonctionnalités typées ────────────────────────────────
export const FEATURES = {
  jobActiveLimit:        'job.active_limit',
  recruiterSeatLimit:    'recruiter.seat_limit',
  applicationsReceive:   'applications.receive',
  messagingAccess:       'messaging.access',
  pipelineBasic:         'pipeline.basic',
  analyticsBasic:        'analytics.basic',
  analyticsAdvanced:     'analytics.advanced',
  kazascoreRecruiter:    'kazascore.recruiter',
  matchingStandard:      'matching.standard',
  aiApplicationSummary:  'ai.application_summary',
  teamManagement:        'team.management',
  rolesAdvanced:         'roles.advanced',
  candidateDbBasic:      'candidate_database.basic',
  candidateDbAdvanced:   'candidate_database.advanced',
  apiAccess:             'api.access',
  atsIntegration:        'ats.integration',
  supportPriority:       'support.priority',
  supportSla24h:         'support.sla_24h',
  accountMultiCompany:   'account.multi_company',
} as const

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES]

// ── Fonctionnalités communes à tous les forfaits (gratuit inclus) ─
const BASE_FEATURES: FeatureKey[] = [
  FEATURES.applicationsReceive,
  FEATURES.messagingAccess,
  FEATURES.pipelineBasic,
  FEATURES.analyticsBasic,
  FEATURES.kazascoreRecruiter,
  FEATURES.matchingStandard,
]

// Construites de façon incrémentale (chaque palier hérite du précédent).
const PRO_FEATURES: FeatureKey[] = [
  ...BASE_FEATURES,
  FEATURES.analyticsAdvanced,
  FEATURES.aiApplicationSummary,
  FEATURES.teamManagement,
  FEATURES.candidateDbBasic,
  FEATURES.supportPriority,
]
const BUSINESS_FEATURES: FeatureKey[] = [
  ...PRO_FEATURES,
  FEATURES.rolesAdvanced,
  FEATURES.candidateDbAdvanced,
  FEATURES.supportSla24h,
]
const ENTERPRISE_FEATURES: FeatureKey[] = [
  ...BUSINESS_FEATURES,
  FEATURES.apiAccess,
  FEATURES.atsIntegration,
  FEATURES.accountMultiCompany,
]

/** Matrice forfait → fonctionnalités autorisées. */
const PLAN_FEATURES: Record<string, FeatureKey[]> = {
  [LAUNCH_PLAN_ID]: BASE_FEATURES,
  starter:          BASE_FEATURES,
  pro:              PRO_FEATURES,
  business:         BUSINESS_FEATURES,
  enterprise:       ENTERPRISE_FEATURES,
}

/** Statuts d'abonnement applicatif qui coupent l'accès en écriture. */
const READ_ONLY_STATUSES = new Set(['expired', 'cancelled'])

export interface PlanEntitlements {
  planId:      string
  planName:    string
  isFree:      boolean
  maxJobs:     number   // -1 = illimité
  maxMembers:  number   // -1 = illimité
  features:    Set<FeatureKey>
}

const planById = (slug?: string | null): SubscriptionPlan | undefined =>
  SUBSCRIPTION_PLANS.find((p) => p.id === slug)

/** Forfait de repli si l'entreprise n'a aucun abonnement : Starter (le plus restrictif payant). */
const FALLBACK_PLAN: SubscriptionPlan = planById('starter') ?? SUBSCRIPTION_PLANS[0]

/** Droits dérivés d'un slug de forfait (pur, sans DB). */
export function resolvePlanEntitlements(planSlug?: string | null): PlanEntitlements {
  const plan = planById(planSlug) ?? FALLBACK_PLAN
  return {
    planId:     plan.id,
    planName:   plan.name,
    isFree:     plan.isFree,
    maxJobs:    plan.maxJobs,
    maxMembers: plan.maxMembers,
    features:   new Set(PLAN_FEATURES[plan.id] ?? BASE_FEATURES),
  }
}

/** Un forfait (par slug) autorise-t-il la fonctionnalité ? (pur) */
export function planHasFeature(planSlug: string | null | undefined, feature: FeatureKey): boolean {
  return resolvePlanEntitlements(planSlug).features.has(feature)
}

export interface CompanyEntitlements extends PlanEntitlements {
  status:     string | null
  readOnly:   boolean   // true → publication/écriture coupée (essai/abonnement terminé)
}

/** Droits effectifs d'une entreprise (lecture DB de son abonnement). */
export async function getCompanyEntitlements(companyId: string): Promise<CompanyEntitlements> {
  const [sub] = await db
    .select({ planId: companySubscriptions.planId, status: companySubscriptions.status })
    .from(companySubscriptions)
    .where(eq(companySubscriptions.companyId, companyId))
    .limit(1)
  const base = resolvePlanEntitlements(sub?.planId)
  return {
    ...base,
    status:   sub?.status ?? null,
    readOnly: sub ? READ_ONLY_STATUSES.has(sub.status) : false,
  }
}

/** L'entreprise peut-elle utiliser la fonctionnalité ? (DB) */
export async function canUseFeature(companyId: string, feature: FeatureKey): Promise<boolean> {
  const ent = await getCompanyEntitlements(companyId)
  return ent.features.has(feature)
}

export interface AccessResult {
  ok:       boolean
  reason?:  'forbidden' | 'read_only'
  planName: string
  feature:  FeatureKey
}

/**
 * Vérifie un droit fonctionnel côté serveur. À appeler avant toute mutation/lecture sensible.
 * Ne lève pas : renvoie un résultat exploitable pour répondre 402/403 avec contexte.
 */
export async function assertFeatureAccess(companyId: string, feature: FeatureKey): Promise<AccessResult> {
  const ent = await getCompanyEntitlements(companyId)
  return { ok: ent.features.has(feature), reason: ent.features.has(feature) ? undefined : 'forbidden', planName: ent.planName, feature }
}

export interface UsageResult {
  ok:       boolean
  max:      number
  used:     number
  planName: string
  reason?:  'limit' | 'read_only'
}

/**
 * Vérifie une limite de consommation (offres actives / sièges) côté serveur.
 * `count` = nombre actuellement consommé (fourni par l'appelant pour rester découplé du domaine).
 */
export async function assertUsageLimit(
  companyId: string,
  resource: 'job.active' | 'recruiter.seat',
  used: number,
): Promise<UsageResult> {
  const ent = await getCompanyEntitlements(companyId)
  if (ent.readOnly) return { ok: false, max: 0, used, planName: ent.planName, reason: 'read_only' }
  const max = resource === 'job.active' ? ent.maxJobs : ent.maxMembers
  if (max === -1) return { ok: true, max: -1, used, planName: ent.planName }
  return { ok: used < max, max, used, planName: ent.planName, reason: 'limit' }
}
