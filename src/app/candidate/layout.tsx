'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Search, Heart, Briefcase, MessageCircle, User } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'
import { useAuth } from '@/features/auth/useAuth'
import { Sparkles } from 'lucide-react'
import { KZ } from '@/lib/constants'

const NAV_ITEMS: NavItem[] = [
  { href: '/candidate/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={16} /> },
  { href: '/candidate/jobs', label: 'Rechercher', icon: <Search size={16} /> },
  { href: '/candidate/favorites', label: 'Favoris', icon: <Heart size={16} /> },
  { href: '/candidate/applications', label: 'Candidatures', icon: <Briefcase size={16} /> },
  { href: '/candidate/messages', label: 'Messages', icon: <MessageCircle size={16} /> },
  { href: '/candidate/profile', label: 'Mon profil', icon: <User size={16} /> },
]

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, authChecked } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authChecked) return  // Attendre que la vérification auth soit terminée

    if (!profile) {
      router.push('/auth/login')
      return
    }

    // Un recruteur qui arrive ici → rediriger vers son espace
    if (profile.role === 'recruiter') {
      router.push('/recruiter/dashboard')
    }
    if (profile.role === 'admin') {
      router.push('/admin/dashboard')
    }
  }, [profile, authChecked, router])

  // Loader pendant la vérification auth
  if (!authChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: KZ.cream }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#1A1410] border-t-[#FF6B35] rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#6B5A4A]">Chargement...</p>
        </div>
      </div>
    )
  }

  // Pas encore de profil → loader (évite le flash de redirection)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: KZ.cream }}>
        <div className="w-10 h-10 border-2 border-[#1A1410] border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: KZ.cream }}>
      <TopBar
        user={{ name: profile.full_name, avatarUrl: profile.avatar_url, color: KZ.orangeSoft }}
        notifCount={3}
        searchPlaceholder="Metier, entreprise, ville..."
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          title="Candidat"
          items={NAV_ITEMS}
          footer={
            <div
              className="p-3.5 rounded-xl border border-[#1A1410] flex gap-2.5 items-center"
              style={{ background: KZ.violet, color: KZ.cream, boxShadow: '3px 3px 0 #1A1410' }}
            >
              <div className="flex-1">
                <div className="text-xs font-bold mb-0.5">Boost IA</div>
                <div className="text-[10px] opacity-80">Niveau 3 · 12/30 missions</div>
              </div>
              <Sparkles size={18} />
            </div>
          }
        />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
