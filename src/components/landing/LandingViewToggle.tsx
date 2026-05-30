'use client'

import { useRouter } from 'next/navigation'
import { Users, Building2 } from 'lucide-react'
import { KZ } from '@/lib/constants'

interface LandingViewToggleProps {
  current: 'candidat' | 'entreprise'
}

export function LandingViewToggle({ current }: LandingViewToggleProps) {
  const router = useRouter()

  return (
    <div className="flex justify-center py-3 px-4" style={{ background: KZ.ink }}>
      <div
        className="inline-flex items-center gap-1 p-1 rounded-full border border-white/20"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      >
        <button
          onClick={() => router.push('/?view=candidat')}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200"
          style={
            current === 'candidat'
              ? { background: KZ.orange, color: KZ.ink, boxShadow: '2px 2px 0 rgba(0,0,0,0.3)' }
              : { color: 'rgba(255,255,255,0.6)' }
          }
        >
          <Users size={14} />
          Candidat
        </button>
        <button
          onClick={() => router.push('/?view=entreprise')}
          className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold transition-all duration-200"
          style={
            current === 'entreprise'
              ? { background: KZ.violet, color: 'white', boxShadow: '2px 2px 0 rgba(0,0,0,0.3)' }
              : { color: 'rgba(255,255,255,0.6)' }
          }
        >
          <Building2 size={14} />
          Entreprise
        </button>
      </div>
    </div>
  )
}
