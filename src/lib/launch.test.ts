/**
 * Tests purs de la logique KazaLaunch (dates, rappels, éligibilité globale).
 * Lancement : npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addCalendarMonths, launchExpiry, daysUntil, isLaunchExpired,
  dueLaunchReminder, launchAlertLevel, launchGloballyAvailable, LAUNCH_DURATION_MONTHS,
} from './launch'

test('durée KazaLaunch = 3 mois', () => {
  assert.equal(LAUNCH_DURATION_MONTHS, 3)
})

test('addCalendarMonths : cas standard', () => {
  const d = addCalendarMonths(new Date('2026-06-24T10:00:00Z'), 3)
  assert.equal(d.getUTCFullYear(), 2026)
  assert.equal(d.getUTCMonth(), 8) // septembre (0-indexé)
  assert.equal(d.getUTCDate(), 24)
})

test('addCalendarMonths : borne au dernier jour valide (31 janv. +1 = 28 févr.)', () => {
  const d = addCalendarMonths(new Date('2026-01-31T12:00:00Z'), 1)
  assert.equal(d.getUTCMonth(), 1)  // février
  assert.equal(d.getUTCDate(), 28)  // 2026 non bissextile
})

test('addCalendarMonths : 30 nov. +3 = 28 févr.', () => {
  const d = addCalendarMonths(new Date('2025-11-30T00:00:00Z'), 3)
  assert.equal(d.getUTCMonth(), 1)
  assert.equal(d.getUTCDate(), 28)
})

test('launchExpiry = activation + 3 mois', () => {
  const exp = launchExpiry(new Date('2026-07-12T08:00:00Z'))
  assert.equal(exp.getUTCMonth(), 9) // octobre
  assert.equal(exp.getUTCDate(), 12)
})

test('daysUntil / isLaunchExpired', () => {
  const now = new Date('2026-06-24T00:00:00Z')
  assert.equal(daysUntil(new Date('2026-07-01T00:00:00Z'), now), 7)
  assert.equal(daysUntil(new Date('2026-06-20T00:00:00Z'), now), 0)
  assert.equal(isLaunchExpired(new Date('2026-06-20T00:00:00Z'), now), true)
  assert.equal(isLaunchExpired(new Date('2026-07-20T00:00:00Z'), now), false)
})

test('dueLaunchReminder : paliers idempotents', () => {
  assert.equal(dueLaunchReminder(40, null), null)      // >30j → aucun rappel
  assert.equal(dueLaunchReminder(30, null), 30)        // J-30
  assert.equal(dueLaunchReminder(20, 30), null)        // palier 15 pas encore atteint
  assert.equal(dueLaunchReminder(15, 30), 15)          // atteint le palier 15
  assert.equal(dueLaunchReminder(15, 15), null)        // déjà envoyé 15 → rien
  assert.equal(dueLaunchReminder(0, 1), 0)             // jour J
  assert.equal(dueLaunchReminder(0, 0), null)          // déjà envoyé jour J
})

test('launchAlertLevel', () => {
  assert.equal(launchAlertLevel(40), 'info')
  assert.equal(launchAlertLevel(20), 'reminder')
  assert.equal(launchAlertLevel(10), 'warning')
  assert.equal(launchAlertLevel(3), 'urgent')
  assert.equal(launchAlertLevel(0), 'expired')
})

test('launchGloballyAvailable : disponibilité globale', () => {
  const base = { isActive: true, isPublic: true, isSelectable: true, startsAt: null, endsAt: null }
  const now = new Date('2026-06-24T00:00:00Z')
  assert.equal(launchGloballyAvailable(base, now), 'ok')
  assert.equal(launchGloballyAvailable({ ...base, isActive: false }, now), 'offer_disabled')
  assert.equal(launchGloballyAvailable({ ...base, isSelectable: false }, now), 'offer_disabled')
  assert.equal(launchGloballyAvailable({ ...base, startsAt: new Date('2026-07-01') }, now), 'offer_not_started')
  assert.equal(launchGloballyAvailable({ ...base, endsAt: new Date('2026-06-01') }, now), 'offer_ended')
})
