/**
 * Tests du moteur de droits (résolution pure par forfait).
 * Lancement : npm test  (charge .env.local pour l'import de db, sans requête réelle).
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolvePlanEntitlements, planHasFeature, FEATURES } from './entitlements'
import { LAUNCH_PLAN_ID } from './constants'

test('KazaLaunch : limites et droits de base', () => {
  const e = resolvePlanEntitlements(LAUNCH_PLAN_ID)
  assert.equal(e.isFree, true)
  assert.equal(e.maxJobs, 3)
  assert.equal(e.maxMembers, 1)
  assert.equal(e.features.has(FEATURES.applicationsReceive), true)
  assert.equal(e.features.has(FEATURES.messagingAccess), true)
  assert.equal(e.features.has(FEATURES.analyticsBasic), true)
  // Aucune fonctionnalité premium
  assert.equal(e.features.has(FEATURES.analyticsAdvanced), false)
  assert.equal(e.features.has(FEATURES.aiApplicationSummary), false)
  assert.equal(e.features.has(FEATURES.apiAccess), false)
})

test('Starter : payant, pas de premium', () => {
  const e = resolvePlanEntitlements('starter')
  assert.equal(e.isFree, false)
  assert.equal(e.maxJobs, 5)
  assert.equal(planHasFeature('starter', FEATURES.teamManagement), false)
})

test('Pro : analytics avancés + IA + équipe', () => {
  assert.equal(planHasFeature('pro', FEATURES.analyticsAdvanced), true)
  assert.equal(planHasFeature('pro', FEATURES.aiApplicationSummary), true)
  assert.equal(planHasFeature('pro', FEATURES.teamManagement), true)
  assert.equal(planHasFeature('pro', FEATURES.apiAccess), false)
  assert.equal(resolvePlanEntitlements('pro').maxJobs, 15)
})

test('Enterprise : API + ATS + multi-entreprises + illimité', () => {
  const e = resolvePlanEntitlements('enterprise')
  assert.equal(e.maxJobs, -1)
  assert.equal(e.features.has(FEATURES.apiAccess), true)
  assert.equal(e.features.has(FEATURES.atsIntegration), true)
  assert.equal(e.features.has(FEATURES.accountMultiCompany), true)
})

test('forfait inconnu → repli Starter (jamais KazaLaunch gratuit)', () => {
  const e = resolvePlanEntitlements('inconnu')
  assert.equal(e.planId, 'starter')
  assert.equal(e.isFree, false)
})

test('héritage croissant des droits', () => {
  const order = ['starter', 'pro', 'business', 'enterprise'] as const
  for (let i = 1; i < order.length; i++) {
    const lower = resolvePlanEntitlements(order[i - 1]).features
    const higher = resolvePlanEntitlements(order[i]).features
    for (const f of lower) assert.equal(higher.has(f), true, `${order[i]} doit inclure ${f}`)
  }
})
