'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Briefcase, Users, MessageCircle, Plus, Calendar, Star, Building2, GraduationCap } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { Sidebar, type NavItem } from '@/components/layout/Sidebar'
import { useAuth } from '@/features/auth/useAuth'
import { FullPageLoader } from '@/components/ui/LogoLoader'
import { KZ } from '@/lib/constants'

const NAV_ITEMS: NavItem[] = [
  { href: '/recruiter/dashboard',    label: 'Tableau de bord', icon: <LayoutDashboard size={16} /> },
  { href: '/recruiter/jobs',         label: 'Mes offres',       icon: <Briefcase size={16} /> },
  { href: '/recruiter/training',     label: 'Formations',       icon: <GraduationCap size={16} /> },
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
  const [company, setCompany] = useState<{ name: string; logo_url: string | null } | null>(null)

  useEffect(() => {
    if (!profile?.company_id) return
    fetch(`/api/companies/${profile.company_id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.company) setCompany(d.company) })
      .catch(() => {})
  }, [profile?.company_id])

  useEffect(() => {
    if (!authChecked) return
    if (!profile) { router.push('/auth/login'); return }
    if (profile.role === 'candidate') router.push('/candidate/dashboard')
    if (profile.role === 'admin')     router.push('/admin/dashboard')
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
          title={company?.name ?? 'Recruteur'}
          items={NAV_ITEMS}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          footer={
            <div className="flex flex-col gap-2">
              {/* Carte entreprise */}
              {company && (
                <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                  {company.logo_url ? (
                    <img src={company.logo_url} alt="" className="w-8 h-8 rounded-lg border border-[#1A1410] object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg border border-[#1A1410] flex items-center justify-center text-[11px] font-extrabold shrink-0"
                      style={{ background: KZ.orangeSoft }}>
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs font-bold text-[#1A1410] truncate">{company.name}</span>
                </div>
              )}
              {/* Utilisateur connecté */}
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                <div className="w-7 h-7 rounded-full border border-[#1A1410] flex items-center justify-center text-[10px] font-extrabold shrink-0"
                  style={{ background: KZ.violetSoft, color: KZ.violet }}>
                  {profile?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-[#1A1410] truncate">{profile?.full_name}</span>
              </div>
              {/* CTA nouvelle offre */}
              <a
                href="/recruiter/jobs/new"
                className="flex items-center justify-center gap-2 p-3 rounded-xl border border-[#1A1410] font-bold text-sm transition-all"
                style={{ background: KZ.orange, color: KZ.ink, boxShadow: '3px 3px 0 #1A1410' }}
              >
                <Plus size={16} />
                Nouvelle offre
              </a>
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
