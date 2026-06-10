'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X, ArrowRight, LayoutDashboard, LogOut, User, Sparkles, Building2, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Logo } from './Logo'
import { KZ } from '@/lib/constants'
import { useAuth } from '@/features/auth/useAuth'

type View = 'candidat' | 'entreprise'

// Navigation publique adaptée à l'audience.
const LINKS: Record<View, { href: string; label: string }[]> = {
  candidat: [
    { href: '/candidate/jobs',     label: 'Offres' },
    { href: '/candidate/training', label: 'Formations' },
    { href: '#comment',            label: 'Comment ça marche' },
    { href: '#faq',                label: 'FAQ' },
  ],
  entreprise: [
    { href: '#tarifs-pro',     label: 'Tarifs' },
    { href: '/candidate/jobs', label: 'Voir les offres' },
  ],
}

function ViewToggle({ view, onNavigate }: { view: View; onNavigate?: () => void }) {
  const router = useRouter()
  const go = (v: View) => { onNavigate?.(); router.push(`/?view=${v}`) }
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full border border-[#1A1410] shrink-0" style={{ background: KZ.paper }}>
      <button
        onClick={() => go('candidat')}
        className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold transition-all"
        style={view === 'candidat' ? { background: KZ.orange, color: KZ.ink, boxShadow: '2px 2px 0 #1A1410' } : { color: KZ.mute }}
      >
        <Users size={12} />
        <span className="hidden md:inline">Je cherche un emploi</span><span className="md:hidden">Emploi</span>
      </button>
      <button
        onClick={() => go('entreprise')}
        className="flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-full text-[11px] lg:text-xs font-bold transition-all"
        style={view === 'entreprise' ? { background: KZ.violet, color: 'white', boxShadow: '2px 2px 0 #1A1410' } : { color: KZ.mute }}
      >
        <Building2 size={12} />
        <span className="hidden md:inline">Je recrute</span><span className="md:hidden">Recruter</span>
      </button>
    </div>
  )
}

export function NavLanding({ view = 'candidat' }: { view?: View }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { profile, signOut } = useAuth()
  const router = useRouter()

  const links = LINKS[view]
  const isPro = view === 'entreprise'

  const handleSignOut = async () => {
    await signOut()
    setProfileOpen(false)
    router.push('/')
    router.refresh()
  }

  const dashboardPath = profile?.role === 'recruiter'
    ? '/recruiter/dashboard'
    : profile?.role === 'admin'
      ? '/admin/dashboard'
      : '/candidate/dashboard'

  return (
    <header className="h-[64px] lg:h-[72px] px-4 md:px-8 lg:px-10 border-b border-[#1A1410] bg-[#FFF7EE] flex items-center gap-4 sticky top-0 z-50">
      <Logo size={28} className="lg:scale-[1.15] origin-left" />

      {/* Nav desktop (audience) */}
      <nav className="hidden lg:flex gap-6 ml-7">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm font-semibold text-[#2A2018] hover:text-[#FF6B35] transition-colors">
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        {/* Toggle audience — à côté des boutons de connexion */}
        <div className="hidden sm:block"><ViewToggle view={view} /></div>

        {profile ? (
          /* ── Connecté : avatar + dropdown ── */
          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-[#1A1410] hover:bg-[#FBEFE0] transition-colors"
              style={{ background: KZ.paper }}
            >
              <Avatar name={profile.full_name} src={profile.avatar_url} size={28} color={KZ.orangeSoft} />
              <span className="hidden sm:block text-sm font-bold text-[#1A1410] max-w-[120px] truncate">
                {profile.full_name.split(' ')[0]}
              </span>
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-52 z-40 rounded-xl border border-[#1A1410] overflow-hidden"
                  style={{ background: KZ.paper, boxShadow: '4px 4px 0 #1A1410' }}
                >
                  <div className="px-4 py-3 border-b border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                    <div className="text-xs font-bold text-[#1A1410] truncate">{profile.full_name}</div>
                    <div className="text-[11px] text-[#6B5A4A] truncate">{profile.email}</div>
                  </div>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <Link href={dashboardPath} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1A1410] hover:bg-[#FBEFE0] transition-colors">
                      <LayoutDashboard size={15} className="text-[#6B5A4A]" />
                      Mon espace
                    </Link>
                    <Link href="/candidate/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1A1410] hover:bg-[#FBEFE0] transition-colors">
                      <User size={15} className="text-[#6B5A4A]" />
                      Mon profil
                    </Link>
                    {profile.role === 'candidate' && (
                      <Link href="/candidate/ia" onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-[#1A1410] hover:bg-[#FBEFE0] transition-colors">
                        <Sparkles size={15} color={KZ.violet} />
                        KazaIA
                      </Link>
                    )}
                    <div className="h-px bg-[#E8DDC9] my-1" />
                    <button onClick={handleSignOut}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut size={15} />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── Non connecté : boutons adaptés à l'audience ── */
          <>
            <Link href="/auth/login" className="hidden md:block">
              <Button kind="ghost" size="md">Connexion</Button>
            </Link>
            <Link href={isPro ? '/auth/register?role=recruiter' : '/auth/register'}>
              <Button kind={isPro ? 'violet' : 'primary'} size="sm" className="lg:!text-sm lg:!h-9" iconRight={<ArrowRight size={14} />}>
                <span className="hidden sm:inline">{isPro ? 'Essai gratuit' : 'Alon comencé'}</span>
                <span className="sm:hidden">{isPro ? 'Essai' : 'S\'inscrire'}</span>
              </Button>
            </Link>
          </>
        )}

        {/* Hamburger mobile */}
        <button onClick={() => setDrawerOpen(true)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[#1A1410] bg-white">
          <Menu size={18} />
        </button>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-[#1A1410]/50 z-40 lg:hidden" onClick={() => setDrawerOpen(false)} />
          <div
            className="fixed top-0 right-0 bottom-0 w-[280px] z-50 flex flex-col p-6 lg:hidden border-l border-[#1A1410]"
            style={{ background: KZ.cream, boxShadow: '-4px 0 0 #1A1410' }}
          >
            <div className="flex justify-between items-center mb-6">
              <Logo size={24} />
              <button onClick={() => setDrawerOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1A1410] bg-white">
                <X size={16} />
              </button>
            </div>

            {/* Toggle audience dans le drawer */}
            <div className="mb-4"><ViewToggle view={view} onNavigate={() => setDrawerOpen(false)} /></div>

            {profile && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E8DDC9] mb-4" style={{ background: KZ.cream2 }}>
                <Avatar name={profile.full_name} src={profile.avatar_url} size={36} color={KZ.orangeSoft} />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#1A1410] truncate">{profile.full_name}</div>
                  <div className="text-xs text-[#6B5A4A] capitalize">{profile.role}</div>
                </div>
              </div>
            )}

            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => setDrawerOpen(false)}
                  className="px-3 py-3 text-sm font-semibold text-[#2A2018] hover:bg-[#FBEFE0] rounded-lg transition-colors">
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2.5">
              {profile ? (
                <>
                  <Link href={dashboardPath} onClick={() => setDrawerOpen(false)}>
                    <Button kind="outline" size="lg" full icon={<LayoutDashboard size={16} />}>Mon espace</Button>
                  </Link>
                  <Button kind="danger" size="lg" full icon={<LogOut size={16} />} onClick={handleSignOut}>
                    Se déconnecter
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/auth/login" onClick={() => setDrawerOpen(false)}>
                    <Button kind="outline" size="lg" full>Connexion</Button>
                  </Link>
                  <Link href={isPro ? '/auth/register?role=recruiter' : '/auth/register'} onClick={() => setDrawerOpen(false)}>
                    <Button kind={isPro ? 'violet' : 'primary'} size="lg" full>
                      {isPro ? 'Démarrer l\'essai gratuit' : 'Créer mon compte'}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}
