import { Shield, Zap, Heart, MapPin } from 'lucide-react'
import { KZ } from '@/lib/constants'

const BADGES = [
  { icon: <Heart size={16} />, label: 'Candidat 100% gratuit', color: KZ.orange },
  { icon: <Shield size={16} />, label: 'Données hébergées en France · RGPD', color: KZ.green },
  { icon: <Zap size={16} />, label: 'Matching IA en temps réel', color: KZ.violet },
  { icon: <MapPin size={16} />, label: 'Fait à La Réunion · 974', color: KZ.blue },
]

export function ReassuranceBar() {
  return (
    <div className="px-4 sm:px-8 py-3 border-b border-[#1A1410]" style={{ background: KZ.cream }}>
      <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
        {BADGES.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-xs font-semibold text-[#2A2018]">
            <span style={{ color: b.color }}>{b.icon}</span>
            {b.label}
          </div>
        ))}
      </div>
    </div>
  )
}
