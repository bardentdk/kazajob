'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Logo } from './Logo'
import { ArrowRight } from 'lucide-react'

const NAV_LINKS = [
  { href: '/candidate/jobs', label: 'Offres' },
  { href: '#entreprises', label: 'Entreprises' },
  { href: '#conseils', label: 'Conseils' },
  { href: '/auth/register?role=recruiter', label: 'Recruteurs' },
]

export function NavLanding() {
  return (
    <header className="h-[72px] px-10 border-b border-[#1A1410] bg-[#FFF7EE] flex items-center gap-6 sticky top-0 z-50">
      <Logo size={36} />

      <nav className="flex gap-6 ml-7">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm font-semibold text-[#2A2018] hover:text-[#FF6B35] transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <Link href="/auth/login">
          <Button kind="ghost" size="md">Connexion</Button>
        </Link>
        <Link href="/auth/register">
          <Button kind="primary" size="md" iconRight={<ArrowRight size={14} />}>Anou commencé</Button>
        </Link>
      </div>
    </header>
  )
}
