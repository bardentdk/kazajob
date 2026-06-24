/**
 * KAZAJOB — Logique pure de l'offre KazaLaunch (sans DB, testable).
 *
 * Centralise : calcul de la date d'expiration à 3 mois calendaires, jours restants,
 * paliers de rappel, et statuts d'éligibilité. Réutilisé par les routes et les tests.
 */
import { LAUNCH_PLAN } from '@/lib/constants'

/** Durée de l'offre KazaLaunch, en mois calendaires. */
export const LAUNCH_DURATION_MONTHS = LAUNCH_PLAN.durationMonths // 3

/**
 * Ajoute `months` mois calendaires à une date.
 * Si le jour cible n'existe pas dans le mois (ex. 31 → février), borne au dernier
 * jour valide du mois, comme attendu par la spec (heure conservée).
 */
export function addCalendarMonths(from: Date, months: number): Date {
  const d = new Date(from.getTime())
  const targetMonth = d.getMonth() + months
  const result = new Date(d.getTime())
  result.setDate(1)                       // évite le débordement de mois (ex. 31 janv. + 1 mois)
  result.setMonth(targetMonth)
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()
  result.setDate(Math.min(d.getDate(), lastDay))
  return result
}

/** Date d'expiration de KazaLaunch à partir de la date d'activation. */
export function launchExpiry(activatedAt: Date): Date {
  return addCalendarMonths(activatedAt, LAUNCH_DURATION_MONTHS)
}

/** Jours entiers restants avant `expiresAt` (0 si dépassé). */
export function daysUntil(expiresAt: Date, now: Date = new Date()): number {
  const ms = expiresAt.getTime() - now.getTime()
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000)
}

/** L'offre a-t-elle expiré ? */
export function isLaunchExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime()
}

/** Paliers de rappel d'expiration (en jours avant la fin). */
export const LAUNCH_REMINDER_DAYS = [30, 15, 7, 3, 1, 0] as const

/**
 * Palier de rappel à envoyer pour `daysLeft` jours restants, ou null si aucun.
 * `lastSent` = dernier palier déjà notifié (idempotence). On ne renvoie un palier
 * que s'il est strictement plus urgent (plus petit) que le dernier envoyé.
 */
export function dueLaunchReminder(daysLeft: number, lastSent: number | null): number | null {
  const palier = LAUNCH_REMINDER_DAYS.find((d) => daysLeft <= d && (lastSent === null || d < lastSent))
  return palier ?? null
}

/** Niveau d'alerte UI selon les jours restants (pour la bannière dashboard). */
export function launchAlertLevel(daysLeft: number): 'info' | 'reminder' | 'warning' | 'urgent' | 'expired' {
  if (daysLeft <= 0) return 'expired'
  if (daysLeft <= 7) return 'urgent'
  if (daysLeft <= 15) return 'warning'
  if (daysLeft <= 30) return 'reminder'
  return 'info'
}

// ── Statuts d'éligibilité (décision serveur uniquement) ───────────
export type LaunchEligibility =
  | 'eligible'
  | 'already_used'
  | 'offer_disabled'
  | 'offer_not_started'
  | 'offer_ended'
  | 'active_paid_plan'
  | 'company_identity_required'

export interface PlanAvailability {
  isActive:     boolean
  isPublic:     boolean
  isSelectable: boolean
  startsAt:     Date | null
  endsAt:       Date | null
}

/** Disponibilité globale de l'offre (indépendante de l'entreprise). */
export function launchGloballyAvailable(p: PlanAvailability, now: Date = new Date()): LaunchEligibility | 'ok' {
  if (!p.isActive || !p.isPublic || !p.isSelectable) return 'offer_disabled'
  if (p.startsAt && now < p.startsAt) return 'offer_not_started'
  if (p.endsAt && now > p.endsAt) return 'offer_ended'
  return 'ok'
}
