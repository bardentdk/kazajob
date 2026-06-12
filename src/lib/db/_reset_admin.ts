/** Réinitialise le mot de passe admin. Jetable. */
import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from './index'
import { profiles } from './schema'

const EMAIL = 'kazajob.re@gmail.com'

async function main() {
  const pw = 'Kaza-' + randomBytes(5).toString('base64url') + '-974'
  const hash = await bcrypt.hash(pw, 10)
  const r = await db.update(profiles)
    .set({ passwordHash: hash, role: 'admin' })
    .where(eq(profiles.email, EMAIL))
    .returning({ email: profiles.email })
  if (!r.length) { console.log('❌ Admin introuvable :', EMAIL); process.exit(1) }
  console.log('✅ Mot de passe réinitialisé')
  console.log('   Email    : ' + EMAIL)
  console.log('   Nouveau MDP : ' + pw)
  process.exit(0)
}
main().catch((e) => { console.error('❌', String(e).slice(0, 200)); process.exit(1) })
