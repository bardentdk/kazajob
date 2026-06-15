'use client'

import { useState } from 'react'
import { Sparkles, GraduationCap, Lightbulb, TrendingUp, Check, Target } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Tag } from '@/components/ui/Tag'
import { Progress } from '@/components/ui/Progress'
import { InlineLoader } from '@/components/ui/LogoLoader'
import { useKazaCoach } from '@/features/ai/useKazaIA'
import { KZ } from '@/lib/constants'

export default function KazaCoachPage() {
  const { generating, coach, raw, error, generate } = useKazaCoach()
  const [targetRole, setTargetRole] = useState('')

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="mb-6">
        <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Assistant candidat</p>
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">KazaCoach</h1>
        <p className="text-sm text-[#6B5A4A] mt-1">Ton coach emploi IA : il analyse ton profil et te donne un plan d&apos;action concret pour le marché 974.</p>
      </div>

      <div className="kz-card p-5 bg-white mb-5">
        <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Métier visé (optionnel)</label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <Input className="flex-1" value={targetRole} onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Ex : Développeur web, Aide-soignant, Commercial…" icon={<Target size={15} />} />
          <Button kind="violet" size="md" icon={<Sparkles size={15} />} loading={generating}
            onClick={() => generate(targetRole || undefined)}>
            Analyser mon profil
          </Button>
        </div>
      </div>

      {generating && (
        <div className="flex flex-col items-center gap-3 py-10">
          <InlineLoader size={48} />
          <p className="text-sm text-[#6B5A4A]">KazaCoach analyse ton profil…</p>
        </div>
      )}

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

      {coach && !generating && (
        <div className="flex flex-col gap-4">
          {/* Compatibilité */}
          <div className="kz-card p-5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#1A1410]">Force de ton profil (974)</span>
              <span className="text-2xl font-extrabold" style={{ color: KZ.violet }}>{coach.compatibilite}%</span>
            </div>
            <Progress value={coach.compatibilite} color={KZ.violet} />
          </div>

          {coach.competences_manquantes?.length > 0 && (
            <div className="kz-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap size={16} color={KZ.orange} />
                <h2 className="text-base font-bold text-[#1A1410]">Compétences à acquérir</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {coach.competences_manquantes.map((c, i) => <Tag key={i}>{c}</Tag>)}
              </div>
            </div>
          )}

          {coach.experience_recommandee && (
            <div className="kz-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} color={KZ.green} />
                <h2 className="text-base font-bold text-[#1A1410]">Expérience recommandée</h2>
              </div>
              <p className="text-sm text-[#2A2018] leading-relaxed">{coach.experience_recommandee}</p>
            </div>
          )}

          {coach.conseils?.length > 0 && (
            <div className="kz-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb size={16} color={KZ.violet} />
                <h2 className="text-base font-bold text-[#1A1410]">Conseils de candidature</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {coach.conseils.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#2A2018]"><Check size={14} className="mt-0.5 shrink-0" color={KZ.green} />{c}</li>
                ))}
              </ul>
            </div>
          )}

          {coach.ameliorations?.length > 0 && (
            <div className="kz-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} color={KZ.orange} />
                <h2 className="text-base font-bold text-[#1A1410]">Pistes d&apos;amélioration</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {coach.ameliorations.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#2A2018]">• {c}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-[11px] text-[#6B5A4A] italic text-center">Généré par KazaCoach — à titre indicatif. Complète ton profil pour des conseils plus précis.</p>
        </div>
      )}

      {raw && !coach && !generating && (
        <div className="kz-card p-5 bg-white text-sm text-[#2A2018] leading-relaxed whitespace-pre-wrap">{raw}</div>
      )}
    </div>
  )
}
