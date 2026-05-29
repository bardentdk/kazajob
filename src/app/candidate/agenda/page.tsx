'use client'

import { Calendar, Video, Phone, MapPin, Clock, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useInterviews } from '@/features/interviews/useInterviews'
import { KZ } from '@/lib/constants'

const TYPE_ICON = {
  video:  <Video size={16} />,
  phone:  <Phone size={16} />,
  onsite: <MapPin size={16} />,
}

const TYPE_LABEL = {
  video:  'Visioconférence',
  phone:  'Téléphone',
  onsite: 'Présentiel',
}

const STATUS_COLOR: Record<string, 'green' | 'yellow' | 'cream' | 'violet'> = {
  pending:   'yellow',
  confirmed: 'green',
  cancelled: 'cream',
  done:      'violet',
}

export default function CandidateAgendaPage() {
  const { upcoming, byDate, loading, update } = useInterviews()

  if (loading) return <PageLoader />

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl border border-[#1A1410] flex items-center justify-center" style={{ background: KZ.violet }}>
          <Calendar size={20} color="white" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#1A1410]">Mes entretiens</h1>
          <p className="text-sm text-[#6B5A4A]">{upcoming.length} entretien(s) à venir</p>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <EmptyState
          title="Aucun entretien planifié"
          description="Lorsqu'un recruteur planifie un entretien avec toi, il apparaîtra ici."
          icon={<Calendar size={28} />}
        />
      ) : (
        <div className="flex flex-col gap-4">
          {Object.entries(byDate)
            .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
            .map(([date, ivs]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px flex-1 bg-[#E8DDC9]" />
                  <span className="text-xs font-bold text-[#6B5A4A] px-2 capitalize">{date}</span>
                  <div className="h-px flex-1 bg-[#E8DDC9]" />
                </div>

                {ivs.filter(iv => iv.status !== 'cancelled').map((iv) => {
                  const d = new Date(iv.scheduled_at)
                  const isToday = d.toDateString() === new Date().toDateString()
                  const isPast = d < new Date()

                  return (
                    <div
                      key={iv.id}
                      className="kz-card p-5 bg-white mb-3"
                      style={isToday ? { borderColor: KZ.orange, boxShadow: `4px 4px 0 ${KZ.orange}` } : {}}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className="w-14 h-14 rounded-xl border border-[#1A1410] flex flex-col items-center justify-center shrink-0 text-white font-extrabold"
                          style={{ background: isToday ? KZ.orange : KZ.violet }}
                        >
                          <div className="text-xl leading-none">{d.getHours().toString().padStart(2,'0')}:{d.getMinutes().toString().padStart(2,'0')}</div>
                          <div className="text-[10px] opacity-80">{iv.duration_min}min</div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-base font-bold text-[#1A1410]">{iv.job?.title ?? 'Entretien'}</span>
                            <Badge color={STATUS_COLOR[iv.status] ?? 'cream'} size="sm">
                              {iv.status === 'pending' ? 'À confirmer' : iv.status === 'confirmed' ? 'Confirmé' : iv.status === 'done' ? 'Terminé' : 'Annulé'}
                            </Badge>
                            {isToday && <Badge color="orange" size="sm">Aujourd&apos;hui</Badge>}
                          </div>
                          <div className="text-sm text-[#6B5A4A] mb-2">
                            {iv.job?.company?.name ?? iv.recruiter?.full_name}
                          </div>

                          <div className="flex items-center gap-1.5 text-xs text-[#6B5A4A]">
                            <span className="text-[#1A1410]">{TYPE_ICON[iv.type]}</span>
                            {TYPE_LABEL[iv.type]}
                            {iv.location && <span>· {iv.location}</span>}
                          </div>

                          {iv.notes && (
                            <div className="mt-2 text-xs text-[#6B5A4A] p-2.5 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                              {iv.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t border-[#E8DDC9]">
                        {iv.visio_link && iv.type === 'video' && !isPast && (
                          <a href={iv.visio_link} target="_blank" rel="noreferrer" className="flex-1">
                            <Button kind="violet" size="md" full icon={<Video size={15} />}>
                              Rejoindre la visio
                            </Button>
                          </a>
                        )}
                        {!isPast && iv.status === 'pending' && (
                          <Button
                            kind="outline"
                            size="md"
                            onClick={() => update(iv.id, { status: 'confirmed' })}
                          >
                            Confirmer
                          </Button>
                        )}
                        {iv.visio_link && (
                          <a href={iv.visio_link} target="_blank" rel="noreferrer">
                            <Button kind="soft" size="md" icon={<ExternalLink size={14} />} />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
