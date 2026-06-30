/**
 * KAZAJOB — Reset de lancement : vide les DONNÉES applicatives, conserve le schéma
 * et les migrations, réinjecte les données système, recrée l'unique administrateur.
 *
 * Lancement :
 *   Dry-run (n'efface RIEN, par défaut sûr) :
 *     npx tsx --env-file=.env.local scripts/reset-launch-database.ts --dry-run
 *   Reset réel (exige les garde-fous) :
 *     ALLOW_DATABASE_RESET=true DATABASE_RESET_CONFIRMATION=RESET_KAZAJOB_FOR_PUBLIC_LAUNCH \
 *       npx tsx --env-file=.env.local scripts/reset-launch-database.ts
 *
 * Garde-fous (sinon → abandon, code de sortie ≠ 0) :
 *   - ALLOW_DATABASE_RESET=true
 *   - DATABASE_RESET_CONFIRMATION === "RESET_KAZAJOB_FOR_PUBLIC_LAUNCH"
 *   - base reconnue (DATABASE_URL pointe une base attendue)
 *   - sauvegarde produite et vérifiée
 *   - pas d'abonnement Stripe actif (sauf ALLOW_ACTIVE_SUBSCRIPTION_RESET=true)
 *   - variables admin présentes et valides
 *
 * Ne JAMAIS afficher le mot de passe. Aucune action destructive côté Stripe.
 */
import type { PgTable } from 'drizzle-orm/pg-core'
import { db } from '../src/lib/db/index'
import {
  messages, conversations, interviews, applications, favorites, jobSkills, candidateSkills,
  talentPool, trainingApplications, trainingOffers, eventRegistrations, events, referrals,
  notifications, bugReports, demoBookings, bookingSlots, pageViews, jobs,
  companyInvitations, companyJoinRequests, companyMembers, companySubscriptions,
  launchCampaignEnrollments, auditLogs, promoCodes, companies, profiles,
} from '../src/lib/db/schema'
import { exportBackup, countRows } from '../src/lib/db/backup-export'
import { stripePreflight } from '../src/lib/db/stripe-preflight'
import { seedSystemData, upsertAdmin, pruneOtherAdmins, assertSingleAdmin } from '../src/lib/db/seed-core'
import { writeAudit } from '../src/lib/queries/audit'

const CONFIRMATION_PHRASE = 'RESET_KAZAJOB_FOR_PUBLIC_LAUNCH'
const EXPECTED_HOST_HINT = process.env.EXPECTED_DB_HOST ?? 'neon.tech'

const DRY_RUN = process.argv.includes('--dry-run')

// Ordre de suppression respectant les clés étrangères (enfants → parents).
// subscription_plans, skills et launch_campaigns NE SONT PAS supprimés (config système,
// pas des données client) — seuls les enrôlements (launch_campaign_enrollments) le sont.
const DELETE_ORDER = [
  { name: 'messages', t: messages }, { name: 'conversations', t: conversations },
  { name: 'interviews', t: interviews }, { name: 'applications', t: applications },
  { name: 'favorites', t: favorites }, { name: 'job_skills', t: jobSkills },
  { name: 'candidate_skills', t: candidateSkills }, { name: 'talent_pool', t: talentPool },
  { name: 'training_applications', t: trainingApplications }, { name: 'training_offers', t: trainingOffers },
  { name: 'event_registrations', t: eventRegistrations }, { name: 'events', t: events },
  { name: 'referrals', t: referrals }, { name: 'notifications', t: notifications },
  { name: 'bug_reports', t: bugReports }, { name: 'demo_bookings', t: demoBookings },
  { name: 'booking_slots', t: bookingSlots }, { name: 'page_views', t: pageViews },
  { name: 'jobs', t: jobs }, { name: 'company_invitations', t: companyInvitations },
  { name: 'company_join_requests', t: companyJoinRequests }, { name: 'company_members', t: companyMembers },
  { name: 'company_subscriptions', t: companySubscriptions },
  { name: 'launch_campaign_enrollments', t: launchCampaignEnrollments },
  { name: 'audit_logs', t: auditLogs }, { name: 'promo_codes', t: promoCodes },
  { name: 'companies', t: companies },
] satisfies { name: string; t: PgTable }[]

function maskHost(url: string): string {
  try { return new URL(url).host } catch { return '(host illisible)' }
}

function bail(msg: string): never {
  console.error(`\n⛔ ${msg}\n   → Reset abandonné. Aucune donnée supprimée.`)
  process.exit(1)
}

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? ''
  const host = maskHost(dbUrl)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`KAZAJOB — Reset de lancement  ${DRY_RUN ? '[DRY-RUN]' : '[RÉEL]'}`)
  console.log(`Base ciblée : ${host}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // 1. Protection contre la mauvaise base.
  if (!dbUrl) bail('DATABASE_URL manquant.')
  if (!host.includes(EXPECTED_HOST_HINT)) {
    bail(`L'hôte « ${host} » ne correspond pas à la base attendue (${EXPECTED_HOST_HINT}).`)
  }

  // 2. Décompte avant.
  const before = await countRows()
  const total = Object.values(before).reduce((a, b) => a + b, 0)
  console.log('📊 Lignes par table (avant) :')
  for (const [k, v] of Object.entries(before).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${String(v).padStart(6)}  ${k}`)
  }
  console.log(`   ── total : ${total} lignes\n`)

  // 3. Vérification Stripe.
  const stripe = await stripePreflight()
  console.log(`💳 Stripe : ${stripe.note}`)
  if (stripe.active.length > 0) {
    console.log('   Abonnements détectés :')
    for (const s of stripe.active) console.log(`     - ${s.id} (${s.status})`)
  }

  // 4. Sauvegarde (toujours produite — read-only — pour prouver le mécanisme).
  const backup = await exportBackup()
  console.log(`\n💾 Sauvegarde : ${backup.file}`)
  console.log(`   ${backup.total} lignes · ${(backup.bytes / 1024).toFixed(1)} Ko · vérifiée ✔`)

  // 5. Variables admin (validées sans afficher la valeur).
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim()
  const adminPwd = process.env.ADMIN_PWD ?? process.env.ADMIN_PASSWORD ?? process.env.KAZAJOB_ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME ?? process.env.KAZAJOB_ADMIN_DISPLAY_NAME
  const adminVarsOk = !!adminEmail && !!adminPwd && adminPwd.length >= 8
  console.log(`\n👤 Variables admin : ${adminVarsOk ? 'présentes et valides ✔' : 'MANQUANTES ou invalides ✘'}`)
  if (adminPwd && adminPwd.length < 16) console.log('   ⚠️ Mot de passe < 16 caractères (recommandé ≥ 16).')

  // ── DRY-RUN : on s'arrête ici, rien n'est supprimé ──
  if (DRY_RUN) {
    console.log('\n🧪 DRY-RUN : aucune suppression effectuée.')
    console.log('   Tables qui seraient vidées (ordre FK) :')
    console.log('     ' + DELETE_ORDER.map((d) => d.name).join(', ') + (process.env.RESET_AUTH_USERS !== 'false' ? ', profiles' : ''))
    console.log('   Conservées : subscription_plans, skills (réinjectées) + launch_campaigns (config) + compte admin unique.')
    console.log(`\n   Pour exécuter réellement : ALLOW_DATABASE_RESET=true DATABASE_RESET_CONFIRMATION=${CONFIRMATION_PHRASE}`)
    process.exit(0)
  }

  // ── RESET RÉEL : garde-fous obligatoires ──
  if (process.env.ALLOW_DATABASE_RESET !== 'true') bail('ALLOW_DATABASE_RESET=true requis pour un reset réel.')
  if (process.env.DATABASE_RESET_CONFIRMATION !== CONFIRMATION_PHRASE) {
    bail(`DATABASE_RESET_CONFIRMATION incorrecte (attendu exactement : ${CONFIRMATION_PHRASE}).`)
  }
  if (!adminVarsOk) bail('Variables admin manquantes/invalides : impossible de recréer l\'administrateur.')
  if (stripe.active.length > 0 && process.env.ALLOW_ACTIVE_SUBSCRIPTION_RESET !== 'true') {
    bail(`${stripe.active.length} abonnement(s) Stripe actif(s). Définir ALLOW_ACTIVE_SUBSCRIPTION_RESET=true pour forcer (orphelins possibles).`)
  }

  // 6. Suppression (séquentielle, ordre FK).
  console.log('\n🗑️  Suppression des données applicatives…')
  const deleted: Record<string, number> = {}
  for (const { name, t } of DELETE_ORDER) {
    const r = await db.delete(t).returning()
    deleted[name] = r.length
    if (r.length) console.log(`   - ${name}: ${r.length}`)
  }
  if (process.env.RESET_AUTH_USERS !== 'false') {
    const r = await db.delete(profiles).returning({ id: profiles.id })
    deleted['profiles'] = r.length
    console.log(`   - profiles (auth): ${r.length}`)
  } else {
    console.log('   - profiles conservés (RESET_AUTH_USERS=false)')
  }

  // 7. Réinjection des données système.
  console.log('\n🌱 Réinjection des données système…')
  const sys = await seedSystemData()
  console.log(`   forfaits: ${sys.plans} · compétences: ${sys.skills}`)

  // 8. Recréation de l'unique administrateur (idempotent).
  const admin = await upsertAdmin({ email: adminEmail!, password: adminPwd!, fullName: adminName })
  const pruned = await pruneOtherAdmins(adminEmail!)
  const check = await assertSingleAdmin(adminEmail!)
  console.log(`\n👤 Admin ${admin.created ? 'créé' : 'mis à jour'} : ${admin.email} (id ${admin.id.slice(0, 8)}…)`)
  if (pruned > 0) console.log(`   ${pruned} autre(s) admin supprimé(s).`)
  if (!check.ok) bail(`Cohérence admin invalide (admins=${check.admins}, parasites=${check.strays.join(',')}).`)
  console.log('   ✔ Exactement un super administrateur.')

  // 9. Audit (sans secret).
  await writeAudit({
    actorId: admin.id, actorEmail: admin.email, action: 'db.reset',
    targetType: 'system',
    newValues: { deleted, reseeded: sys, backup: backup.file, stripeActive: stripe.active.length },
  })

  // 10. Vérification post-reset.
  const after = await countRows()
  const residual = Object.entries(after).filter(([k, v]) => v > 0 && !['subscription_plans', 'skills', 'profiles', 'audit_logs', 'launch_campaigns'].includes(k))
  console.log('\n✅ Reset terminé.')
  console.log(`   profiles=${after['profiles']} (admin) · subscription_plans=${after['subscription_plans']} · skills=${after['skills']}`)
  if (residual.length) {
    console.log('   ⚠️ Tables non vides inattendues : ' + residual.map(([k, v]) => `${k}=${v}`).join(', '))
  }
  process.exit(0)
}

main().catch((e) => { console.error('\n❌ Reset échoué :', String(e).slice(0, 500)); process.exit(1) })
