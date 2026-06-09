/**
 * KAZAJOB — Requêtes Drizzle pour les KazaEvents.
 * Couche serveur. `registrations_count` est calculé via une agrégation.
 */
import { and, count, desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { eventRegistrations, events } from '@/lib/db/schema'
import { serialize } from './_serialize'

/** Construit une map eventId → nombre d'inscrits pour les ids donnés. */
async function registrationCounts(): Promise<Map<string, number>> {
  const rows = await db
    .select({ eventId: eventRegistrations.eventId, c: count() })
    .from(eventRegistrations)
    .groupBy(eventRegistrations.eventId)
  return new Map(rows.map((r) => [r.eventId, r.c]))
}

function withCount(
  rows: Array<{ id: string }>,
  counts: Map<string, number>,
): Array<Record<string, unknown>> {
  return rows.map((e) => ({
    ...serialize<Record<string, unknown>>(e),
    registrations_count: counts.get(e.id) ?? 0,
  }))
}

/** Événements d'un organisateur (avec nb d'inscrits). */
export async function listOrganizerEvents(organizerId: string) {
  const rows = await db.select().from(events)
    .where(eq(events.organizerId, organizerId))
    .orderBy(desc(events.date))
  return withCount(rows, await registrationCounts())
}

/** Crée un événement. */
export async function createEvent(
  organizerId: string,
  form: Record<string, unknown>,
): Promise<string | undefined> {
  const [row] = await db.insert(events).values({
    organizerId,
    title:           String(form.title ?? '').trim(),
    type:            String(form.type ?? 'job_dating'),
    date:            new Date(String(form.date)),
    durationMinutes: Number(form.duration_minutes ?? 60),
    maxParticipants: Number(form.max_participants ?? 30),
    location:        String(form.location ?? 'En ligne'),
    description:     (form.description as string)?.trim() || null,
    jitsiRoom:       (form.jitsi_room as string) || null,
    isPublished:     form.is_published !== false,
  }).returning({ id: events.id })
  return row?.id
}

/** Supprime un événement (réservé à son organisateur). */
export async function deleteOrganizerEvent(
  organizerId: string,
  id: string,
): Promise<{ error: string | null }> {
  const [ev] = await db.select({ organizerId: events.organizerId }).from(events)
    .where(eq(events.id, id)).limit(1)
  if (!ev) return { error: 'Événement introuvable' }
  if (ev.organizerId !== organizerId) return { error: 'Non autorisé' }
  await db.delete(events).where(eq(events.id, id))
  return { error: null }
}

// ── Côté candidat (utilisé au sous-lot 7c) ────────────────────────

/** Événements publiés (à venir en premier), avec nb d'inscrits. */
export async function listPublishedEvents() {
  const rows = await db.select().from(events)
    .where(eq(events.isPublished, true))
    .orderBy(desc(events.date))
  return withCount(rows, await registrationCounts())
}

/** Ids des événements auxquels un candidat est inscrit. */
export async function listMyRegistrations(candidateId: string): Promise<string[]> {
  const rows = await db.select({ eventId: eventRegistrations.eventId })
    .from(eventRegistrations).where(eq(eventRegistrations.candidateId, candidateId))
  return rows.map((r) => r.eventId)
}

export async function registerToEvent(candidateId: string, eventId: string): Promise<void> {
  await db.insert(eventRegistrations).values({ candidateId, eventId }).onConflictDoNothing()
}

export async function unregisterFromEvent(candidateId: string, eventId: string): Promise<void> {
  await db.delete(eventRegistrations)
    .where(and(eq(eventRegistrations.candidateId, candidateId), eq(eventRegistrations.eventId, eventId)))
}
