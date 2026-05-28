'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, Briefcase, Building2, Shield } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'

const NAV_ITEMS: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { href: '/admin/users', label: 'Utilisateurs', icon: <Users size={16} /> },
  { href: '/admin/jobs', label: 'Offres', icon: <Briefcase size={16} /> },
  { href: '/admin/companies', label: 'Entreprises', icon: <Building2 size={16} /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!profile || profile.role !== 'admin')) {
      router.push('/auth/login')
    }
  }, [profile, loading, router])

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: KZ.cream }}>
        <div className="w-10 h-10 border-2 border-[#1A1410] border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: KZ.cream }}>
      <TopBar
        user={{ name: profile.full_name, avatarUrl: profile.avatar_url, color: KZ.yellowSoft }}
        notifCount={0}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          title="Administration"
          items={NAV_ITEMS}
          footer={
            <div className="p-3 rounded-xl border border-[#1A1410] flex items-center gap-2" style={{ background: KZ.yellowSoft }}>
              <Shield size={16} />
              <span className="text-xs font-bold text-[#1A1410]">Super Admin</span>
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
