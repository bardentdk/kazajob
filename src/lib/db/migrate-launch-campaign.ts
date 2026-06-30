/**
 * KAZAJOB — Migration « Campagne de lancement » (remplace le mécanisme KazaLaunch-as-plan).
 *
 * KazaLaunch avait été modélisé par erreur comme un forfait commercial (`launch_free`
 * dans `subscription_plans`). Cette migration le retire et le remplace par une
 * campagne administrable, indépendante des abonnements (`launch_campaigns` +
 * `launch_campaign_enrollments`).
 *
 * Garde de sécurité : aborte si une entreprise a déjà utilisé `launch_free` (vérifié
 * en amont par audit le 2026-06-25 : 0 usage). Aucune donnée payante n'est touchée.
 *
 * Lancement : npx tsx --env-file=.env.local src/lib/db/migrate-launch-campaign.ts
 * Rollback   : src/lib/db/migrate-launch-campaign-down.ts
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

async function guardZeroUsage() {
  const [a] = await sql`SELECT count(*)::int AS n FROM company_subscriptions WHERE plan_id = 'launch_free'`
  const [b] = await sql`SELECT count(*)::int AS n FROM launch_eligibility`
  if (Number(a.n) > 0 || Number(b.n) > 0) {
    throw new Error(
      `Migration abandonnée : usage réel détecté (company_subscriptions=${a.n}, launch_eligibility=${b.n}). ` +
      `Cette migration suppose 0 usage (vérifié le 2026-06-25). Adapter la stratégie avant de continuer.`,
    )
  }
}

const STATEMENTS: string[] = [
  // ── Nouvelle table : configuration de campagne (1..n lignes, admin) ──
  `CREATE TABLE IF NOT EXISTS launch_campaigns (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     name text NOT NULL,
     slug text NOT NULL UNIQUE,
     state text NOT NULL DEFAULT 'draft',
     starts_at timestamptz,
     ends_at timestamptz,
     end_mode text NOT NULL DEFAULT 'fixed_date',
     free_publishing_enabled boolean NOT NULL DEFAULT true,
     new_subscriptions_enabled boolean NOT NULL DEFAULT true,
     jobs_allowed boolean NOT NULL DEFAULT true,
     trainings_allowed boolean NOT NULL DEFAULT true,
     max_active_jobs_per_company integer NOT NULL DEFAULT 3,
     max_active_trainings_per_company integer NOT NULL DEFAULT 3,
     require_admin_approval boolean NOT NULL DEFAULT false,
     auto_publish boolean NOT NULL DEFAULT true,
     end_of_campaign_behavior text NOT NULL DEFAULT 'keep_until_listing_expiry',
     reminder_days_before_end integer[] NOT NULL DEFAULT '{30,15,7,3,1,0}',
     recruiter_message text,
     created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
     updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
     version integer NOT NULL DEFAULT 1,
     "createdAt" timestamptz NOT NULL DEFAULT now(),
     "updatedAt" timestamptz NOT NULL DEFAULT now()
   )`,

  // ── Nouvelle table : enrôlement (CampaignEnrollment) — remplace launch_eligibility ──
  `CREATE TABLE IF NOT EXISTS launch_campaign_enrollments (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     campaign_id uuid NOT NULL REFERENCES launch_campaigns(id) ON DELETE CASCADE,
     company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
     siret text,
     first_activated_at timestamptz NOT NULL DEFAULT now(),
     expires_at timestamptz NOT NULL,
     status text NOT NULL DEFAULT 'active',
     last_reminder_milestone integer,
     activated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
     revoked_reason text,
     "createdAt" timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS launch_campaign_enrollments_company_campaign_key
     ON launch_campaign_enrollments(company_id, campaign_id)`,
  // Au plus une campagne active par entreprise à la fois (garde-fou applicatif renforcé en base).
  `CREATE UNIQUE INDEX IF NOT EXISTS launch_campaign_enrollments_one_active_per_company
     ON launch_campaign_enrollments(company_id) WHERE status = 'active'`,

  // ── Nettoyage : retrait du résidu « launch_free comme forfait » ──
  `DELETE FROM subscription_plans WHERE id = 'launch_free'`,
  `ALTER TABLE subscription_plans DROP COLUMN IF EXISTS is_free`,
  `ALTER TABLE subscription_plans DROP COLUMN IF EXISTS requires_payment_method`,
  `ALTER TABLE subscription_plans DROP COLUMN IF EXISTS duration_months`,
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS launch_activated_at`,
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS launch_expires_at`,
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS last_launch_reminder`,
  `DROP TABLE IF EXISTS launch_eligibility`,
]

async function main() {
  console.log('🔎 Vérification usage réel avant migration…')
  await guardZeroUsage()
  console.log('✅ 0 usage confirmé — migration sûre.')

  console.log(`🛠️  Migration campagne de lancement — ${STATEMENTS.length} instructions DDL`)
  for (const [i, stmt] of STATEMENTS.entries()) {
    const label = stmt.replace(/\s+/g, ' ').slice(0, 70)
    try {
      await sql.query(stmt)
      console.log(`  ✓ [${i + 1}/${STATEMENTS.length}] ${label}…`)
    } catch (e) {
      console.error(`  ✗ [${i + 1}/${STATEMENTS.length}] ${label}…`)
      throw e
    }
  }

  // Campagne par défaut en DRAFT (jamais auto-activée en prod).
  await sql`
    INSERT INTO launch_campaigns (name, slug, state)
    VALUES ('KazaLaunch', 'kazalaunch', 'draft')
    ON CONFLICT (slug) DO NOTHING
  `
  console.log('✅ Migration campagne de lancement appliquée. Campagne "kazalaunch" créée en DRAFT (inactive).')
  process.exit(0)
}

main().catch((e) => { console.error('❌ Migration échouée :', String(e).slice(0, 600)); process.exit(1) })
