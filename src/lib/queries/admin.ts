/**
 * KAZAJOB — Requêtes Drizzle pour l'admin (modération).
 * Couche serveur. À n'appeler que derrière `requireAdmin()`.
 */
import { and, count, desc, eq, gte, ilike, isNotNull, ne, sql, type SQL } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { db } from '@/lib/db'
import {
  applications, candidateSkills, companies, companySubscriptions, conversations,
  eventRegistrations, events, jobs, notifications, profiles, referrals, skills,
} from '@/lib/db/schema'
import type { Company, CompanySubscription, Job, Profile } from '@/lib/types'
import { serialize } from './_serialize'

/** Compteur générique sur une table, avec condition optionnelle. */
async function cnt(table: PgTable, where?: SQL): Promise<number> {
  const q = db.select({ value: count() }).from(table)
  const [{ value }] = where ? await q.where(where) : await q
  return value
}

// ── Utilisateurs ──────────────────────────────────────────────────
export async function listUsers(search?: string): Promise<Profile[]> {
  const rows = search
    ? await db.select().from(profiles).where(ilike(profiles.fullName, `%${search}%`)).orderBy(desc(profiles.createdAt))
    : await db.select().from(profiles).orderBy(desc(profiles.createdAt))
  return rows.map(({ passwordHash: _ph, ...rest }) => serialize<Profile>(rest))
}

export async function setUserRole(id: string, role: string): Promise<void> {
  await db.update(profiles).set({ role }).where(eq(profiles.id, id))
}

// ── Entreprises ───────────────────────────────────────────────────
export async function listAllCompanies(): Promise<Company[]> {
  const rows = await db.select().from(companies).orderBy(desc(companies.createdAt))
  return serialize<Company[]>(rows)
}

export async function setCompanyVerified(id: string, verified: boolean): Promise<void> {
  await db.update(companies).set({ isVerified: verified }).where(eq(companies.id, id))
}

// ── Offres ────────────────────────────────────────────────────────
export async function listAllJobs(): Promise<Job[]> {
  const rows = await db.query.jobs.findMany({
    with: { company: true },
    orderBy: (j, { desc: d }) => [d(j.createdAt)],
    limit: 50,
  })
  return serialize<Job[]>(rows)
}

export async function setJobActive(id: string, active: boolean): Promise<void> {
  await db.update(jobs).set({ isActive: active }).where(eq(jobs.id, id))
}

export async function deleteJob(id: string): Promise<void> {
  await db.delete(jobs).where(eq(jobs.id, id))
}

// ── Compétences (référentiel) ─────────────────────────────────────
export interface SkillWithUsage { id: string; name: string; category: string | null; usage_count: number }

export async function getSkillsWithUsage(): Promise<SkillWithUsage[]> {
  const rows = await db
    .select({
      id: skills.id,
      name: skills.name,
      category: skills.category,
      usage_count: count(candidateSkills.candidateId),
    })
    .from(skills)
    .leftJoin(candidateSkills, eq(candidateSkills.skillId, skills.id))
    .groupBy(skills.id)
    .orderBy(skills.name)
  return rows
}

export async function createSkill(name: string, category: string | null): Promise<void> {
  await db.insert(skills).values({ name, category }).onConflictDoNothing()
}

export async function deleteSkill(id: string): Promise<void> {
  await db.delete(skills).where(eq(skills.id, id))
}

// ── Abonnements ───────────────────────────────────────────────────
export async function listSubscriptions(): Promise<Array<CompanySubscription & { company: unknown }>> {
  const rows = await db.query.companySubscriptions.findMany({
    with: { company: { columns: { name: true, isVerified: true } } },
    orderBy: (s, { desc: d }) => [d(s.createdAt)],
  })
  return serialize(rows)
}

export async function updateSubscription(
  id: string,
  patch: { planId?: string; status?: string },
): Promise<void> {
  const set: Record<string, unknown> = {}
  if (patch.planId) set.planId = patch.planId
  if (patch.status) set.status = patch.status
  if (Object.keys(set).length === 0) return
  await db.update(companySubscriptions).set(set).where(eq(companySubscriptions.id, id))
}

// ── Notifications (broadcast) ─────────────────────────────────────
export async function countUsers(role?: string): Promise<number> {
  const base = db.select({ value: sql<number>`count(*)::int` }).from(profiles)
  const [{ value }] = role ? await base.where(eq(profiles.role, role)) : await base
  return value
}

export async function broadcastNotification(
  title: string,
  message: string,
  link: string | null,
  target: 'all' | 'candidate' | 'recruiter',
): Promise<number> {
  const sel = db.select({ id: profiles.id }).from(profiles)
  const users = target === 'all' ? await sel : await sel.where(eq(profiles.role, target))
  if (users.length === 0) return 0

  const values = users.map((u) => ({
    userId: u.id, type: 'admin', title, message, link: link || null, isRead: false,
  }))
  const BATCH = 500
  for (let i = 0; i < values.length; i += BATCH) {
    await db.insert(notifications).values(values.slice(i, i + BATCH))
  }
  return users.length
}

// ── Dashboard (compteurs globaux) ─────────────────────────────────
export async function getDashboardStats() {
  const [
    users, jobsCount, companiesCount, applicationsCount,
    candidates, recruiters, admins, eventsCount, skillsCount, referralsCount,
  ] = await Promise.all([
    cnt(profiles), cnt(jobs), cnt(companies), cnt(applications),
    cnt(profiles, eq(profiles.role, 'candidate')),
    cnt(profiles, eq(profiles.role, 'recruiter')),
    cnt(profiles, eq(profiles.role, 'admin')),
    cnt(events), cnt(skills), cnt(referrals),
  ])
  const recentJobs = await db
    .select({ id: jobs.id, title: jobs.title, createdAt: jobs.createdAt, isActive: jobs.isActive })
    .from(jobs).orderBy(desc(jobs.createdAt)).limit(5)

  return {
    users, jobs: jobsCount, companies: companiesCount, applications: applicationsCount,
    candidates, recruiters, admins, events: eventsCount, skills: skillsCount, referrals: referralsCount,
    recentJobs: serialize(recentJobs),
  }
}

// ── KazaIA (estimations) ──────────────────────────────────────────
export async function getAIStats() {
  const [totalApplications, applicationsWithCoverLetter, totalConversations] = await Promise.all([
    cnt(applications),
    cnt(applications, and(isNotNull(applications.coverLetter), ne(applications.coverLetter, ''))),
    cnt(conversations),
  ])
  return { totalApplications, applicationsWithCoverLetter, totalConversations }
}

// ── Analytics (8 dernières semaines, agrégation côté client) ──────
export async function getAnalyticsData() {
  const since = new Date()
  since.setDate(since.getDate() - 56)

  const [profs, jbs, aps, totalUsers, totalJobs, totalApps, totalCompanies] = await Promise.all([
    db.select({ created_at: profiles.createdAt }).from(profiles).where(gte(profiles.createdAt, since)),
    db.select({ created_at: jobs.createdAt, location: jobs.location, sector: jobs.sector })
      .from(jobs).where(gte(jobs.createdAt, since)),
    db.select({ created_at: applications.createdAt }).from(applications).where(gte(applications.createdAt, since)),
    cnt(profiles), cnt(jobs), cnt(applications), cnt(companies),
  ])

  return {
    profiles: serialize(profs),
    jobs: serialize(jbs),
    apps: serialize(aps),
    totals: { users: totalUsers, jobs: totalJobs, apps: totalApps, companies: totalCompanies },
  }
}

// ── KazaEvents ────────────────────────────────────────────────────
export async function listAdminEvents(): Promise<Array<Record<string, unknown>>> {
  const evs = await db.query.events.findMany({
    with: { organizer: { columns: { fullName: true, email: true } } },
    orderBy: (e, { desc: d }) => [d(e.date)],
  })
  const counts = await db
    .select({ eventId: eventRegistrations.eventId, c: count() })
    .from(eventRegistrations)
    .groupBy(eventRegistrations.eventId)
  const map = new Map(counts.map((r) => [r.eventId, r.c]))

  return evs.map((e) => ({
    ...serialize<Record<string, unknown>>(e),
    registrations_count: map.get(e.id) ?? 0,
  }))
}

export async function setEventPublished(id: string, published: boolean): Promise<void> {
  await db.update(events).set({ isPublished: published }).where(eq(events.id, id))
}

export async function deleteEvent(id: string): Promise<void> {
  await db.delete(events).where(eq(events.id, id))
}
