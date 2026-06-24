/**
 * KAZAJOB — Administration des forfaits (Monétisation > Forfaits).
 * Réservé au rôle admin (super admin). Toute modification est auditée.
 */
import { asc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { subscriptionPlans } from '@/lib/db/schema'
import { serialize } from './_serialize'
import { writeAudit } from './audit'
import { getLaunchUsage } from './launch'

export interface AdminPlanRow {
  id: string; name: string; price_cts: number; max_jobs: number; max_members: number
  is_free: boolean; is_active: boolean; is_public: boolean; is_selectable: boolean
  is_featured: boolean; requires_payment_method: boolean; duration_months: number
  sort_order: number; starts_at: string | null; ends_at: string | null; updated_at: string | null
}

/** Tous les forfaits (ordre d'affichage) + impact KazaLaunch. */
export async function listPlansAdmin(): Promise<{ plans: AdminPlanRow[]; launchUsage: { companies: number; activeJobs: number } }> {
  const rows = await db.select().from(subscriptionPlans).orderBy(asc(subscriptionPlans.sortOrder))
  const launchUsage = await getLaunchUsage()
  return { plans: serialize<AdminPlanRow[]>(rows), launchUsage }
}

/** Champs modifiables par l'administration (jamais le prix/limite côté API publique). */
export interface PlanSettingsPatch {
  isActive?:     boolean
  isPublic?:     boolean
  isSelectable?: boolean
  isFeatured?:   boolean
  sortOrder?:    number
  startsAt?:     string | null
  endsAt?:       string | null
}

const ALLOWED: (keyof PlanSettingsPatch)[] = [
  'isActive', 'isPublic', 'isSelectable', 'isFeatured', 'sortOrder', 'startsAt', 'endsAt',
]

/** Met à jour la disponibilité d'un forfait (audité). */
export async function updatePlanSettings(
  actorId: string,
  actorEmail: string | null,
  planId: string,
  patch: PlanSettingsPatch,
): Promise<{ error: string | null }> {
  const [before] = await db.select().from(subscriptionPlans).where(eq(subscriptionPlans.id, planId)).limit(1)
  if (!before) return { error: 'Forfait introuvable' }

  const set: Record<string, unknown> = { updatedBy: actorId, updatedAt: new Date() }
  for (const k of ALLOWED) {
    if (patch[k] === undefined) continue
    if (k === 'startsAt' || k === 'endsAt') {
      set[k] = patch[k] ? new Date(patch[k] as string) : null
    } else {
      set[k] = patch[k]
    }
  }

  await db.update(subscriptionPlans).set(set).where(eq(subscriptionPlans.id, planId))

  await writeAudit({
    actorId, actorEmail, action: 'launch_plan.settings_updated', targetType: 'plan', targetId: planId,
    oldValues: {
      isActive: before.isActive, isPublic: before.isPublic, isSelectable: before.isSelectable,
      isFeatured: before.isFeatured, sortOrder: before.sortOrder,
      startsAt: before.startsAt, endsAt: before.endsAt,
    },
    newValues: patch,
  })
  return { error: null }
}
