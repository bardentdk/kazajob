'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { GraduationCap, MapPin, Clock, Euro, Search, CalendarCheck } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { createClient } from '@/lib/supabase/client'
import { KZ, CERTIFICATION_LEVELS } from '@/lib/constants'
import type { TrainingOffer } from '@/lib/types'

const certLabel = (id: string) =>
  CERTIFICATION_LEVELS.find(c => c.id === id)?.label ?? id

export default function CandidateTrainingPage() {
  const supabase = createClient()
  const [offers, setOffers]   = useState<TrainingOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    supabase
      .from('training_offers')
      .select('*, company:companies(name, logo_url), info_session:events!info_session_id(id,title,date,jitsi_room)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOffers((data ?? []) as TrainingOffer[])
        setLoading(false)
      })
  }, [])

  const filtered = search
    ? offers.filter(o =>
        o.title.toLowerCase().includes(search.toLowerCase()) ||
        o.location.toLowerCase().includes(search.toLowerCase()) ||
        (o.certification ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : offers

  if (loading) return <PageLoader />

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-6">
        <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Formations</p>
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">
          Offres de <span style={{ color: KZ.violet }}>formation</span>
        </h1>
        <p className="text-sm text-[#6B5A4A] mt-1">
          {offers.length} formation{offers.length > 1 ? 's' : ''} disponible{offers.length > 1 ? 's' : ''} à La Réunion 974
        </p>
      </div>

      <div className="mb-5">
        <Input
          label=""
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher une formation, certification, ville..."
          icon={<Search size={15} />}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucune formation trouvée" icon={<GraduationCap size={28} />} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(offer => (
            <Link key={offer.id} href={`/candidate/training/${offer.id}`} className="block">
              <div className="kz-card bg-white hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#1A1410] transition-all overflow-hidden flex flex-col">
                {/* Image */}
                <div className="h-36 relative overflow-hidden" style={{ background: KZ.violetSoft }}>
                  {offer.image_url ? (
                    <img src={offer.image_url} alt={offer.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <GraduationCap size={48} color={KZ.violet} />
                    </div>
                  )}
                  {/* Session IC badge */}
                  {offer.info_session && (
                    <div className="absolute top-2 right-2">
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border border-[#1A1410] bg-[#D6F0E0]"
                        style={{ color: KZ.green }}>
                        <CalendarCheck size={10} /> Session IC
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-2 flex-1">
                  {/* Centre de formation */}
                  <div className="text-xs font-semibold text-[#6B5A4A]">{offer.company?.name ?? 'Organisme de formation'}</div>

                  {/* Titre */}
                  <h3 className="text-sm font-extrabold text-[#1A1410] leading-tight line-clamp-2">{offer.title}</h3>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {offer.certification_level && (
                      <Badge color="violet" size="sm">{certLabel(offer.certification_level)}</Badge>
                    )}
                    {offer.is_financed && <Badge color="green" size="sm">Financé</Badge>}
                    {offer.remote && <Badge color="blue" size="sm">Distanciel</Badge>}
                  </div>

                  {/* Infos */}
                  <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-[#E8DDC9]">
                    <div className="flex items-center gap-1.5 text-xs text-[#6B5A4A]">
                      <Clock size={11} /> {offer.duration_value} {offer.duration_unit}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#6B5A4A]">
                      <MapPin size={11} /> {offer.location}
                    </div>
                    {offer.financing_options.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-[#6B5A4A]">
                        <Euro size={11} /> {offer.financing_options.slice(0,2).join(' · ')}
                        {offer.financing_options.length > 2 && ` +${offer.financing_options.length - 2}`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
