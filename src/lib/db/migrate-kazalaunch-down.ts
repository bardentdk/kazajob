/**
 * KAZAJOB — Rollback de la migration KazaLaunch (idempotent).
 * Lancement : npx tsx --env-file=.env.local src/lib/db/migrate-kazalaunch-down.ts
 * ⚠️ Supprime les colonnes/tables ajoutées par migrate-kazalaunch.ts (et leurs données).
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

const STATEMENTS: string[] = [
  `DROP TABLE IF EXISTS audit_logs`,
  `DROP TABLE IF EXISTS launch_eligibility`,
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS launch_activated_at`,
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS launch_expires_at`,
  `ALTER TABLE company_subscriptions DROP COLUMN IF EXISTS last_launch_reminder`,
  ...['is_free', 'requires_payment_method', 'duration_months', 'sort_order', 'is_public',
      'is_selectable', 'is_featured', 'starts_at', 'ends_at', 'stripe_product_id',
      'stripe_price_id', 'updated_by', 'updated_at']
    .map((c) => `ALTER TABLE subscription_plans DROP COLUMN IF EXISTS ${c}`),
]

async function main() {
  for (const stmt of STATEMENTS) { await sql.query(stmt); console.log(`  ✓ ${stmt.slice(0, 70)}…`) }
  console.log('✅ Rollback KazaLaunch terminé.')
  process.exit(0)
}
main().catch((e) => { console.error('❌', String(e).slice(0, 400)); process.exit(1) })
