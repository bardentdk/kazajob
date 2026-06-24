/**
 * KAZAJOB — Seed (données RÉELLES uniquement, importées des constantes du produit).
 * Lancement : npx tsx --env-file=.env.local src/lib/db/seed.ts
 * Aucune donnée fictive (pas d'offres/entreprises/candidats de démo).
 */
import { like, or } from 'drizzle-orm'
import { db } from './index'
import { profiles, skills, subscriptionPlans } from './schema'
import { SUBSCRIPTION_PLANS } from '../constants'
import { PROFESSION_CATEGORIES } from '../onboarding-categories'

// Comptes de test créés pendant la migration (à purger).
const TEST_EMAIL_PATTERNS = ['test+%', 'secc+%', 'secr+%', 'sect+%', 'recru+%']

async function main() {
  // 1. Purge des comptes de test (cascade → entreprises/offres/candidatures liées).
  const deleted = await db
    .delete(profiles)
    .where(or(...TEST_EMAIL_PATTERNS.map((p) => like(profiles.email, p))))
    .returning({ email: profiles.email })
  console.log(`🗑️  Comptes de test supprimés : ${deleted.length}`)

  // 2. Plans d'abonnement — grille tarifaire RÉELLE (src/lib/constants), KazaLaunch inclus.
  //    Sur conflit : on met à jour la structure (prix, limites, features, flags de monétisation)
  //    mais PAS la disponibilité pilotée par l'admin (is_active/is_public/is_selectable/dates),
  //    pour ne pas écraser un réglage d'administration à chaque re-seed.
  for (const p of SUBSCRIPTION_PLANS) {
    await db.insert(subscriptionPlans).values({
      id: p.id, name: p.name, priceCts: p.priceCts, maxMembers: p.maxMembers,
      maxJobs: p.maxJobs, partners: p.partners, apiAccess: p.apiAccess,
      trialDays: p.trialDays, highlight: p.highlight, isActive: true,
      isFree: p.isFree, requiresPaymentMethod: p.requiresPaymentMethod,
      durationMonths: p.durationMonths, sortOrder: p.sortOrder,
      isPublic: true, isSelectable: true, isFeatured: p.highlight,
    }).onConflictDoUpdate({
      target: subscriptionPlans.id,
      set: {
        name: p.name, priceCts: p.priceCts, maxMembers: p.maxMembers, maxJobs: p.maxJobs,
        partners: p.partners, apiAccess: p.apiAccess, trialDays: p.trialDays, highlight: p.highlight,
        isFree: p.isFree, requiresPaymentMethod: p.requiresPaymentMethod,
        durationMonths: p.durationMonths, sortOrder: p.sortOrder, updatedAt: new Date(),
      },
    })
  }
  console.log(`💳 Plans d'abonnement : ${SUBSCRIPTION_PLANS.length}`)

  // 3. Référentiel de compétences — taxonomie RÉELLE (onboarding-categories).
  const names = [...new Set(PROFESSION_CATEGORIES.flatMap((c) => c.skills))]
  for (const name of names) {
    await db.insert(skills).values({ name }).onConflictDoNothing()
  }
  console.log(`🧩 Compétences (référentiel) : ${names.length}`)
}

main()
  .then(() => { console.log('✅ Seed terminé'); process.exit(0) })
  .catch((e) => { console.error('❌ Seed échoué :', e); process.exit(1) })
