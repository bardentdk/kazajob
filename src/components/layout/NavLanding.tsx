'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from './Logo'
import { KZ } from '@/lib/constants'

const NAV_LINKS = [
  { href: '/candidate/jobs', label: 'Offres' },
  { href: '#entreprises', label: 'Entreprises' },
  { href: '#comment', label: 'Comment ca marche' },
  { href: '/auth/register?role=recruiter', label: 'Recruteurs' },
]

export function NavLanding() {
  const [open, setOpen] = useState(false)

  return (
    <header className="h-[64px] lg:h-[72px] px-4 md:px-8 lg:px-10 border-b border-[#1A1410] bg-[#FFF7EE] flex items-center gap-4 sticky top-0 z-50">
      <Logo size={28} className="lg:scale-[1.15] origin-left" />

      {/* Nav desktop */}
      <nav className="hidden lg:flex gap-6 ml-7">
        {NAV_LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm font-semibold text-[#2A2018] hover:text-[#FF6B35] transition-colors">
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:gap-3">
        {/* Desktop CTA */}
        <Link href="/auth/login" className="hidden md:block">
          <Button kind="ghost" size="md">Connexion</Button>
        </Link>
        <Link href="/auth/register">
          <Button kind="primary" size="sm" className="lg:!text-sm lg:!h-9" iconRight={<ArrowRight size={14} />}>
            <span className="hidden sm:inline">Anou commencé</span>
            <span className="sm:hidden">Commencer</span>
          </Button>
        </Link>

        {/* Hamburger mobile */}
        <button
          onClick={() => setOpen(true)}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg border border-[#1A1410] bg-white"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Drawer mobile */}
      {open && (
        <>
          <div className="fixed inset-0 bg-[#1A1410]/50 z-40 lg:hidden" onClick={() => setOpen(false)} />
          <div
            className="fixed top-0 right-0 bottom-0 w-[280px] z-50 flex flex-col p-6 lg:hidden border-l border-[#1A1410]"
            style={{ background: KZ.cream, boxShadow: '-4px 0 0 #1A1410' }}
          >
            <div className="flex justify-between items-center mb-8">
              <Logo size={24} />
              <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#1A1410] bg-white">
                <X size={16} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 text-sm font-semibold text-[#2A2018] hover:bg-[#FBEFE0] rounded-lg transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-2.5">
              <Link href="/auth/login" onClick={() => setOpen(false)}>
                <Button kind="outline" size="lg" full>Connexion</Button>
              </Link>
              <Link href="/auth/register" onClick={() => setOpen(false)}>
                <Button kind="primary" size="lg" full>Creer mon compte</Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
