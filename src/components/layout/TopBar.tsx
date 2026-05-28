'use client'

import Link from 'next/link'
import { Bell, Search } from 'lucide-react'
import { Logo } from './Logo'
import { Avatar } from '@/components/ui/Avatar'

interface TopBarProps {
  user?: { name: string; avatarUrl?: string | null; color?: string }
  notifCount?: number
  searchPlaceholder?: string
  onSearch?: (q: string) => void
}

export function TopBar({ user, notifCount = 0, searchPlaceholder, onSearch }: TopBarProps) {
  return (
    <header className="h-16 px-5 border-b border-[#1A1410] bg-white flex items-center gap-4 shrink-0 z-10">
      <Logo size={28} />

      {searchPlaceholder && (
        <div className="flex-1 max-w-sm">
          <div className="flex items-center gap-2 h-9 px-3 bg-[#FFF7EE] border border-[#1A1410] rounded-lg text-sm text-[#6B5A4A]">
            <Search size={15} className="shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none placeholder:text-[#6B5A4A] text-[#2A2018]"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="ml-auto flex items-center gap-3">
        <Link
          href="/candidate/messages"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-[#FFF7EE] border border-[#1A1410] hover:bg-[#FBEFE0] transition-colors"
        >
          <Bell size={16} />
          {notifCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-[#FF6B35] border border-[#1A1410] text-[10px] font-bold text-[#1A1410] flex items-center justify-center">
              {notifCount > 9 ? '9+' : notifCount}
            </span>
          )}
        </Link>
        {user && (
          <Avatar
            name={user.name}
            src={user.avatarUrl}
            size={36}
            color={user.color ?? '#FFE0CF'}
            badge
          />
        )}
      </div>
    </header>
  )
}
