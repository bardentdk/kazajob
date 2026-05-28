'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from './Logo'

export interface NavItem {
  href: string
  label: string
  icon: ReactNode
  badge?: number | string
}

interface SidebarProps {
  items: NavItem[]
  title?: string
  footer?: ReactNode
  mobileOpen?: boolean
  onMobileClose?: () => void
}

export function Sidebar({ items, title, footer, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()

  const content = (
    <aside className="w-56 shrink-0 bg-[#FFF7EE] border-r border-[#1A1410] flex flex-col gap-1 p-4 h-full overflow-y-auto">
      {/* Header mobile uniquement */}
      <div className="flex items-center justify-between mb-2 lg:hidden">
        <Logo size={24} />
        {onMobileClose && (
          <button onClick={onMobileClose} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1A1410] bg-white">
            <X size={15} />
          </button>
        )}
      </div>

      {title && (
        <div className="kz-eyebrow text-[#6B5A4A] px-2.5 py-1 mb-1">{title}</div>
      )}

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all border-[1.5px]',
                active
                  ? 'bg-[#1A1410] text-[#FFF7EE] border-[#1A1410] shadow-[2px_2px_0_#FF6B35] font-bold'
                  : 'text-[#2A2018] border-transparent hover:bg-[#FBEFE0] hover:border-[#E8DDC9]'
              )}
            >
              <span className="inline-flex shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && (
                <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]',
                  active ? 'bg-[#FF6B35] text-[#1A1410]' : 'bg-[#FFE0CF] text-[#1A1410]')}>
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="flex-1" />
      {footer}
    </aside>
  )

  return (
    <>
      {/* Desktop : sidebar fixe */}
      <div className="hidden lg:block h-full">{content}</div>

      {/* Mobile : overlay drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-[#1A1410]/50 z-40 lg:hidden" onClick={onMobileClose} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden" style={{ width: 224 }}>
            {content}
          </div>
        </>
      )}
    </>
  )
}
