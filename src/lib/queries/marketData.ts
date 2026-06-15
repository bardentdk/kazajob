/**
 * KAZAJOB — Données marché RÉELLES (agrégations sur les offres & formations publiées).
 * Aucune donnée mockée : tout est calculé depuis la base.
 */
import { and, desc, eq, gte, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { jobs, trainingOffers } from '@/lib/db/schema'

export interface SectorStat { sector: string; count: number; avgMin: number | null; avgMax: number | null }
export interface CountStat { label: string; count: number }
export interface MarketRadar {
  totalActive: number
  recent30: number
  sectors: SectorStat[]
  locations: CountStat[]
  roles: CountStat[]
}

const num = (v: unknown): number | null => (v === null || v === undefined ? null : Number(v))

/** Radar emploi : agrégations réelles sur les offres actives. */
export async function getMarketRadar(): Promise<MarketRadar> {
  const since = new Date(Date.now() - 30 * 86_400_000)

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(jobs).where(eq(jobs.isActive, true))

  const [{ recent }] = await db
    .select({ recent: sql<number>`count(*)::int` })
    .from(jobs).where(and(eq(jobs.isActive, true), gte(jobs.createdAt, since)))

  const sectorsRaw = await db
    .select({
      sector: jobs.sector,
      count: sql<number>`count(*)::int`,
      avgMin: sql<number | null>`round(avg(${jobs.salaryMin}))::int`,
      avgMax: sql<number | null>`round(avg(${jobs.salaryMax}))::int`,
    })
    .from(jobs)
    .where(and(eq(jobs.isActive, true), isNotNull(jobs.sector)))
    .groupBy(jobs.sector)
    .orderBy(sql`count(*) desc`)
    .limit(8)

  const locationsRaw = await db
    .select({ location: jobs.location, count: sql<number>`count(*)::int` })
    .from(jobs).where(eq(jobs.isActive, true))
    .groupBy(jobs.location).orderBy(sql`count(*) desc`).limit(8)

  const rolesRaw = await db
    .select({ title: jobs.title, count: sql<number>`count(*)::int` })
    .from(jobs).where(eq(jobs.isActive, true))
    .groupBy(jobs.title).orderBy(sql`count(*) desc`).limit(8)

  return {
    totalActive: Number(total) || 0,
    recent30: Number(recent) || 0,
    sectors: sectorsRaw.map((s) => ({ sector: s.sector as string, count: Number(s.count), avgMin: num(s.avgMin), avgMax: num(s.avgMax) })),
    locations: locationsRaw.map((l) => ({ label: l.location, count: Number(l.count) })),
    roles: rolesRaw.map((r) => ({ label: r.title, count: Number(r.count) })),
  }
}

/** Stats salariales réelles d'un secteur (offres actives avec salaire renseigné). */
export async function getSectorSalary(sector?: string | null): Promise<{ count: number; min: number | null; avg: number | null; max: number | null } | null> {
  if (!sector) return null
  const [r] = await db
    .select({
      count: sql<number>`count(*)::int`,
      min: sql<number | null>`min(${jobs.salaryMin})`,
      avg: sql<number | null>`round(avg((coalesce(${jobs.salaryMin},${jobs.salaryMax}) + coalesce(${jobs.salaryMax},${jobs.salaryMin})) / 2.0))::int`,
      max: sql<number | null>`max(${jobs.salaryMax})`,
    })
    .from(jobs)
    .where(and(eq(jobs.isActive, true), eq(jobs.sector, sector), isNotNull(jobs.salaryMin)))
  if (!r) return null
  return { count: Number(r.count), min: num(r.min), avg: num(r.avg), max: num(r.max) }
}

export interface TrainingReco {
  id: string
  title: string
  sector: string | null
  certificationLevel: string | null
  duration: string
  isFinanced: boolean
  financingOptions: string[]
  location: string
}

/** Formations RÉELLES recommandées (par secteur si fourni), depuis le catalogue. */
export async function recommendTrainings(sector?: string | null, limit = 4): Promise<TrainingReco[]> {
  const base = sector
    ? and(eq(trainingOffers.isActive, true), eq(trainingOffers.sector, sector))
    : eq(trainingOffers.isActive, true)

  let rows = await db
    .select({
      id: trainingOffers.id, title: trainingOffers.title, sector: trainingOffers.sector,
      certificationLevel: trainingOffers.certificationLevel,
      durationValue: trainingOffers.durationValue, durationUnit: trainingOffers.durationUnit,
      isFinanced: trainingOffers.isFinanced, financingOptions: trainingOffers.financingOptions,
      location: trainingOffers.location,
    })
    .from(trainingOffers).where(base).orderBy(desc(trainingOffers.createdAt)).limit(limit)

  // Repli : si aucune formation dans le secteur, on prend les dernières formations actives.
  if (rows.length === 0 && sector) {
    rows = await db
      .select({
        id: trainingOffers.id, title: trainingOffers.title, sector: trainingOffers.sector,
        certificationLevel: trainingOffers.certificationLevel,
        durationValue: trainingOffers.durationValue, durationUnit: trainingOffers.durationUnit,
        isFinanced: trainingOffers.isFinanced, financingOptions: trainingOffers.financingOptions,
        location: trainingOffers.location,
      })
      .from(trainingOffers).where(eq(trainingOffers.isActive, true)).orderBy(desc(trainingOffers.createdAt)).limit(limit)
  }

  return rows.map((r) => ({
    id: r.id, title: r.title, sector: r.sector,
    certificationLevel: r.certificationLevel,
    duration: `${r.durationValue} ${r.durationUnit}`,
    isFinanced: r.isFinanced, financingOptions: r.financingOptions ?? [],
    location: r.location,
  }))
}
