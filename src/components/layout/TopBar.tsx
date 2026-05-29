'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Search, Menu, LogOut, User, Settings, ChevronDown, Check, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import { Logo } from './Logo'
import { Avatar } from '@/components/ui/Avatar'
import { useAuth } from '@/features/auth/useAuth'
import { useNotifications, getNotifIcon } from '@/features/notifications/useNotifications'
import { KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'

interface TopBarProps {
  searchPlaceholder?: string
  onSearch?: (q: string) => void
  onMenuClick?: () => void
}

export function TopBar({ searchPlaceholder, onSearch, onMenuClick }: TopBarProps) {
  const { profile, signOut } = useAuth()
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(profile?.id)
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setProfileOpen(false)
    router.push('/')
  }

  const handleNotifClick = async (n: typeof notifications[0]) => {
    if (!n.read) await markRead(n.id)

    // Navigation contextuelle selon le type
    const data = n.data ?? {}
    if (n.type === 'application_status' && data.applicationId) {
      router.push('/candidate/applications')
    } else if (n.type === 'new_job_match' && data.jobId) {
      router.push(`/candidate/jobs/${data.jobId}`)
    } else if (n.type === 'interview_scheduled') {
      router.push('/candidate/agenda')
    }
    setBellOpen(false)
  }

  const profilePath = profile?.role === 'recruiter'
    ? '/recruiter/dashboard'
    : profile?.role === 'admin' ? '/admin/dashboard' : '/candidate/profile'

  const settingsPath = profile?.role === 'candidate' ? '/candidate/settings' : '/recruiter/dashboard'

  return (
    <header className="h-14 lg:h-16 px-4 border-b border-[#1A1410] bg-white flex items-center gap-3 shrink-0 z-10">
      {/* Hamburger mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-[#1A1410] bg-[#FFF7EE] shrink-0"
      >
        <Menu size={16} />
      </button>

      <div className="lg:hidden"><Logo size={24} /></div>
      <div className="hidden lg:block"><Logo size={28} /></div>

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
        {/* ── Bell — notifications realtime ── */}
        {profile && (
          <div className="relative">
            <button
              onClick={() => { setBellOpen(v => !v); setProfileOpen(false) }}
              className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-[#FFF7EE] border border-[#1A1410] hover:bg-[#FBEFE0] transition-colors"
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#FF6B35] border border-[#1A1410] text-[9px] font-bold text-[#1A1410] flex items-center justify-center px-0.5">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {bellOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setBellOpen(false)} />
                <div
                  className="absolute right-0 top-full mt-2 w-80 z-40 rounded-xl border border-[#1A1410] overflow-hidden"
                  style={{ background: KZ.paper, boxShadow: '4px 4px 0 #1A1410' }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                    <div className="flex items-center gap-2">
                      <Bell size={14} className="text-[#6B5A4A]" />
                      <span className="text-sm font-bold text-[#1A1410]">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410] bg-[#FFE0CF]">
                          {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="flex items-center gap-1 text-[10px] font-bold text-[#6B5A4A] hover:text-[#1A1410] transition-colors"
                      >
                        <CheckCheck size={12} /> Tout lire
                      </button>
                    )}
                  </div>

                  {/* Liste */}
                  <div className="overflow-y-auto max-h-[360px]">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell size={28} className="mx-auto mb-2 text-[#E8DDC9]" />
                        <p className="text-sm text-[#6B5A4A]">Aucune notification</p>
                        <p className="text-xs text-[#6B5A4A] opacity-70 mt-1">Les mises à jour de tes candidatures apparaîtront ici</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className="w-full flex items-start gap-3 px-4 py-3 border-b border-[#F5F0E8] text-left hover:bg-[#FBEFE0] transition-colors"
                          style={{ background: n.read ? 'transparent' : '#FFF7EE' }}
                        >
                          {/* Icône */}
                          <div
                            className="w-8 h-8 rounded-lg border border-[#E8DDC9] flex items-center justify-center text-base shrink-0 mt-0.5"
                            style={{ background: n.read ? KZ.cream2 : KZ.orangeSoft }}
                          >
                            {getNotifIcon(n.type)}
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className={`text-xs font-bold truncate ${n.read ? 'text-[#6B5A4A]' : 'text-[#1A1410]'}`}>
                                {n.title}
                              </span>
                              {!n.read && (
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: KZ.orange }} />
                              )}
                            </div>
                            <p className="text-xs text-[#6B5A4A] mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                            <p className="text-[10px] text-[#6B5A4A] opacity-60 mt-1">{timeAgo(n.created_at)}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  {profile?.role === 'candidate' && (
                    <div className="px-4 py-2.5 border-t border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                      <Link
                        href="/candidate/settings"
                        onClick={() => setBellOpen(false)}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: KZ.orange }}
                      >
                        Gérer les préférences de notifications →
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Avatar + dropdown profil ── */}
        {profile && (
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(v => !v); setBellOpen(false) }}
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
                  <div className="px-4 py-3 border-b border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                    <div className="text-xs font-bold text-[#1A1410] truncate">{profile.full_name}</div>
                    <div className="text-[11px] text-[#6B5A4A] truncate">{profile.email}</div>
                    <div className="text-[10px] font-bold mt-0.5 capitalize" style={{ color: KZ.orange }}>{profile.role}</div>
                  </div>
                  <div className="p-1.5 flex flex-col gap-0.5">
                    <Link href={profilePath} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1A1410] hover:bg-[#FBEFE0] transition-colors">
                      <User size={15} className="text-[#6B5A4A]" />Mon profil
                    </Link>
                    <Link href={settingsPath} onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-[#1A1410] hover:bg-[#FBEFE0] transition-colors">
                      <Settings size={15} className="text-[#6B5A4A]" />Paramètres
                    </Link>
                    <div className="h-px bg-[#E8DDC9] my-1" />
                    <button onClick={handleSignOut}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors w-full text-left">
                      <LogOut size={15} />Se déconnecter
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
