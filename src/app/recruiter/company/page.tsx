'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, Users, ArrowRight, Edit3, Check, Globe, Star, Landmark, Target, Briefcase, Search, Rss } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import { KZ, SUBSCRIPTION_PLANS, PARTNERS } from '@/lib/constants'

const PARTNER_ICONS: Record<string, React.ReactNode> = {
  Landmark:  <Landmark  size={12} />,
  Target:    <Target    size={12} />,
  Briefcase: <Briefcase size={12} />,
  Search:    <Search    size={12} />,
  Rss:       <Rss       size={12} />,
}
import type { Company, CompanySubscription } from '@/lib/types'

export default function CompanyPage() {
  const { profile } = useAuth()
  const supabase = createClient()
  const [company, setCompany]       = useState<Company | null>(null)
  const [sub, setSub]               = useState<CompanySubscription | null>(null)
  const [memberCount, setMemberCount] = useState(0)
  const [jobCount, setJobCount]     = useState(0)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!profile?.company_id) return
    const load = async () => {
      const [{ data: co }, { data: s }, { count: mc }, { count: jc }] = await Promise.all([
        supabase.from('companies').select('*').eq('id', profile.company_id!).single(),
        supabase.from('company_subscriptions').select('*').eq('company_id', profile.company_id!).maybeSingle(),
        supabase.from('company_members').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id!).eq('status', 'active'),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('company_id', profile.company_id!).eq('is_active', true),
      ])
      setCompany(co as Company)
      setSub(s as CompanySubscription | null)
      setMemberCount(mc ?? 0)
      setJobCount(jc ?? 0)
      setLoading(false)
    }
    load()
  }, [profile?.company_id])

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === sub?.plan_id)

  if (!profile?.company_id) {
    return (
      <div className="max-w-[600px] mx-auto text-center py-20">
        <Building2 size={48} className="mx-auto mb-4 opacity-30" />
        <h2 className="text-xl font-bold text-[#1A1410] mb-2">Aucune entreprise configurée</h2>
        <p className="text-sm text-[#6B5A4A] mb-5">Configurez votre espace entreprise pour commencer à recruter.</p>
        <Link href="/recruiter/company-setup">
          <Button kind="primary" size="lg" icon={<ArrowRight size={15} />}>Configurer mon entreprise</Button>
        </Link>
      </div>
    )
  }

  if (loading) return <div className="h-64 rounded-2xl bg-[#FBEFE0] animate-pulse" />

  const isTrialing = sub?.status === 'trial'
  const trialDaysLeft = sub?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
    : 0

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Mon entreprise</p>
          <h1 className="text-2xl font-extrabold text-[#1A1410]">{company?.name}</h1>
        </div>
        <Link href="/recruiter/company/team">
          <Button kind="outline" size="md" icon={<Users size={14} />}>Gérer l&apos;équipe</Button>
        </Link>
      </div>

      {/* Abonnement */}
      {sub && plan && (
        <div
          className="kz-card p-5 mb-5 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{ background: isTrialing ? KZ.yellowSoft : KZ.greenSoft }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Star size={15} color={isTrialing ? KZ.yellow : KZ.green} fill={isTrialing ? KZ.yellow : KZ.green} />
              <span className="text-sm font-bold text-[#1A1410]">
                Forfait {plan.name}
                {isTrialing && ` — Essai gratuit (${trialDaysLeft}j restants)`}
              </span>
              <Badge color={isTrialing ? 'yellow' : 'green'} size="sm">
                {isTrialing ? 'Essai' : 'Actif'}
              </Badge>
            </div>
            <div className="text-xs text-[#6B5A4A]">
              {memberCount}/{plan.maxMembers} recruteur{plan.maxMembers > 1 ? 's' : ''} ·
              {jobCount} offre{jobCount > 1 ? 's' : ''} active{jobCount > 1 ? 's' : ''} ·
              {plan.maxJobs === -1 ? ' illimitées' : ` ${plan.maxJobs} max`}
            </div>
          </div>
          <Link href="/admin/subscriptions">
            <Button kind="outline" size="sm">Changer de forfait</Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { v: memberCount, l: 'Recruteurs', color: KZ.violetSoft },
          { v: jobCount,    l: 'Offres actives', color: KZ.orangeSoft },
          { v: plan?.partners.length ?? 0, l: 'Partenaires', color: KZ.blueSoft },
        ].map(s => (
          <div key={s.l} className="kz-card p-4 text-center bg-white" style={{ background: s.color }}>
            <div className="text-2xl font-extrabold text-[#1A1410]">{s.v}</div>
            <div className="text-xs text-[#6B5A4A] font-semibold mt-0.5">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Infos entreprise */}
      <div className="kz-card p-5 bg-white mb-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-xl border border-[#1A1410] flex items-center justify-center text-lg font-extrabold shrink-0"
            style={{ background: KZ.orangeSoft }}>
            {company?.logo_url
              ? <img src={company.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
              : company?.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#1A1410]">{company?.name}</h2>
              {company?.is_verified && <Badge color="green" size="sm">✓ Vérifié</Badge>}
            </div>
            {company?.legal_name && <p className="text-xs text-[#6B5A4A]">{company.legal_name}</p>}
            {company?.siret && <p className="text-xs text-[#6B5A4A]">SIRET : {company.siret}</p>}
          </div>
          <Button kind="soft" size="sm" icon={<Edit3 size={13} />}>Modifier</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {company?.sector && (
            <div><span className="text-xs text-[#6B5A4A]">Secteur</span><div className="font-semibold text-[#1A1410]">{company.sector}</div></div>
          )}
          {company?.size && (
            <div><span className="text-xs text-[#6B5A4A]">Taille</span><div className="font-semibold text-[#1A1410]">{company.size} employés</div></div>
          )}
          {company?.location && (
            <div><span className="text-xs text-[#6B5A4A]">Localisation</span><div className="font-semibold text-[#1A1410]">{company.location}</div></div>
          )}
          {company?.website && (
            <div>
              <span className="text-xs text-[#6B5A4A]">Site web</span>
              <a href={company.website} target="_blank" rel="noreferrer"
                className="font-semibold flex items-center gap-1" style={{ color: KZ.violet }}>
                <Globe size={12} />{company.website.replace('https://', '')}
              </a>
            </div>
          )}
        </div>

        {company?.description && (
          <p className="text-sm text-[#6B5A4A] leading-relaxed mt-3 pt-3 border-t border-[#E8DDC9]">
            {company.description}
          </p>
        )}
      </div>

      {/* Partenaires actifs */}
      {plan && plan.partners.length > 0 && (
        <div className="kz-card p-5 bg-white">
          <h3 className="text-sm font-bold text-[#1A1410] mb-3">Diffusion multi-plateformes activée</h3>
          <div className="flex flex-wrap gap-2">
            {plan.partners.map(p => {
              const partner = PARTNERS[p]
              return partner ? (
                <div key={p} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#1A1410] text-xs font-bold"
                  style={{ background: KZ.greenSoft }}>
                  <Check size={11} color={KZ.green} />
                  <span className="flex items-center gap-1">{PARTNER_ICONS[partner.icon]}{partner.name}</span>
                </div>
              ) : null
            })}
          </div>
          <p className="text-xs text-[#6B5A4A] mt-2">
            Vos offres sont automatiquement diffusées sur ces plateformes lors de leur publication.
          </p>
        </div>
      )}
    </div>
  )
}
