import { NavLanding } from './NavLanding'
import { Footer } from './Footer'
import { KZ } from '@/lib/constants'

/** Coquille publique (navbar + contenu + footer) pour les pages hors app. */
export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: KZ.cream }}>
      <NavLanding />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
