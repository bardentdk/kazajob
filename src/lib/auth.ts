/**
 * KAZAJOB — Configuration Auth.js (NextAuth v5)
 * Credentials (email + mot de passe), sessions JWT.
 * `profiles` = table utilisateur (colonne `password_hash`).
 */
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? '').toLowerCase().trim()
        const password = String(creds?.password ?? '')
        if (!email || !password) return null

        const [user] = await db
          .select()
          .from(profiles)
          .where(eq(profiles.email, email))
          .limit(1)

        if (!user?.passwordHash) return null
        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        return { id: user.id, email: user.email, name: user.fullName, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string | undefined
      }
      return session
    },
  },
})

/** Profil complet de l'utilisateur connecté (côté serveur), ou null. */
export async function getCurrentUser() {
  const session = await auth()
  if (!session?.user?.id) return null
  const [user] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, session.user.id))
    .limit(1)
  return user ?? null
}
