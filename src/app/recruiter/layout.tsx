'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Briefcase, Users, MessageCircle, Plus, Calendar, Star, Building2 } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'
import { useAuth } from '@/features/auth/useAuth'
import { FullPageLoader } from '@/components/ui/LogoLoader'
import { KZ } from '@/lib/constants'

const NAV_ITEMS: NavItem[] = [
  { href: '/recruiter/dashboard',    label: 'Tableau de bord', icon: <LayoutDashboard size={16} /> },
  { href: '/recruiter/jobs',         label: 'Mes offres',       icon: <Briefcase size={16} /> },
  { href: '/recruiter/applications', label: 'Candidatures',     icon: <Users size={16} /> },
  { href: '/recruiter/agenda',       label: 'Agenda',           icon: <Calendar size={16} /> },
  { href: '/recruiter/events',       label: 'KazaEvents',       icon: <Star size={16} /> },
  { href: '/recruiter/company',      label: 'Mon entreprise',   icon: <Building2 size={16} /> },
  { href: '/recruiter/messages',     label: 'Messages',         icon: <MessageCircle size={16} /> },
]

export default function RecruiterLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading, authChecked } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!authChecked) return
    if (!profile) { router.push('/auth/login'); return }
    if (profile.role === 'candidate') router.push('/candidate/dashboard')
  }, [profile, authChecked, router])

  if (!authChecked || loading || !profile) {
    return <FullPageLoader />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: KZ.cream }}>
      <TopBar
        searchPlaceholder="Rechercher un candidat..."
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          title="Recruteur"
          items={NAV_ITEMS}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          footer={
            <a
              href="/recruiter/jobs/new"
              className="flex items-center justify-center gap-2 p-3 rounded-xl border border-[#1A1410] font-bold text-sm transition-all"
              style={{ background: KZ.orange, color: KZ.ink, boxShadow: '3px 3px 0 #1A1410' }}
            >
              <Plus size={16} />
              Nouvelle offre
            </a>
          }
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
