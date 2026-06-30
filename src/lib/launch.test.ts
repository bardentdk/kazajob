/**
 * Tests purs de la logique KazaLaunch (dates, rappels, éligibilité globale).
 * Lancement : npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  addCalendarMonths, launchExpiry, daysUntil, isLaunchExpired,
  dueLaunchReminder, launchAlertLevel, effectiveCampaignStatus, canTransitionCampaignState,
} from './launch'

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

test('launchExpiry = activation + N mois (durée fournie par la campagne)', () => {
  const exp = launchExpiry(new Date('2026-07-12T08:00:00Z'), 3)
  assert.equal(exp.getUTCMonth(), 9) // octobre
  assert.equal(exp.getUTCDate(), 12)

  const exp2 = launchExpiry(new Date('2026-07-12T08:00:00Z'), 1)
  assert.equal(exp2.getUTCMonth(), 7) // août
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

test('effectiveCampaignStatus : états figés ignorent les dates', () => {
  const now = new Date('2026-06-24T00:00:00Z')
  for (const state of ['draft', 'paused', 'ended', 'cancelled'] as const) {
    assert.equal(effectiveCampaignStatus(state, new Date('2026-01-01'), new Date('2099-01-01'), now), state)
  }
})

test('effectiveCampaignStatus : scheduled devient active au démarrage, puis ended à l\'échéance', () => {
  const now = new Date('2026-06-24T00:00:00Z')
  assert.equal(effectiveCampaignStatus('scheduled', new Date('2026-07-01'), null, now), 'scheduled')
  assert.equal(effectiveCampaignStatus('scheduled', new Date('2026-06-01'), null, now), 'active')
  assert.equal(effectiveCampaignStatus('scheduled', new Date('2026-06-01'), new Date('2026-06-10'), now), 'ended')
})

test('effectiveCampaignStatus : active redevient ended à l\'échéance', () => {
  const now = new Date('2026-06-24T00:00:00Z')
  assert.equal(effectiveCampaignStatus('active', null, null, now), 'active')
  assert.equal(effectiveCampaignStatus('active', null, new Date('2026-06-01'), now), 'ended')
})

test('canTransitionCampaignState : state machine admin', () => {
  assert.equal(canTransitionCampaignState('draft', 'scheduled'), true)
  assert.equal(canTransitionCampaignState('draft', 'active'), true)
  assert.equal(canTransitionCampaignState('scheduled', 'draft'), true)
  assert.equal(canTransitionCampaignState('active', 'paused'), true)
  assert.equal(canTransitionCampaignState('active', 'ended'), true)
  assert.equal(canTransitionCampaignState('paused', 'active'), true)
  // états terminaux
  assert.equal(canTransitionCampaignState('ended', 'active'), false)
  assert.equal(canTransitionCampaignState('cancelled', 'draft'), false)
  // transitions non prévues
  assert.equal(canTransitionCampaignState('draft', 'paused'), false)
})
