import type { Metadata } from 'next'
import { Mail, MapPin } from 'lucide-react'
import { PublicShell } from '@/components/layout/PublicShell'
import { KZ } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contacter l\'équipe Kazajob (La Réunion 974).',
}

export default function Page() {
  return (
    <PublicShell>
      <div className="max-w-[680px] mx-auto px-4 sm:px-8 py-12 lg:py-20">
        <h1 className="text-3xl lg:text-[40px] font-extrabold tracking-tight text-[#1A1410] mb-3">Contact</h1>
        <p className="text-base text-[#2A2018] leading-relaxed mb-8">
          Une question, une suggestion, un partenariat ? L&apos;équipe Kazajob te répond.
        </p>

        <div className="flex flex-col gap-4">
          <a href="mailto:kazajob.re@gmail.com"
            className="kz-card p-5 bg-white flex items-center gap-4 transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]">
            <div className="w-11 h-11 rounded-xl border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: KZ.violetSoft }}>
              <Mail size={18} style={{ color: KZ.violet }} />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1A1410]">E-mail</div>
              <div className="text-sm" style={{ color: KZ.violet }}>kazajob.re@gmail.com</div>
            </div>
          </a>

          <div className="kz-card p-5 bg-white flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: KZ.orangeSoft }}>
              <MapPin size={18} style={{ color: KZ.orange }} />
            </div>
            <div>
              <div className="text-sm font-bold text-[#1A1410]">Localisation</div>
              <div className="text-sm text-[#6B5A4A]">Saint-Denis, La Réunion (974)</div>
            </div>
          </div>
        </div>
      </div>
    </PublicShell>
  )
}
