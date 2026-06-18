/**
 * KAZAJOB — Prise de RDV / présentation recruteur (démo).
 * Créneaux ouverts par l'admin, réservés par des prospects depuis la page publique.
 */
import { and, asc, desc, eq, gt } from 'drizzle-orm'
import { db } from '@/lib/db'
import { bookingSlots, demoBookings } from '@/lib/db/schema'

export interface Slot { id: string; starts_at: string; duration_min: number; is_booked: boolean }

/** Créneaux disponibles (futurs, non réservés) — public. */
export async function listAvailableSlots(): Promise<Slot[]> {
  const rows = await db.select().from(bookingSlots)
    .where(and(eq(bookingSlots.isBooked, false), gt(bookingSlots.startsAt, new Date())))
    .orderBy(asc(bookingSlots.startsAt))
  return rows.map((r) => ({ id: r.id, starts_at: (r.startsAt as Date).toISOString(), duration_min: r.durationMin, is_booked: r.isBooked }))
}

export interface BookingInput { slotId?: string | null; name: string; company?: string; email: string; phone?: string; message?: string }

/** Réserve un créneau (ou demande libre si pas de créneau). Renvoie l'horaire si créneau. */
export async function createBooking(input: BookingInput): Promise<{ error?: string; id?: string; when?: Date | null; durationMin?: number }> {
  if (!input.name?.trim() || !input.email?.trim()) return { error: 'Nom et email requis' }

  let when: Date | null = null
  let durationMin = 30
  if (input.slotId) {
    // Réservation atomique : on ne prend que si le créneau est encore libre.
    const [slot] = await db.update(bookingSlots).set({ isBooked: true })
      .where(and(eq(bookingSlots.id, input.slotId), eq(bookingSlots.isBooked, false)))
      .returning({ startsAt: bookingSlots.startsAt, durationMin: bookingSlots.durationMin })
    if (!slot) return { error: 'Ce créneau vient d\'être réservé. Choisissez-en un autre.' }
    when = slot.startsAt as Date
    durationMin = slot.durationMin
  }

  const [row] = await db.insert(demoBookings).values({
    slotId: input.slotId ?? null,
    name: input.name.trim(),
    company: input.company?.trim() || null,
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    message: input.message?.trim() || null,
  }).returning({ id: demoBookings.id })

  return { id: row.id, when, durationMin }
}

// ── Admin ─────────────────────────────────────────────────────────

export async function adminListSlots(): Promise<Slot[]> {
  const rows = await db.select().from(bookingSlots)
    .where(gt(bookingSlots.startsAt, new Date())).orderBy(asc(bookingSlots.startsAt))
  return rows.map((r) => ({ id: r.id, starts_at: (r.startsAt as Date).toISOString(), duration_min: r.durationMin, is_booked: r.isBooked }))
}

/** Crée des créneaux en lot (ISO datetimes). */
export async function adminCreateSlots(starts: string[], durationMin = 30): Promise<number> {
  const values = starts.map((s) => new Date(s)).filter((d) => !isNaN(d.getTime()) && d > new Date())
    .map((d) => ({ startsAt: d, durationMin }))
  if (!values.length) return 0
  const rows = await db.insert(bookingSlots).values(values).returning({ id: bookingSlots.id })
  return rows.length
}

export async function adminDeleteSlot(id: string): Promise<void> {
  await db.delete(bookingSlots).where(eq(bookingSlots.id, id))
}

export interface BookingRow {
  id: string; name: string; company: string | null; email: string; phone: string | null
  message: string | null; status: string; created_at: string; when: string | null
}

export async function adminListBookings(): Promise<BookingRow[]> {
  const rows = await db.select({
    id: demoBookings.id, name: demoBookings.name, company: demoBookings.company,
    email: demoBookings.email, phone: demoBookings.phone, message: demoBookings.message,
    status: demoBookings.status, createdAt: demoBookings.createdAt, startsAt: bookingSlots.startsAt,
  }).from(demoBookings)
    .leftJoin(bookingSlots, eq(bookingSlots.id, demoBookings.slotId))
    .orderBy(desc(demoBookings.createdAt))
  return rows.map((r) => ({
    id: r.id, name: r.name, company: r.company, email: r.email, phone: r.phone, message: r.message,
    status: r.status, created_at: (r.createdAt as Date).toISOString(), when: r.startsAt ? (r.startsAt as Date).toISOString() : null,
  }))
}

export async function adminUpdateBookingStatus(id: string, status: string): Promise<void> {
  if (!['confirmed', 'cancelled', 'done'].includes(status)) return
  // Si annulation et créneau lié → on libère le créneau.
  if (status === 'cancelled') {
    const [b] = await db.select({ slotId: demoBookings.slotId }).from(demoBookings).where(eq(demoBookings.id, id)).limit(1)
    if (b?.slotId) await db.update(bookingSlots).set({ isBooked: false }).where(eq(bookingSlots.id, b.slotId))
  }
  await db.update(demoBookings).set({ status }).where(eq(demoBookings.id, id))
}
