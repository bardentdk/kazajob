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
    <div
      className="flex justify-center px-4 py-2.5 border-b border-[#E8DDC9]"
      style={{ background: KZ.cream }}
    >
      <div
        className="inline-flex items-center gap-0.5 p-0.5 rounded-full border border-[#1A1410]"
        style={{ background: KZ.paper }}
      >
        <button
          onClick={() => router.push('/?view=candidat')}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
          style={
            current === 'candidat'
              ? { background: KZ.orange, color: KZ.ink, boxShadow: '2px 2px 0 #1A1410' }
              : { color: KZ.mute }
          }
        >
          <Users size={12} />
          Je cherche un emploi
        </button>
        <button
          onClick={() => router.push('/?view=entreprise')}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200"
          style={
            current === 'entreprise'
              ? { background: KZ.violet, color: 'white', boxShadow: '2px 2px 0 #1A1410' }
              : { color: KZ.mute }
          }
        >
          <Building2 size={12} />
          Je recrute
        </button>
      </div>
    </div>
  )
}
