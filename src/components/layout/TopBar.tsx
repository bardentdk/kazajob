'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Menu, LogOut, User, Settings, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Logo } from './Logo'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'

interface TopBarProps {
  notifCount?: number
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  onMenuClick?: () => void
}

export function TopBar({ notifCount = 0, searchPlaceholder, onSearch, onMenuClick }: TopBarProps) {
  const { profile, signOut } = useAuth()
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setProfileOpen(false)
    router.push('/')
  }

  const profilePath = profile?.role === 'recruiter'
    ? '/recruiter/dashboard'
    : profile?.role === 'admin'
      ? '/admin/dashboard'
      : '/candidate/profile'

  return (
    <header className="h-14 lg:h-16 px-4 border-b border-[#1A1410] bg-white flex items-center gap-3 shrink-0 z-10">
      {/* Hamburger mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-[#1A1410] bg-[#FFF7EE] shrink-0"
      >
        <Menu size={16} />
      </button>

      <div className="lg:hidden">
        <Logo size={24} />
      </div>
      <div className="hidden lg:block">
        <Logo size={28} />
      </div>

      {/* Barre de recherche */}
      {searchPlaceholder && (
        <div className="hidden sm:flex flex-1 max-w-sm">
          <div className="flex items-center gap-2 h-9 px-3 bg-[#FFF7EE] border border-[#1A1410] rounded-lg text-sm text-[#6B5A4A] w-full">
            <Search size={15} className="shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none placeholder:text-[#6B5A4A] text-[#2A2018]"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-[#FFF7EE] border border-[#1A1410] hover:bg-[#FBEFE0] transition-colors">
          <Bell size={15} />
          {notifCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF6B35] border border-[#1A1410] text-[9px] font-bold text-[#1A1410] flex items-center justify-center">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </button>

        {/* Avatar + dropdown profil */}
        {profile && (
          <div className="relative">
            <button
              onClick={() => setProfileOpen(v => !v)}
              className="flex items-center gap-2 px-2 py-1 rounded-xl border border-[#1A1410] hover:bg-[#FBEFE0] transition-colors"
              style={{ background: KZ.paper }}
            >
              <Avatar name={profile.full_name} src={profile.avatar_url} size={28} color={KZ.orangeSoft} badge />
              <span className="hidden md:block text-sm font-bold text-[#1A1410] max-w-[100px] truncate">
                {profile.full_name.split(' ')[0]}
              </span>
              <ChevronDown size={13} className="hidden md:block text-[#6B5A4A]" />
            </button>

            {profileOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-56 z-40 rounded-xl border border-[#1A1410] overflow-hidden"
                  style={{ background: KZ.paper, boxShadow: '4px 4px 0 #1A1410' }}
                >
                  {/* Header dropdown */}
                  <div className="px-4 py-3 border-b border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                    <div className="text-xs font-bold text-[#1A1410] truncate">{profile.full_name}</div>
                    <div className="text-[11px] text-[#6B5A4A] truncate">{profile.email}</div>
                    <div className="text-[10px] font-bold mt-0.5 capitalize" style={{ color: KZ.orange }}>{profile.role}</div>
                  </div>

                  {/* Actions */}
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <Link
                      href={profilePath}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1A1410] hover:bg-[#FBEFE0] transition-colors"
                    >
                      <User size={15} className="text-[#6B5A4A]" />
                      Mon profil
                    </Link>
                    <Link
                      href={profile.role === 'recruiter' ? '/recruiter/dashboard' : profile.role === 'admin' ? '/admin/dashboard' : '/candidate/dashboard'}
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1A1410] hover:bg-[#FBEFE0] transition-colors"
                    >
                      <Settings size={15} className="text-[#6B5A4A]" />
                      Tableau de bord
                    </Link>

                    <div className="h-px bg-[#E8DDC9] my-1" />

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut size={15} />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
