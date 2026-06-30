/**
 * KAZAJOB — Ajout de la durée d'octroi par entreprise sur une campagne.
 * Chaque entreprise enrôlée bénéficie de N jours à compter de SA propre activation,
 * indépendamment de la fenêtre calendaire globale de la campagne (starts_at/ends_at).
 *
 * Lancement : npx tsx --env-file=.env.local src/lib/db/migrate-launch-campaign-2.ts
 */
import { neon } from '@neondatabase/serverless'

const url = process.env.DATABASE_URL
if (!url) { console.error('❌ DATABASE_URL manquant'); process.exit(1) }
const sql = neon(url)

async function main() {
  await sql.query(`ALTER TABLE launch_campaigns ADD COLUMN IF NOT EXISTS grant_duration_days integer NOT NULL DEFAULT 90`)
  console.log('✅ Colonne grant_duration_days ajoutée (défaut 90 jours ≈ 3 mois).')
  process.exit(0)
}

main().catch((e) => { console.error('❌ Migration échouée :', String(e).slice(0, 600)); process.exit(1) })
