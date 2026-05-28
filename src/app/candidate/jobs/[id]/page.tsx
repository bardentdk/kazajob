'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, Heart, Briefcase, Sparkles, Building2, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Progress } from '@/components/ui/Progress'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useJob } from '@/features/jobs/useJobs'
import { useApplications } from '@/features/applications/useApplications'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { formatSalary, timeAgo } from '@/lib/utils'
import { KZ } from '@/lib/constants'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { job, loading } = useJob(id)
  const { profile } = useAuth()
  const { apply, hasApplied } = useApplications(profile?.id)
  const { isFavorite, toggle } = useFavorites(profile?.id)
  const [applyModal, setApplyModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  if (loading) return <PageLoader />
  if (!job) return (
    <div className="text-center py-16">
      <p className="text-[#6B5A4A] mb-4">Offre introuvable.</p>
      <Button kind="outline" onClick={() => router.back()}>Retour</Button>
    </div>
  )

  const alreadyApplied = applied || hasApplied(id)

  const handleApply = async () => {
    setApplying(true); setError('')
    const { error: err } = await apply(id, coverLetter)
    if (err) { setError(err) } else { setApplied(true); setApplyModal(false) }
    setApplying(false)
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-semibold text-[#6B5A4A] hover:text-[#1A1410] mb-5">
        <ArrowLeft size={16} />Retour aux offres
      </button>

      {/* Layout : stack sur mobile, 2 cols sur desktop */}
      <div className="flex flex-col lg:grid lg:grid-cols-[1fr_300px] gap-5">
        {/* Main */}
        <div className="flex flex-col gap-4">
          {/* Header offre */}
          <div className="kz-card p-5 bg-white">
            <div className="flex gap-4 items-start mb-4">
              <div className="w-14 h-14 rounded-xl border border-[#1A1410] flex items-center justify-center text-lg font-extrabold text-[#1A1410] shrink-0" style={{ background: KZ.orangeSoft }}>
                {(job.company?.name ?? 'CO').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[#6B5A4A]">{job.company?.name}</div>
                <h1 className="text-xl lg:text-[26px] font-extrabold tracking-tight text-[#1A1410] leading-tight">{job.title}</h1>
                <div className="flex gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-xs text-[#2A2018]"><MapPin size={13} />{job.location}</span>
                  <span className="flex items-center gap-1 text-xs text-[#2A2018]"><Clock size={13} />{timeAgo(job.created_at)}</span>
                  <span className="flex items-center gap-1 text-xs text-[#2A2018]"><Briefcase size={13} />{job.job_type}</span>
                  {job.remote && <Badge color="green" size="sm">Remote</Badge>}
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap mb-4">
              {job.skills?.map((s) => <Tag key={s.id}>{s.name}</Tag>)}
            </div>
            {job.match_score !== undefined && (
              <div className="p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft }}>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={15} color={KZ.violet} />
                  <span className="text-sm font-bold text-[#1A1410]">Score matching IA : <span style={{ color: KZ.violet }}>{job.match_score}%</span></span>
                </div>
                <Progress value={job.match_score} color={KZ.violet} />
              </div>
            )}
          </div>

          {/* CTA mobile — visible uniquement sur mobile */}
          <div className="lg:hidden kz-card p-4 bg-white">
            <div className="text-xl font-extrabold text-[#1A1410] mb-1">{formatSalary(job.salary_min, job.salary_max)}</div>
            <div className="text-sm text-[#6B5A4A] mb-4">{job.job_type} · {job.location}</div>
            {alreadyApplied ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-[#19A974] bg-[#D6F0E0]">
                <Check size={16} color={KZ.green} />
                <span className="text-sm font-bold text-[#1A1410]">Candidature envoyee !</span>
              </div>
            ) : (
              <Button kind="primary" size="lg" full onClick={() => setApplyModal(true)}>Postuler maintenant</Button>
            )}
          </div>

          {/* Description */}
          <div className="kz-card p-5 bg-white">
            <h2 className="text-lg font-bold text-[#1A1410] mb-3">Description du poste</h2>
            <div className="text-sm leading-relaxed text-[#2A2018] whitespace-pre-line">{job.description}</div>
          </div>
          {job.requirements && (
            <div className="kz-card p-5 bg-white">
              <h2 className="text-lg font-bold text-[#1A1410] mb-3">Profil recherche</h2>
              <div className="text-sm leading-relaxed text-[#2A2018] whitespace-pre-line">{job.requirements}</div>
            </div>
          )}
        </div>

        {/* Sidebar desktop */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="kz-card p-5 bg-white">
            <div className="text-2xl font-extrabold tracking-tight text-[#1A1410] mb-1">{formatSalary(job.salary_min, job.salary_max)}</div>
            <div className="text-sm text-[#6B5A4A] mb-4">{job.job_type} · {job.location}</div>
            {alreadyApplied ? (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-[#19A974] bg-[#D6F0E0]">
                <Check size={16} color={KZ.green} />
                <span className="text-sm font-bold text-[#1A1410]">Candidature envoyee !</span>
              </div>
            ) : (
              <Button kind="primary" size="lg" full onClick={() => setApplyModal(true)}>Postuler maintenant</Button>
            )}
            <Button kind="outline" size="md" full className="mt-2" icon={<Heart size={15} fill={isFavorite(id) ? '#FF6B35' : 'none'} color={isFavorite(id) ? '#FF6B35' : '#1A1410'} />} onClick={() => toggle(id)}>
              {isFavorite(id) ? 'Retire des favoris' : 'Sauvegarder'}
            </Button>
          </div>
          <div className="kz-card p-5 bg-white">
            <h3 className="text-base font-bold text-[#1A1410] mb-3">A propos</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-[#2A2018]"><Building2 size={14} className="text-[#6B5A4A]" />{job.company?.name}</div>
              {job.company?.location && <div className="flex items-center gap-2 text-sm text-[#2A2018]"><MapPin size={14} className="text-[#6B5A4A]" />{job.company.location}</div>}
            </div>
          </div>
          <div className="kz-card p-4 bg-white grid grid-cols-2 gap-3">
            <div className="text-center"><div className="text-2xl font-extrabold text-[#1A1410]">{job.views}</div><div className="text-xs text-[#6B5A4A]">vues</div></div>
            <div className="text-center"><div className="text-2xl font-extrabold text-[#1A1410]">{job.applications_count}</div><div className="text-xs text-[#6B5A4A]">candidatures</div></div>
          </div>
        </div>
      </div>

      {/* Modal candidature */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Postuler a cette offre">
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-bold text-[#1A1410]">{job.title}</h3>
            <p className="text-sm text-[#6B5A4A]">{job.company?.name} · {job.location}</p>
          </div>
          {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}
          <Textarea label="Lettre de motivation (optionnel)" value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} placeholder="Pourquoi ce poste t'interesse..." rows={5} />
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button kind="outline" size="lg" full onClick={() => setApplyModal(false)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={applying} onClick={handleApply}>Envoyer ma candidature</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
