/**
 * KAZAJOB — Logique pure de la campagne de lancement (sans DB, testable).
 *
 * Centralise : state machine de campagne, calcul de date d'expiration d'un
 * enrôlement, jours restants, paliers de rappel. Réutilisé par les routes et les tests.
 * NB : une campagne n'est PAS un forfait commercial — voir src/lib/entitlements.ts
 * pour la résolution des droits de publication.
 */

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

/** Date d'expiration d'un enrôlement de campagne, `months` mois calendaires après l'activation. */
export function launchExpiry(activatedAt: Date, months: number): Date {
  return addCalendarMonths(activatedAt, months)
}

/** Jours entiers restants avant `expiresAt` (0 si dépassé). */
export function daysUntil(expiresAt: Date, now: Date = new Date()): number {
  const ms = expiresAt.getTime() - now.getTime()
  return ms <= 0 ? 0 : Math.ceil(ms / 86_400_000)
}

/** L'enrôlement a-t-il expiré ? */
export function isLaunchExpired(expiresAt: Date, now: Date = new Date()): boolean {
  return now.getTime() >= expiresAt.getTime()
}

/** Paliers de rappel d'expiration par défaut (en jours avant la fin). */
export const LAUNCH_REMINDER_DAYS = [30, 15, 7, 3, 1, 0] as const

/**
 * Palier de rappel à envoyer pour `daysLeft` jours restants, ou null si aucun.
 * `lastSent` = dernier palier déjà notifié (idempotence). On ne renvoie un palier
 * que s'il est strictement plus urgent (plus petit) que le dernier envoyé.
 * `reminderDays` est configurable par campagne (admin) ; défaut = LAUNCH_REMINDER_DAYS.
 */
export function dueLaunchReminder(
  daysLeft: number,
  lastSent: number | null,
  reminderDays: readonly number[] = LAUNCH_REMINDER_DAYS,
): number | null {
  const palier = reminderDays.find((d) => daysLeft <= d && (lastSent === null || d < lastSent))
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

// ── Statuts d'éligibilité d'une entreprise à une campagne (décision serveur uniquement) ──
export type LaunchEligibility =
  | 'eligible'
  | 'already_used'
  | 'offer_disabled'
  | 'offer_not_started'
  | 'offer_ended'
  | 'active_paid_plan'
  | 'company_identity_required'

// ── State machine de la campagne (indépendante des forfaits commerciaux) ──
export type CampaignState = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'cancelled'

/** Statut "effectif" calculé à l'instant `now`, combinant l'état admin et les bornes de dates. */
export type EffectiveCampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended' | 'cancelled'

/**
 * Calcule le statut effectif d'une campagne à partir de son état admin (`state`)
 * et de ses bornes temporelles (`startsAt`/`endsAt`).
 * Règles (spec §5.3) :
 *  - cancelled/ended/paused/draft : état figé, les dates ne le changent pas.
 *  - scheduled : devient `active` automatiquement une fois `startsAt` atteint
 *    (et tant que `endsAt` n'est pas dépassé), sinon `ended` si `endsAt` est dépassé.
 *  - active : redevient `ended` automatiquement si `endsAt` est dépassé.
 */
export function effectiveCampaignStatus(
  state: CampaignState,
  startsAt: Date | null,
  endsAt: Date | null,
  now: Date = new Date(),
): EffectiveCampaignStatus {
  if (state === 'cancelled' || state === 'ended' || state === 'paused' || state === 'draft') return state
  // state is 'scheduled' or 'active'
  if (endsAt && now >= endsAt) return 'ended'
  if (state === 'scheduled') {
    if (startsAt && now >= startsAt) return 'active'
    return 'scheduled'
  }
  return 'active'
}

/** Transitions admin valides (état → états atteignables). `ended`/`cancelled` sont terminaux. */
const CAMPAIGN_TRANSITIONS: Record<CampaignState, CampaignState[]> = {
  draft:     ['scheduled', 'active', 'cancelled'],
  scheduled: ['draft', 'active', 'cancelled'],
  active:    ['paused', 'ended', 'cancelled'],
  paused:    ['active', 'ended', 'cancelled'],
  ended:     [],
  cancelled: [],
}

/** La transition admin `from` → `to` est-elle autorisée par la state machine ? */
export function canTransitionCampaignState(from: CampaignState, to: CampaignState): boolean {
  return CAMPAIGN_TRANSITIONS[from]?.includes(to) ?? false
}
