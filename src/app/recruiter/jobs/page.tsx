'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Eye, Users, Edit, Trash2, ToggleLeft, ToggleRight, EyeOff, User, Rocket, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useAuth } from '@/features/auth/useAuth'
import type { Job } from '@/lib/types'
import { timeAgo, formatSalary } from '@/lib/utils'
import { KZ, JOB_BOOST_OPTIONS } from '@/lib/constants'

export default function RecruiterJobsPage() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [boostFor, setBoostFor] = useState<Job | null>(null)
  const [quota, setQuota] = useState<{ ok: boolean; max: number; used: number; planName: string; reason?: string } | null>(null)
  const [quotaModal, setQuotaModal] = useState(false)

  const fetchJobs = async () => {
    if (!profile) return
    try {
      const [res, q] = await Promise.all([
        fetch('/api/recruiter/jobs'),
        fetch('/api/recruiter/quota'),
      ])
      if (res.ok) setJobs((await res.json()) as Job[])
      if (q.ok) setQuota(await q.json())
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { if (profile) fetchJobs() }, [profile])

  const toggleActive = async (job: Job) => {
    await fetch(`/api/recruiter/jobs/${job.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !job.is_active }),
    })
    fetchJobs()
  }

  const deleteJob = async (id: string) => {
    if (!confirm('Supprimer cette offre ?')) return
    await fetch(`/api/recruiter/jobs/${id}`, { method: 'DELETE' })
    fetchJobs()
  }

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="kz-h2 text-[#1A1410] mb-1">Mes offres</h1>
          <p className="text-sm text-[#6B5A4A]">
            {jobs.length} offre(s)
            {quota && quota.max !== -1 && ` · ${quota.used}/${quota.max} active(s) — forfait ${quota.planName}`}
            {quota && quota.max === -1 && ` · illimité (${quota.planName})`}
          </p>
        </div>
        {quota && !quota.ok ? (
          <Button kind="primary" size="md" icon={<Plus size={16} />} onClick={() => setQuotaModal(true)}>Nouvelle offre</Button>
        ) : (
          <Link href="/recruiter/jobs/new">
            <Button kind="primary" size="md" icon={<Plus size={16} />}>Nouvelle offre</Button>
          </Link>
        )}
      </div>

      {loading ? <PageLoader /> : jobs.length === 0 ? (
        <EmptyState
          title="Aucune offre publiee"
          description="Creez votre premiere offre d'emploi et trouvez les meilleurs talents de La Reunion."
          icon={<Plus size={28} />}
          action={<Link href="/recruiter/jobs/new"><Button kind="primary">Creer une offre</Button></Link>}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="kz-card p-4 bg-white flex items-center gap-4">
              {/* Logo entreprise */}
              {(() => {
                const co = (job as unknown as { company?: { name: string; logo_url: string | null } }).company
                return co ? (
                  <div className="w-11 h-11 rounded-xl border border-[#1A1410] flex items-center justify-center text-xs font-extrabold shrink-0"
                    style={{ background: KZ.orangeSoft }}>
                    {co.logo_url
                      ? <img src={co.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />
                      : co.name.slice(0, 2).toUpperCase()}
                  </div>
                ) : null
              })()}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <h3 className="text-sm font-bold text-[#1A1410]">{job.title}</h3>
                  {job.is_boosted && <Badge color="orange" size="sm">Booste</Badge>}
                  {(job as unknown as { is_anonymous?: boolean }).is_anonymous && (
                    <Badge color="cream" size="sm"><span className="flex items-center gap-1"><EyeOff size={10} />Anonyme</span></Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#6B5A4A] flex-wrap">
                  <span>{job.location} · {job.job_type} · {formatSalary(job.salary_min, job.salary_max)}</span>
                  <span>· {timeAgo(job.created_at)}</span>
                  {/* Auteur */}
                  {(() => {
                    const pub = (job as unknown as { publisher?: { full_name: string } }).publisher
                    return pub ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-[#E8DDC9]"
                        style={{ background: KZ.cream2 }}>
                        <User size={9} />{pub.full_name}
                      </span>
                    ) : null
                  })()}
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-center">
                  <div className="text-sm font-extrabold text-[#1A1410]">{job.views}</div>
                  <div className="text-[10px] text-[#6B5A4A] flex items-center gap-0.5"><Eye size={9} />vues</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-[#1A1410]">{job.applications_count}</div>
                  <div className="text-[10px] text-[#6B5A4A] flex items-center gap-0.5"><Users size={9} />cand.</div>
                </div>
                <Badge color={job.is_active ? 'green' : 'cream'}>
                  {job.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setBoostFor(job)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FFE0CF]"
                  style={{ color: job.is_boosted ? KZ.orange : KZ.mute }}
                  title={job.is_boosted ? 'Prolonger la mise en avant' : 'Booster cette offre'}
                >
                  <Rocket size={16} fill={job.is_boosted ? KZ.orange : 'none'} />
                </button>
                <button
                  onClick={() => toggleActive(job)}
                  className="text-[#6B5A4A] hover:text-[#1A1410]"
                  title={job.is_active ? 'Desactiver' : 'Activer'}
                >
                  {job.is_active ? <ToggleRight size={20} color={KZ.green} /> : <ToggleLeft size={20} />}
                </button>
                <Link href={`/recruiter/jobs/${job.id}/edit`}>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#FBEFE0] text-[#6B5A4A] hover:text-[#1A1410]">
                    <Edit size={15} />
                  </button>
                </Link>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B5A4A] hover:text-red-600"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal boost */}
      <BoostModal job={boostFor} onClose={() => setBoostFor(null)} />

      {/* Modal quota atteint */}
      <Modal open={quotaModal} onClose={() => setQuotaModal(false)}
        title={quota?.reason === 'expired' ? 'Abonnement à activer' : 'Limite d\'offres atteinte'} size="sm">
        <div className="flex flex-col gap-4">
          {quota?.reason === 'expired' ? (
            <p className="text-sm text-[#2A2018] leading-relaxed">
              Votre essai ou abonnement a expiré. Activez un forfait pour publier de nouvelles offres.
            </p>
          ) : (
            <p className="text-sm text-[#2A2018] leading-relaxed">
              Vous utilisez <strong>{quota?.used}/{quota?.max}</strong> offre(s) active(s) du forfait <strong>{quota?.planName}</strong>.
              Pour en publier une nouvelle, deux options :
            </p>
          )}
          {quota?.reason !== 'expired' && (
            <ul className="flex flex-col gap-2 text-sm text-[#2A2018]">
              <li className="flex items-start gap-2"><ToggleLeft size={16} className="mt-0.5 shrink-0" />Désactivez ou supprimez une offre que vous n&apos;utilisez plus (ci-dessous).</li>
              <li className="flex items-start gap-2"><Plus size={16} className="mt-0.5 shrink-0" />Passez à un forfait supérieur pour plus d&apos;offres simultanées.</li>
            </ul>
          )}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button kind="soft" size="lg" full onClick={() => setQuotaModal(false)}>Gérer mes offres</Button>
            <Link href="/recruiter/company" className="flex-1">
              <Button kind="primary" size="lg" full icon={<ArrowRight size={15} />}>Changer de forfait</Button>
            </Link>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Modal de mise en avant payante d'une offre ─────────────────
function BoostModal({ job, onClose }: { job: Job | null; onClose: () => void }) {
  const [days, setDays] = useState(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const boostedUntil = (job as unknown as { boost_expires_at?: string | null })?.boost_expires_at

  const handleBoost = async () => {
    if (!job) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/billing/boost-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: job.id, days }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) { window.location.href = data.url as string; return }
      setError(res.status === 503
        ? 'Le paiement est momentanément indisponible. Réessaie dans un instant.'
        : (data.error as string) || 'Impossible d\'ouvrir le paiement.')
    } catch {
      setError('Connexion au paiement impossible. Réessaie.')
    }
    setLoading(false)
  }

  return (
    <Modal open={!!job} onClose={onClose} title="Booster cette offre" size="md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.orangeSoft }}>
          <Rocket size={18} color={KZ.orange} />
          <div>
            <p className="text-sm font-bold text-[#1A1410]">{job?.title}</p>
            <p className="text-xs text-[#6B5A4A]">Mise en avant en tête des résultats + badge « À la une ».</p>
          </div>
        </div>

        {job?.is_boosted && boostedUntil && (
          <p className="text-xs text-[#6B5A4A]">
            Déjà boostée jusqu&apos;au <strong className="text-[#1A1410]">{new Date(boostedUntil).toLocaleDateString('fr-FR')}</strong> — un nouvel achat prolonge la durée.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {JOB_BOOST_OPTIONS.map((opt) => {
            const selected = days === opt.days
            return (
              <button key={opt.days} onClick={() => setDays(opt.days)}
                className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                style={{ borderColor: selected ? KZ.orange : KZ.line, background: selected ? KZ.orangeSoft : 'white' }}>
                <div className="w-7 h-7 rounded-full border-2 border-[#1A1410] flex items-center justify-center shrink-0"
                  style={{ background: selected ? KZ.orange : 'white' }}>
                  {selected && <Rocket size={12} color="white" />}
                </div>
                <div className="flex-1">
                  <span className="text-sm font-bold text-[#1A1410]">{opt.label}</span>
                  {opt.tag && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]" style={{ background: KZ.yellowSoft }}>{opt.tag}</span>}
                </div>
                <span className="text-lg font-extrabold text-[#1A1410]">{Math.floor(opt.priceCts / 100)}€</span>
              </button>
            )
          })}
        </div>

        {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

        <Button kind="primary" size="lg" full loading={loading} icon={<Rocket size={15} />} onClick={handleBoost}>
          Payer et activer le boost
        </Button>
        <p className="text-[11px] text-center text-[#6B5A4A]">Paiement unique sécurisé par Stripe. Sans abonnement.</p>
      </div>
    </Modal>
  )
}
