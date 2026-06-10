/**
 * KAZAJOB — Création/maj du compte admin (identifiants réels via variables d'env).
 * Lancement :
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... ADMIN_NAME="..." npx tsx --env-file=.env.local src/lib/db/seed-admin.ts
 * Aucun identifiant en dur dans le code.
 */
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from './index'
import { profiles } from './schema'

const email = process.env.ADMIN_EMAIL?.toLowerCase().trim()
const password = process.env.ADMIN_PASSWORD
const fullName = process.env.ADMIN_NAME?.trim() || 'Admin Kazajob'

async function main() {
  if (!email || !password) { console.error('❌ ADMIN_EMAIL et ADMIN_PASSWORD requis'); process.exit(1) }
  if (password.length < 8) { console.error('❌ Mot de passe trop court (min. 8 caractères)'); process.exit(1) }

  const passwordHash = await bcrypt.hash(password, 10)
  const [existing] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.email, email)).limit(1)

  if (existing) {
    await db.update(profiles)
      .set({ role: 'admin', passwordHash, fullName })
      .where(eq(profiles.id, existing.id))
    console.log(`✅ Compte admin mis à jour : ${email}`)
  } else {
    await db.insert(profiles).values({
      email, passwordHash, fullName, role: 'admin', onboardingCompleted: true,
    })
    console.log(`✅ Compte admin créé : ${email}`)
  }
  process.exit(0)
}

main().catch((e) => { console.error('❌', e); process.exit(1) })
