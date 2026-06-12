import type { Metadata } from 'next'
import Link from 'next/link'
import { Newspaper } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Le blog Kazajob — conseils emploi et actualités du marché du travail à La Réunion.',
}

export default function Page() {
  return (
    <PublicShell>
      <div className="max-w-[680px] mx-auto px-4 sm:px-8 py-16 lg:py-24 text-center">
        <div className="w-16 h-16 rounded-2xl border border-[#1A1410] flex items-center justify-center mx-auto mb-6" style={{ background: KZ.yellowSoft }}>
          <Newspaper size={26} className="text-[#1A1410]" />
        </div>
        <h1 className="text-3xl lg:text-[40px] font-extrabold tracking-tight text-[#1A1410] mb-3">Le blog arrive bientôt</h1>
        <p className="text-base text-[#6B5A4A] mb-8 max-w-[480px] mx-auto">
          Conseils carrière, tendances de l&apos;emploi à La Réunion et astuces recrutement — c&apos;est pour très vite.
        </p>
        <Link href="/candidate/jobs">
          <Button kind="primary" size="lg">Voir les offres en attendant</Button>
        </Link>
      </div>
    </PublicShell>
  )
}
