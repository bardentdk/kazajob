'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Briefcase, Building2, Shield, Star, Bell, BookOpen, BarChart2, Sparkles, CreditCard } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'
import { useAuth } from '@/features/auth/useAuth'
import { FullPageLoader } from '@/components/ui/LogoLoader'
import { KZ } from '@/lib/constants'

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard',      label: 'Dashboard',        icon: <LayoutDashboard size={16} /> },
  { href: '/admin/analytics',      label: 'Analytics',        icon: <BarChart2 size={16} /> },
  { href: '/admin/users',          label: 'Utilisateurs',     icon: <Users size={16} /> },
  { href: '/admin/jobs',           label: 'Offres',           icon: <Briefcase size={16} /> },
  { href: '/admin/companies',      label: 'Entreprises',      icon: <Building2 size={16} /> },
  { href: '/admin/events',         label: 'KazaEvents',       icon: <Star size={16} /> },
  { href: '/admin/notifications',  label: 'Notifications',    icon: <Bell size={16} /> },
  { href: '/admin/skills',         label: 'Compétences',      icon: <BookOpen size={16} /> },
  { href: '/admin/ai',             label: 'KazaIA Stats',     icon: <Sparkles size={16} /> },
  { href: '/admin/subscriptions',  label: 'Abonnements',      icon: <CreditCard size={16} /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [profile, loading, router])

  if (loading || !profile) {
    return <FullPageLoader />
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: KZ.cream }}>
      <TopBar
        onMenuClick={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          title="Administration"
          items={NAV_ITEMS}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          footer={
            <div className="p-3 rounded-xl border border-[#1A1410] flex items-center gap-2" style={{ background: KZ.yellowSoft }}>
              <Shield size={16} />
              <span className="text-xs font-bold text-[#1A1410]">Super Admin</span>
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
