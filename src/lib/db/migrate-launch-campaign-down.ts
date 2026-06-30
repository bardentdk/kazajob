/**
 * KAZAJOB — Rollback de la migration « Campagne de lancement ».
 * Supprime les nouvelles tables et restaure les colonnes/table de l'ancien mécanisme
 * (vides — aucune donnée n'existait dans l'un ou l'autre schéma au moment du switch).
 *
 * Lancement : npx tsx --env-file=.env.local src/lib/db/migrate-launch-campaign-down.ts
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

const STATEMENTS: string[] = [
  `DROP TABLE IF EXISTS launch_campaign_enrollments`,
  `DROP TABLE IF EXISTS launch_campaigns`,
  // NB : grant_duration_days (ajoutée par migrate-launch-campaign-2.ts) disparaît avec la table.
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS requires_payment_method boolean NOT NULL DEFAULT true`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS duration_months integer NOT NULL DEFAULT 0`,
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS launch_activated_at timestamptz`,
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS launch_expires_at timestamptz`,
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS last_launch_reminder integer`,
  `CREATE TABLE IF NOT EXISTS launch_eligibility (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
     siret text,
     plan_slug text NOT NULL DEFAULT 'launch_free',
     first_activated_at timestamptz NOT NULL DEFAULT now(),
     expires_at timestamptz NOT NULL,
     status text NOT NULL DEFAULT 'active',
     activated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
     revoked_reason text,
     "createdAt" timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS launch_eligibility_company_id_key ON launch_eligibility(company_id)`,
]

async function main() {
  console.log(`⏪ Rollback campagne de lancement — ${STATEMENTS.length} instructions`)
  for (const [i, stmt] of STATEMENTS.entries()) {
    const label = stmt.replace(/\s+/g, ' ').slice(0, 70)
    await sql.query(stmt)
    console.log(`  ✓ [${i + 1}/${STATEMENTS.length}] ${label}…`)
  }
  console.log('✅ Rollback appliqué. NB : le forfait launch_free n\'est PAS recréé (à refaire manuellement si besoin).')
  process.exit(0)
}

main().catch((e) => { console.error('❌ Rollback échoué :', String(e).slice(0, 600)); process.exit(1) })
