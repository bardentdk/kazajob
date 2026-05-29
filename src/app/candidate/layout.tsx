'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Search, Heart, Briefcase, MessageCircle, User, Sparkles, Calendar, Settings } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'
import { useAuth } from '@/features/auth/useAuth'
import { FullPageLoader } from '@/components/ui/LogoLoader'
import { KZ } from '@/lib/constants'

const NAV_ITEMS: NavItem[] = [
  { href: '/candidate/dashboard',    label: 'Tableau de bord', icon: <LayoutDashboard size={16} /> },
  { href: '/candidate/jobs',         label: 'Rechercher',      icon: <Search size={16} /> },
  { href: '/candidate/favorites',    label: 'Favoris',         icon: <Heart size={16} /> },
  { href: '/candidate/applications', label: 'Candidatures',    icon: <Briefcase size={16} /> },
  { href: '/candidate/messages',     label: 'Messages',        icon: <MessageCircle size={16} /> },
  { href: '/candidate/agenda',       label: 'Entretiens',      icon: <Calendar size={16} /> },
  { href: '/candidate/ia',           label: 'KazaIA',          icon: <Sparkles size={16} /> },
  { href: '/candidate/profile',      label: 'Mon profil',      icon: <User size={16} /> },
  { href: '/candidate/settings',     label: 'Paramètres',      icon: <Settings size={16} /> },
]

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, authChecked } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!authChecked) return
    if (!profile) { router.push('/auth/login'); return }
    if (profile.role === 'recruiter') router.push('/recruiter/dashboard')
    if (profile.role === 'admin')     router.push('/admin/dashboard')
  }, [profile, authChecked, router])

  if (!authChecked || loading || !profile) {
    return <FullPageLoader />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: KZ.cream }}>
      <TopBar
        searchPlaceholder="Metier, entreprise, ville..."
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          title="Candidat"
          items={NAV_ITEMS}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          footer={
            <div
              className="p-3.5 rounded-xl border border-[#1A1410] flex gap-2.5 items-center"
              style={{ background: KZ.violet, color: KZ.cream, boxShadow: '3px 3px 0 #1A1410' }}
            >
              <div className="flex-1">
                <div className="text-xs font-bold mb-0.5">Boost IA</div>
                <div className="text-[10px] opacity-80">Niveau {Math.floor((profile.xp ?? 0) / 1000) + 1}</div>
              </div>
              <Sparkles size={18} />
            </div>
          }
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
