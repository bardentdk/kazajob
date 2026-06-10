/**
 * KAZAJOB — Requêtes Drizzle pour les entreprises et la gestion d'équipe.
 * Couche serveur. Les mutations d'équipe vérifient que l'acteur est owner/admin.
 */
import { and, eq, ilike, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  companies, companyJoinRequests, companyMembers, companySubscriptions, jobs, profiles,
} from '@/lib/db/schema'
import type { Company, CompanyJoinRequest, CompanyMember, CompanySubscription } from '@/lib/types'
import { serialize } from './_serialize'

const MEMBER_PROFILE = { fullName: true, email: true, avatarUrl: true } as const

/** Recherche d'entreprises par nom (max 6). */
export async function searchCompanies(q: string): Promise<Company[]> {
  if (q.trim().length < 2) return []
  const rows = await db
    .select()
    .from(companies)
    .where(ilike(companies.name, `%${q}%`))
    .limit(6)
  return serialize<Company[]>(rows)
}

/** Vue d'ensemble d'une entreprise : infos + abonnement + compteurs. */
export async function getCompanyOverview(companyId: string): Promise<{
  company: Company | null
  subscription: CompanySubscription | null
  member_count: number
  job_count: number
}> {
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1)
  if (!company) return { company: null, subscription: null, member_count: 0, job_count: 0 }

  const [sub] = await db
    .select().from(companySubscriptions)
    .where(eq(companySubscriptions.companyId, companyId)).limit(1)

  const [{ value: memberCount }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.status, 'active')))

  const [{ value: jobCount }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.isActive, true)))

  return {
    company: serialize<Company>(company),
    subscription: sub ? serialize<CompanySubscription>(sub) : null,
    member_count: memberCount,
    job_count: jobCount,
  }
}

/** Crée une entreprise, ajoute l'owner et rattache son profil. */
export async function createCompany(
  ownerId: string,
  data: Record<string, unknown>,
  logoUrl: string | null,
): Promise<Company> {
  const [company] = await db.insert(companies).values({
    ownerId,
    name:        String(data.name ?? '').trim(),
    legalName:   (data.legal_name as string)?.trim() || null,
    siret:       (data.siret as string)?.trim() || null,
    sector:      (data.sector as string) || null,
    size:        (data.size as string) || null,
    website:     (data.website as string)?.trim() || null,
    description: (data.description as string)?.trim() || null,
    location:    (data.location as string)?.trim() || null,
    address:     (data.address as string)?.trim() || null,
    phone:       (data.phone as string)?.trim() || null,
    logoUrl,
    isSetupComplete: true,
  }).returning()

  await db.insert(companyMembers).values({
    companyId: company.id,
    recruiterId: ownerId,
    role: 'owner',
    status: 'active',
  })
  await db.update(profiles).set({ companyId: company.id }).where(eq(profiles.id, ownerId))

  return serialize<Company>(company)
}

/** Crée/renouvelle une demande d'adhésion. Renvoie l'id. */
export async function requestToJoin(
  recruiterId: string,
  companyId: string,
  message?: string,
): Promise<string | undefined> {
  const [row] = await db
    .insert(companyJoinRequests)
    .values({ companyId, recruiterId, message: message?.trim() || null, status: 'pending' })
    .onConflictDoUpdate({
      target: [companyJoinRequests.companyId, companyJoinRequests.recruiterId],
      set: { message: message?.trim() || null, status: 'pending' },
    })
    .returning({ id: companyJoinRequests.id })
  return row?.id
}

/** Crée/renouvelle l'abonnement (essai 30 j). Réservé à l'owner. */
export async function setCompanySubscription(
  actorId: string,
  companyId: string,
  planId: string,
): Promise<{ error: string | null }> {
  const [company] = await db
    .select({ ownerId: companies.ownerId }).from(companies)
    .where(eq(companies.id, companyId)).limit(1)
  if (!company) return { error: 'Entreprise introuvable' }
  if (company.ownerId !== actorId) return { error: 'Non autorisé' }

  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + 30)

  await db.insert(companySubscriptions)
    .values({ companyId, planId, status: 'trial', trialEndsAt: trialEnd, seatsUsed: 1 })
    .onConflictDoUpdate({
      target: companySubscriptions.companyId,
      set: { planId, status: 'trial', trialEndsAt: trialEnd },
    })
  return { error: null }
}

// ── Équipe ────────────────────────────────────────────────────────

/** Vérifie que l'acteur est membre actif de l'entreprise. */
export async function isCompanyMember(actorId: string, companyId: string): Promise<boolean> {
  const [m] = await db
    .select({ id: companyMembers.id }).from(companyMembers)
    .where(and(
      eq(companyMembers.companyId, companyId),
      eq(companyMembers.recruiterId, actorId),
      eq(companyMembers.status, 'active'),
    )).limit(1)
  return !!m
}

/** Vérifie que l'acteur est owner/admin actif de l'entreprise. */
async function isCompanyAdmin(actorId: string, companyId: string): Promise<boolean> {
  const [m] = await db
    .select({ role: companyMembers.role }).from(companyMembers)
    .where(and(
      eq(companyMembers.companyId, companyId),
      eq(companyMembers.recruiterId, actorId),
      eq(companyMembers.status, 'active'),
    )).limit(1)
  return m?.role === 'owner' || m?.role === 'admin'
}

/** Membres actifs + demandes en attente. */
export async function getTeam(companyId: string): Promise<{
  members: CompanyMember[]
  requests: CompanyJoinRequest[]
}> {
  const members = await db.query.companyMembers.findMany({
    where: and(eq(companyMembers.companyId, companyId), eq(companyMembers.status, 'active')),
    with: { profile: { columns: MEMBER_PROFILE } },
    orderBy: (m, { asc }) => [asc(m.createdAt)],
  })
  const requests = await db.query.companyJoinRequests.findMany({
    where: and(eq(companyJoinRequests.companyId, companyId), eq(companyJoinRequests.status, 'pending')),
    with: { profile: { columns: { fullName: true, email: true } } },
    orderBy: (r, { asc }) => [asc(r.createdAt)],
  })
  return {
    members: serialize<CompanyMember[]>(members),
    requests: serialize<CompanyJoinRequest[]>(requests),
  }
}

/** Approuve/refuse une demande d'adhésion (owner/admin uniquement). */
export async function respondJoinRequest(
  actorId: string,
  requestId: string,
  approve: boolean,
): Promise<{ error: string | null }> {
  const [req] = await db.select().from(companyJoinRequests)
    .where(eq(companyJoinRequests.id, requestId)).limit(1)
  if (!req) return { error: 'Demande introuvable' }
  if (!(await isCompanyAdmin(actorId, req.companyId))) return { error: 'Non autorisé' }

  if (approve) {
    await db.update(companyJoinRequests)
      .set({ status: 'approved', reviewedBy: actorId }).where(eq(companyJoinRequests.id, requestId))
    await db.insert(companyMembers)
      .values({ companyId: req.companyId, recruiterId: req.recruiterId, role: 'member', status: 'active' })
      .onConflictDoUpdate({
        target: [companyMembers.companyId, companyMembers.recruiterId],
        set: { status: 'active', role: 'member' },
      })
    await db.update(profiles).set({ companyId: req.companyId }).where(eq(profiles.id, req.recruiterId))
  } else {
    await db.update(companyJoinRequests)
      .set({ status: 'rejected', reviewedBy: actorId }).where(eq(companyJoinRequests.id, requestId))
  }
  return { error: null }
}

/** Retire un membre (suspend + détache son profil). */
export async function removeMember(actorId: string, memberId: string): Promise<{ error: string | null }> {
  const [member] = await db.select().from(companyMembers)
    .where(eq(companyMembers.id, memberId)).limit(1)
  if (!member) return { error: 'Membre introuvable' }
  if (!(await isCompanyAdmin(actorId, member.companyId))) return { error: 'Non autorisé' }

  await db.update(companyMembers).set({ status: 'suspended' }).where(eq(companyMembers.id, memberId))
  await db.update(profiles).set({ companyId: null }).where(eq(profiles.id, member.recruiterId))
  return { error: null }
}

/** Change le rôle d'un membre (admin/member). */
export async function changeMemberRole(
  actorId: string,
  memberId: string,
  role: 'admin' | 'member',
): Promise<{ error: string | null }> {
  const [member] = await db.select().from(companyMembers)
    .where(eq(companyMembers.id, memberId)).limit(1)
  if (!member) return { error: 'Membre introuvable' }
  if (!(await isCompanyAdmin(actorId, member.companyId))) return { error: 'Non autorisé' }

  await db.update(companyMembers).set({ role }).where(eq(companyMembers.id, memberId))
  return { error: null }
}
