'use client'

import Link from 'next/link'
import { Bell, Search, Menu } from 'lucide-react'
import { Logo } from './Logo'
import { Avatar } from '@/components/ui/Avatar'

interface TopBarProps {
  user?: { name: string; avatarUrl?: string | null; color?: string }
  notifCount?: number
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  onMenuClick?: () => void
}

export function TopBar({ user, notifCount = 0, searchPlaceholder, onSearch, onMenuClick }: TopBarProps) {
  return (
    <header className="h-14 lg:h-16 px-4 border-b border-[#1A1410] bg-white flex items-center gap-3 shrink-0 z-10">
      {/* Hamburger mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-[#1A1410] bg-[#FFF7EE] shrink-0"
      >
        <Menu size={16} />
      </button>

      <Logo size={24} className="lg:hidden" />
      <Logo size={28} className="hidden lg:inline-flex" />

      {/* Barre de recherche — cachée sur mobile très petit */}
      {searchPlaceholder && (
        <div className="hidden sm:flex flex-1 max-w-sm">
          <div className="flex items-center gap-2 h-9 px-3 bg-[#FFF7EE] border border-[#1A1410] rounded-lg text-sm text-[#6B5A4A] w-full">
            <Search size={15} className="shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none placeholder:text-[#6B5A4A] text-[#2A2018] min-w-0"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        {/* Notifications */}
        <Link
          href="#"
          className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-[#FFF7EE] border border-[#1A1410] hover:bg-[#FBEFE0] transition-colors"
        >
          <Bell size={15} />
          {notifCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#FF6B35] border border-[#1A1410] text-[9px] font-bold text-[#1A1410] flex items-center justify-center">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>
        {user && (
          <Avatar name={user.name} src={user.avatarUrl} size={32} color={user.color ?? '#FFE0CF'} badge />
        )}
      </div>
    </header>
  )
}
