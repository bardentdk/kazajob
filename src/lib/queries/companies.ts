/**
 * KAZAJOB — Requêtes Drizzle pour les entreprises et la gestion d'équipe.
 * Couche serveur. Les mutations d'équipe vérifient que l'acteur est owner/admin.
 */
import { randomBytes } from 'crypto'
import { and, eq, gt, ilike, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  companies, companyInvitations, companyJoinRequests, companyMembers, companySubscriptions, jobs, profiles,
} from '@/lib/db/schema'
import type {
  Company, CompanyInvitation, CompanyJoinRequest, CompanyMember, CompanySubscription, Membership,
} from '@/lib/types'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'
import { serialize } from './_serialize'

const INVITE_TTL_DAYS = 7

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

/** Crée/renouvelle une demande d'adhésion. Multi-entreprises OK, mais pas deux fois la même. */
export async function requestToJoin(
  recruiterId: string,
  companyId: string,
  message?: string,
): Promise<{ error: string | null; id?: string }> {
  if (await isCompanyMember(recruiterId, companyId)) {
    return { error: 'Vous êtes déjà membre de cette entreprise.' }
  }
  const [row] = await db
    .insert(companyJoinRequests)
    .values({ companyId, recruiterId, message: message?.trim() || null, status: 'pending' })
    .onConflictDoUpdate({
      target: [companyJoinRequests.companyId, companyJoinRequests.recruiterId],
      set: { message: message?.trim() || null, status: 'pending' },
    })
    .returning({ id: companyJoinRequests.id })
  return { error: null, id: row?.id }
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

// ── Forfait & quotas ───────────────────────────────────────────────

const DEFAULT_PLAN = SUBSCRIPTION_PLANS[0] // Starter = repli le plus restrictif

/**
 * Appartenance « active » du recruteur (multi-entreprises).
 * Renvoie l'adhésion correspondant à l'entreprise active (profile.company_id)
 * si elle est valide, sinon la première adhésion active (auto-réparation), sinon null.
 */
export async function getActiveMembership(
  recruiterId: string,
): Promise<{ companyId: string; role: string } | null> {
  const [prof] = await db
    .select({ companyId: profiles.companyId })
    .from(profiles).where(eq(profiles.id, recruiterId)).limit(1)

  if (prof?.companyId) {
    const [m] = await db
      .select({ companyId: companyMembers.companyId, role: companyMembers.role })
      .from(companyMembers)
      .where(and(
        eq(companyMembers.recruiterId, recruiterId),
        eq(companyMembers.companyId, prof.companyId),
        eq(companyMembers.status, 'active'),
      )).limit(1)
    if (m) return m
  }

  const [first] = await db
    .select({ companyId: companyMembers.companyId, role: companyMembers.role })
    .from(companyMembers)
    .where(and(eq(companyMembers.recruiterId, recruiterId), eq(companyMembers.status, 'active')))
    .limit(1)
  return first ?? null
}

/** Toutes les entreprises dont le recruteur est membre actif (pour le sélecteur). */
export async function listMemberships(recruiterId: string): Promise<Membership[]> {
  const [prof] = await db
    .select({ companyId: profiles.companyId })
    .from(profiles).where(eq(profiles.id, recruiterId)).limit(1)

  const rows = await db
    .select({
      companyId: companyMembers.companyId,
      role: companyMembers.role,
      name: companies.name,
      logoUrl: companies.logoUrl,
    })
    .from(companyMembers)
    .innerJoin(companies, eq(companyMembers.companyId, companies.id))
    .where(and(eq(companyMembers.recruiterId, recruiterId), eq(companyMembers.status, 'active')))
    .orderBy(companies.name)

  return rows.map((r) => ({
    company_id:   r.companyId,
    company_name: r.name,
    logo_url:     r.logoUrl,
    role:         r.role as Membership['role'],
    is_active:    r.companyId === prof?.companyId,
  }))
}

/** Bascule l'entreprise active du recruteur (doit en être membre). */
export async function setActiveCompany(
  recruiterId: string,
  companyId: string,
): Promise<{ error: string | null }> {
  if (!(await isCompanyMember(recruiterId, companyId))) {
    return { error: 'Vous n\'êtes pas membre de cette entreprise.' }
  }
  await db.update(profiles).set({ companyId }).where(eq(profiles.id, recruiterId))
  return { error: null }
}

/** Limites du forfait courant de l'entreprise (abonnement → plan, repli Starter). */
export async function getPlanLimits(
  companyId: string,
): Promise<{ maxJobs: number; maxMembers: number; planName: string; status: string | null }> {
  const [sub] = await db
    .select({ planId: companySubscriptions.planId, status: companySubscriptions.status })
    .from(companySubscriptions)
    .where(eq(companySubscriptions.companyId, companyId))
    .limit(1)
  const plan = SUBSCRIPTION_PLANS.find((p) => p.id === sub?.planId) ?? DEFAULT_PLAN
  return { maxJobs: plan.maxJobs, maxMembers: plan.maxMembers, planName: plan.name, status: sub?.status ?? null }
}

async function countActiveJobs(companyId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.isActive, true)))
  return value
}

async function countActiveMembers(companyId: string): Promise<number> {
  const [{ value }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(companyMembers)
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.status, 'active')))
  return value
}

/** L'entreprise peut-elle publier/activer une offre de plus (forfait + statut d'abonnement) ? */
export async function canPublishJob(
  companyId: string,
): Promise<{ ok: boolean; max: number; used: number; planName: string; reason?: 'limit' | 'expired' }> {
  const { maxJobs, planName, status } = await getPlanLimits(companyId)
  // Essai/abonnement expiré ou annulé → accès coupé.
  if (status === 'expired' || status === 'cancelled') {
    return { ok: false, max: maxJobs, used: 0, planName, reason: 'expired' }
  }
  if (maxJobs === -1) return { ok: true, max: -1, used: 0, planName }
  const used = await countActiveJobs(companyId)
  return { ok: used < maxJobs, max: maxJobs, used, planName, reason: 'limit' }
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
    // Plafond d'équipe selon le forfait
    const { maxMembers, planName } = await getPlanLimits(req.companyId)
    if (maxMembers !== -1 && (await countActiveMembers(req.companyId)) >= maxMembers) {
      return { error: `Limite d'équipe atteinte pour le forfait ${planName} (${maxMembers} recruteur(s)). Passez à un forfait supérieur pour en ajouter.` }
    }
    await db.update(companyJoinRequests)
      .set({ status: 'approved', reviewedBy: actorId }).where(eq(companyJoinRequests.id, requestId))
    await db.insert(companyMembers)
      .values({ companyId: req.companyId, recruiterId: req.recruiterId, role: 'member', status: 'active' })
      .onConflictDoUpdate({
        target: [companyMembers.companyId, companyMembers.recruiterId],
        set: { status: 'active', role: 'member' },
      })
    // Multi-entreprises : ne devient l'entreprise active que si le recruteur n'en a pas déjà une.
    await db.update(profiles)
      .set({ companyId: sql`COALESCE(${profiles.companyId}, ${req.companyId}::uuid)` })
      .where(eq(profiles.id, req.recruiterId))
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
  if (member.role === 'owner') return { error: 'Le propriétaire ne peut pas être retiré de l\'entreprise.' }
  if (!(await isCompanyAdmin(actorId, member.companyId))) return { error: 'Non autorisé' }

  await db.update(companyMembers).set({ status: 'suspended' }).where(eq(companyMembers.id, memberId))
  await repointActiveCompany(member.recruiterId, member.companyId)
  return { error: null }
}

/** Repointe l'entreprise active d'un recruteur s'il vient de quitter celle qui était active. */
async function repointActiveCompany(recruiterId: string, leftCompanyId: string): Promise<void> {
  const [other] = await db
    .select({ companyId: companyMembers.companyId })
    .from(companyMembers)
    .where(and(eq(companyMembers.recruiterId, recruiterId), eq(companyMembers.status, 'active')))
    .limit(1)
  await db.update(profiles)
    .set({ companyId: other?.companyId ?? null })
    .where(and(eq(profiles.id, recruiterId), eq(profiles.companyId, leftCompanyId)))
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
  if (member.role === 'owner') return { error: 'Le rôle du propriétaire ne peut pas être modifié.' }
  if (!(await isCompanyAdmin(actorId, member.companyId))) return { error: 'Non autorisé' }

  await db.update(companyMembers).set({ role }).where(eq(companyMembers.id, memberId))
  return { error: null }
}

/** Quitter volontairement une entreprise (l'owner doit d'abord transférer la propriété). */
export async function leaveCompany(
  recruiterId: string,
  companyId: string,
): Promise<{ error: string | null }> {
  const [m] = await db
    .select({ id: companyMembers.id, role: companyMembers.role })
    .from(companyMembers)
    .where(and(
      eq(companyMembers.companyId, companyId),
      eq(companyMembers.recruiterId, recruiterId),
      eq(companyMembers.status, 'active'),
    )).limit(1)
  if (!m) return { error: 'Vous n\'êtes pas membre de cette entreprise.' }
  if (m.role === 'owner') {
    return { error: 'En tant que propriétaire, transférez d\'abord la propriété à un autre membre avant de quitter.' }
  }
  await db.update(companyMembers).set({ status: 'suspended' }).where(eq(companyMembers.id, m.id))
  await repointActiveCompany(recruiterId, companyId)
  return { error: null }
}

/** Transfère la propriété à un autre membre actif (owner uniquement). L'ancien owner devient admin. */
export async function transferOwnership(
  actorId: string,
  companyId: string,
  targetMemberId: string,
): Promise<{ error: string | null }> {
  const [company] = await db
    .select({ ownerId: companies.ownerId }).from(companies)
    .where(eq(companies.id, companyId)).limit(1)
  if (!company) return { error: 'Entreprise introuvable' }
  if (company.ownerId !== actorId) return { error: 'Seul le propriétaire peut transférer la propriété.' }

  const [target] = await db
    .select({ id: companyMembers.id, recruiterId: companyMembers.recruiterId })
    .from(companyMembers)
    .where(and(
      eq(companyMembers.id, targetMemberId),
      eq(companyMembers.companyId, companyId),
      eq(companyMembers.status, 'active'),
    )).limit(1)
  if (!target) return { error: 'Membre cible introuvable' }
  if (target.recruiterId === actorId) return { error: 'Vous êtes déjà propriétaire.' }

  await db.update(companyMembers).set({ role: 'owner' }).where(eq(companyMembers.id, target.id))
  await db.update(companies).set({ ownerId: target.recruiterId }).where(eq(companies.id, companyId))
  await db.update(companyMembers).set({ role: 'admin' })
    .where(and(eq(companyMembers.companyId, companyId), eq(companyMembers.recruiterId, actorId)))
  return { error: null }
}

// ── Invitations (Tier 2 : token) ───────────────────────────────────

/** Crée une invitation par token (owner/admin). Renvoie le token. */
export async function createInvitation(
  actorId: string,
  companyId: string,
  opts: { email?: string; role?: 'member' | 'admin' } = {},
): Promise<{ error: string | null; token?: string }> {
  if (!(await isCompanyAdmin(actorId, companyId))) return { error: 'Non autorisé' }
  const token = randomBytes(24).toString('base64url')
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000)
  await db.insert(companyInvitations).values({
    companyId,
    email: opts.email?.trim().toLowerCase() || null,
    token,
    role: opts.role === 'admin' ? 'admin' : 'member',
    invitedBy: actorId,
    status: 'pending',
    expiresAt,
  })
  return { error: null, token }
}

/** Invitations en attente d'une entreprise (page équipe). */
export async function listInvitations(companyId: string): Promise<CompanyInvitation[]> {
  const rows = await db.select().from(companyInvitations)
    .where(and(eq(companyInvitations.companyId, companyId), eq(companyInvitations.status, 'pending')))
    .orderBy(companyInvitations.createdAt)
  return serialize<CompanyInvitation[]>(rows)
}

/** Révoque une invitation (owner/admin). */
export async function revokeInvitation(
  actorId: string,
  invitationId: string,
): Promise<{ error: string | null }> {
  const [inv] = await db.select({ companyId: companyInvitations.companyId })
    .from(companyInvitations).where(eq(companyInvitations.id, invitationId)).limit(1)
  if (!inv) return { error: 'Invitation introuvable' }
  if (!(await isCompanyAdmin(actorId, inv.companyId))) return { error: 'Non autorisé' }
  await db.update(companyInvitations).set({ status: 'revoked' }).where(eq(companyInvitations.id, invitationId))
  return { error: null }
}

/** Détail public d'une invitation valide (page d'acceptation). */
export async function getInvitationByToken(token: string): Promise<CompanyInvitation | null> {
  const [inv] = await db.select().from(companyInvitations)
    .where(and(
      eq(companyInvitations.token, token),
      eq(companyInvitations.status, 'pending'),
      gt(companyInvitations.expiresAt, new Date()),
    )).limit(1)
  if (!inv) return null
  const [company] = await db.select({ name: companies.name, logoUrl: companies.logoUrl })
    .from(companies).where(eq(companies.id, inv.companyId)).limit(1)
  const out = serialize<CompanyInvitation>(inv)
  out.company = company ? { name: company.name, logo_url: company.logoUrl } : null
  return out
}

/** Accepte une invitation : rattache le recruteur à l'entreprise (respecte maxMembers). */
export async function acceptInvitation(
  recruiterId: string,
  token: string,
): Promise<{ error: string | null; companyId?: string }> {
  const [inv] = await db.select().from(companyInvitations)
    .where(and(
      eq(companyInvitations.token, token),
      eq(companyInvitations.status, 'pending'),
      gt(companyInvitations.expiresAt, new Date()),
    )).limit(1)
  if (!inv) return { error: 'Invitation invalide ou expirée.' }

  // Invitation ciblée par e-mail : doit correspondre au compte connecté.
  if (inv.email) {
    const [prof] = await db.select({ email: profiles.email }).from(profiles).where(eq(profiles.id, recruiterId)).limit(1)
    if (prof?.email?.toLowerCase() !== inv.email.toLowerCase()) {
      return { error: 'Cette invitation est réservée à une autre adresse e-mail.' }
    }
  }

  // Déjà membre : on consomme l'invitation sans dupliquer.
  if (await isCompanyMember(recruiterId, inv.companyId)) {
    await db.update(companyInvitations).set({ status: 'accepted', acceptedBy: recruiterId })
      .where(eq(companyInvitations.id, inv.id))
    return { error: null, companyId: inv.companyId }
  }

  const { maxMembers, planName } = await getPlanLimits(inv.companyId)
  if (maxMembers !== -1 && (await countActiveMembers(inv.companyId)) >= maxMembers) {
    return { error: `L'entreprise a atteint la limite d'équipe de son forfait ${planName} (${maxMembers}).` }
  }

  await db.insert(companyMembers)
    .values({ companyId: inv.companyId, recruiterId, role: inv.role, status: 'active', invitedBy: inv.invitedBy })
    .onConflictDoUpdate({
      target: [companyMembers.companyId, companyMembers.recruiterId],
      set: { status: 'active', role: inv.role },
    })
  await db.update(companyInvitations).set({ status: 'accepted', acceptedBy: recruiterId })
    .where(eq(companyInvitations.id, inv.id))
  await db.update(profiles)
    .set({ companyId: sql`COALESCE(${profiles.companyId}, ${inv.companyId}::uuid)` })
    .where(eq(profiles.id, recruiterId))
  return { error: null, companyId: inv.companyId }
}
