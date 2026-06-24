/**
 * KAZAJOB — Données système réutilisables (seed idempotent + recréation admin).
 * Importé par seed.ts, seed-admin.ts et le script de reset. Aucun secret en dur.
 */
import bcrypt from 'bcryptjs'
import { eq, ne, and } from 'drizzle-orm'
import { db } from './index'
import { profiles, skills, subscriptionPlans } from './schema'
import { SUBSCRIPTION_PLANS } from '../constants'
import { PROFESSION_CATEGORIES } from '../onboarding-categories'

/** (Ré)injecte les forfaits (KazaLaunch inclus) + le référentiel de compétences. Idempotent. */
export async function seedSystemData(): Promise<{ plans: number; skills: number }> {
  for (const p of SUBSCRIPTION_PLANS) {
    await db.insert(subscriptionPlans).values({
      id: p.id, name: p.name, priceCts: p.priceCts, maxMembers: p.maxMembers,
      maxJobs: p.maxJobs, partners: p.partners, apiAccess: p.apiAccess,
      trialDays: p.trialDays, highlight: p.highlight, isActive: true,
      isFree: p.isFree, requiresPaymentMethod: p.requiresPaymentMethod,
      durationMonths: p.durationMonths, sortOrder: p.sortOrder,
      isPublic: true, isSelectable: true, isFeatured: p.highlight,
    }).onConflictDoUpdate({
      target: subscriptionPlans.id,
      set: {
        name: p.name, priceCts: p.priceCts, maxMembers: p.maxMembers, maxJobs: p.maxJobs,
        partners: p.partners, apiAccess: p.apiAccess, trialDays: p.trialDays, highlight: p.highlight,
        isFree: p.isFree, requiresPaymentMethod: p.requiresPaymentMethod,
        durationMonths: p.durationMonths, sortOrder: p.sortOrder, updatedAt: new Date(),
      },
    })
  }
  const names = [...new Set(PROFESSION_CATEGORIES.flatMap((c) => c.skills))]
  for (const name of names) {
    await db.insert(skills).values({ name }).onConflictDoNothing()
  }
  return { plans: SUBSCRIPTION_PLANS.length, skills: names.length }
}

export interface AdminInput {
  email:    string
  password: string
  fullName?: string
  role?:    string
}

export interface AdminResult {
  email:   string
  id:      string
  created: boolean
}

/**
 * Crée OU met à jour l'unique compte administrateur (idempotent).
 * - Hash bcrypt du mot de passe (jamais journalisé).
 * - Email vérifié/normalisé, rôle admin (super admin de la plateforme).
 * - Ne crée jamais deux admins : upsert par email.
 */
export async function upsertAdmin(input: AdminInput): Promise<AdminResult> {
  const email = input.email.toLowerCase().trim()
  if (!email || !input.password) throw new Error('Email et mot de passe administrateur requis.')
  if (input.password.length < 8) throw new Error('Mot de passe administrateur trop court (min. 8 caractères).')

  const passwordHash = await bcrypt.hash(input.password, 10)
  const fullName = input.fullName?.trim() || 'Admin Kazajob'
  const role = input.role || 'admin'

  const [existing] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, email)).limit(1)
  if (existing) {
    await db.update(profiles).set({ role, passwordHash, fullName, onboardingCompleted: true }).where(eq(profiles.id, existing.id))
    return { email, id: existing.id, created: false }
  }
  const [created] = await db.insert(profiles)
    .values({ email, passwordHash, fullName, role, onboardingCompleted: true })
    .returning({ id: profiles.id })
  return { email, id: created.id, created: true }
}

/** Vérifie qu'il existe exactement un admin (l'email attendu) et aucun autre. */
export async function assertSingleAdmin(expectedEmail: string): Promise<{ ok: boolean; admins: number; strays: string[] }> {
  const email = expectedEmail.toLowerCase().trim()
  const admins = await db.select({ email: profiles.email }).from(profiles).where(eq(profiles.role, 'admin'))
  const strays = admins.map((a) => a.email).filter((e) => e.toLowerCase() !== email)
  return { ok: admins.length === 1 && strays.length === 0, admins: admins.length, strays }
}

/** Supprime tout autre compte admin que celui attendu (réconciliation). */
export async function pruneOtherAdmins(expectedEmail: string): Promise<number> {
  const email = expectedEmail.toLowerCase().trim()
  const removed = await db.delete(profiles)
    .where(and(eq(profiles.role, 'admin'), ne(profiles.email, email)))
    .returning({ email: profiles.email })
  return removed.length
}
