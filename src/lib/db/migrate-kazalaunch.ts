/**
 * KAZAJOB — Migration additive « KazaLaunch » (idempotente).
 *
 * Ajoute les colonnes/tables nécessaires à l'offre gratuite de lancement et à
 * la traçabilité, SANS toucher aux données existantes (ADD COLUMN IF NOT EXISTS,
 * CREATE TABLE IF NOT EXISTS). Sûr à rejouer.
 *
 * Lancement : npx tsx --env-file=.env.local src/lib/db/migrate-kazalaunch.ts
 * Rollback   : voir migrate-kazalaunch-down.ts (drop des colonnes/tables ajoutées).
 *
 * Neon HTTP = 1 instruction par appel → on exécute les DDL séquentiellement.
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

const STATEMENTS: string[] = [
  // subscription_plans — flags de monétisation / pilotage admin
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS requires_payment_method boolean NOT NULL DEFAULT true`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS duration_months integer NOT NULL DEFAULT 0`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_selectable boolean NOT NULL DEFAULT true`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS starts_at timestamptz`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS ends_at timestamptz`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_product_id text`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS stripe_price_id text`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES profiles(id) ON DELETE SET NULL`,
  `ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now()`,

  // company_subscriptions — dates individuelles KazaLaunch
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS launch_activated_at timestamptz`,
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS launch_expires_at timestamptz`,
  `ALTER TABLE company_subscriptions ADD COLUMN IF NOT EXISTS last_launch_reminder integer`,

  // launch_eligibility — historique immuable (1 activation / entreprise)
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

  // audit_logs — traçabilité actions sensibles
  `CREATE TABLE IF NOT EXISTS audit_logs (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
     actor_email text,
     action text NOT NULL,
     target_type text,
     target_id text,
     old_values jsonb,
     new_values jsonb,
     correlation_id text,
     context jsonb,
     "createdAt" timestamptz NOT NULL DEFAULT now()
   )`,
]

async function main() {
  console.log(`🛠️  Migration KazaLaunch — ${STATEMENTS.length} instructions DDL idempotentes`)
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
  console.log('✅ Migration KazaLaunch appliquée.')
  process.exit(0)
}

main().catch((e) => { console.error('❌ Migration échouée :', String(e).slice(0, 400)); process.exit(1) })
