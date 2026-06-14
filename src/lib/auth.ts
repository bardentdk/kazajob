/**
 * KAZAJOB — Configuration Auth.js (NextAuth v5)
 * Credentials (email + mot de passe), sessions JWT.
 * `profiles` = table utilisateur (colonne `password_hash`).
 */
import NextAuth, { type NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import LinkedIn from 'next-auth/providers/linkedin'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'

// Providers OAuth activés seulement si leurs identifiants sont configurés.
const oauthProviders: NextAuthConfig['providers'] = []
if (process.env.AUTH_GOOGLE_ID)   oauthProviders.push(Google({ allowDangerousEmailAccountLinking: true }))
if (process.env.AUTH_LINKEDIN_ID) oauthProviders.push(LinkedIn({ allowDangerousEmailAccountLinking: true }))

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
    ...oauthProviders,
  ],
  callbacks: {
    // À la connexion OAuth : crée le profil s'il n'existe pas (rattachement par email).
    async signIn({ user, account }) {
      if (!account || account.provider === 'credentials') return true
      const email = user.email?.toLowerCase().trim()
      if (!email) return false

      const [existing] = await db
        .select({ id: profiles.id })
        .from(profiles).where(eq(profiles.email, email)).limit(1)

      if (!existing) {
        // Rôle voulu (déposé en cookie avant la redirection, sinon candidat).
        let role = 'candidate'
        try {
          const { cookies } = await import('next/headers')
          const store = await cookies()
          if (store.get('kazajob_signup_role')?.value === 'recruiter') role = 'recruiter'
        } catch { /* cookie indisponible → candidat */ }

        await db.insert(profiles).values({
          email,
          fullName: user.name ?? email.split('@')[0],
          avatarUrl: user.image ?? null,
          role,
        })
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        // OAuth : l'id/rôle viennent de NOTRE table profiles (résolus par email).
        if (account && account.provider !== 'credentials') {
          const email = (user.email ?? '').toLowerCase()
          const [p] = await db
            .select({ id: profiles.id, role: profiles.role })
            .from(profiles).where(eq(profiles.email, email)).limit(1)
          if (p) { token.id = p.id; token.role = p.role }
        } else {
          token.id = user.id
          token.role = user.role
        }
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
