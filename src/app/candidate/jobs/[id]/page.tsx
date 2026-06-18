'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, MapPin, Clock, Heart, Briefcase, Sparkles, Building2, Check, Brain, ChevronDown, ChevronUp, Lightbulb, Wallet, ListChecks, Gift, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { InlineLoader } from '@/components/ui/LogoLoader'
import { KazaScoreMini } from '@/components/ui/KazaScoreBadge'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Progress } from '@/components/ui/Progress'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { CoverLetterModal } from '@/components/ai/CoverLetterModal'
import { useJob } from '@/features/jobs/useJobs'
import { useApplications } from '@/features/applications/useApplications'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { formatSalary, timeAgo } from '@/lib/utils'
import { KZ, getSalaryLabel } from '@/lib/constants'
import { type PrequalQuestion } from '@/lib/prequal'
import { SalaryInsightsCard } from '@/components/jobs/SalaryInsightsCard'
import { TrainingRecoCard } from '@/components/jobs/TrainingRecoCard'
import { EmployerReputation } from '@/components/jobs/EmployerReputation'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { job, loading } = useJob(id)
  const { profile } = useAuth()
  const { apply, hasApplied } = useApplications(profile?.id)
  const { isFavorite, toggle } = useFavorites(profile?.id)
  const [applyModal, setApplyModal] = useState(false)
  const [coverLetterModal, setCoverLetterModal] = useState(false)
  const [interviewModal, setInterviewModal] = useState(false)
  const [showMatchDetail, setShowMatchDetail] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [prequalAnswers, setPrequalAnswers] = useState<Record<string, string>>({})
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

  const prequalQuestions = (((job as unknown as { prequal_questions?: PrequalQuestion[] })?.prequal_questions) ?? []) as PrequalQuestion[]

  const handleApply = async () => {
    setApplying(true); setError('')
    const answers = prequalQuestions.map((q) => ({ questionId: q.id, label: q.label, value: prequalAnswers[q.id] ?? '' }))
    const missing = prequalQuestions.find((q) => q.required && !answers.find((a) => a.questionId === q.id)?.value)
    if (missing) { setError('Merci de répondre à : ' + missing.label); setApplying(false); return }
    const { error: err } = await apply(id, coverLetter, answers.length ? answers : undefined)
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
            {job.match_score !== undefined && (() => {
              const locationMatch = profile?.location && job.location
                ? job.location.toLowerCase().includes(profile.location.toLowerCase().split(',')[0])
                  || profile.location.toLowerCase().includes(job.location.toLowerCase().split(',')[0])
                : null
              return (
                <div className="rounded-xl border border-[#1A1410] overflow-hidden" style={{ background: KZ.violetSoft }}>
                  <div className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={15} color={KZ.violet} />
                      <span className="text-sm font-bold text-[#1A1410]">
                        Score matching IA : <span style={{ color: KZ.violet }}>{job.match_score}%</span>
                      </span>
                      <button
                        onClick={() => setShowMatchDetail(v => !v)}
                        className="ml-auto flex items-center gap-1 text-xs font-semibold"
                        style={{ color: KZ.violet }}
                      >
                        {showMatchDetail ? 'Masquer' : 'Détail'}
                        {showMatchDetail ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                    <Progress value={job.match_score} color={KZ.violet} />
                  </div>
                  {showMatchDetail && (
                    <div className="px-3 pb-3 flex flex-col gap-2 border-t border-[#6D3BEB]/20 pt-3">
                      <p className="text-xs font-bold text-[#1A1410] mb-1">Détail du score :</p>
                      {[
                        {
                          label: 'Compétences techniques',
                          pct: 50,
                          ok: (job.skills?.length ?? 0) > 0,
                          tip: job.skills && job.skills.length > 0
                            ? `${job.skills.length} compétence(s) requise(s) : ${job.skills.slice(0,3).map((s: {name:string}) => s.name).join(', ')}${job.skills.length > 3 ? '…' : ''}`
                            : 'Aucune compétence spécifique requise',
                        },
                        {
                          label: 'Localisation',
                          pct: 20,
                          ok: locationMatch !== false,
                          tip: locationMatch
                            ? `Votre ville correspond (${job.location})`
                            : locationMatch === false
                            ? `Votre profil indique ${profile?.location} · poste à ${job.location}`
                            : `Poste à ${job.location}`,
                        },
                        { label: 'Type de contrat',  pct: 15, ok: true, tip: job.job_type },
                        { label: 'Disponibilité',    pct: 15, ok: true, tip: 'Critère validé' },
                      ].map(row => (
                        <div key={row.label} className="flex items-start gap-2">
                          <span className="mt-0.5 text-base leading-none">{row.ok ? '✅' : '⚡'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-[#1A1410]">{row.label}</span>
                              <span className="text-[10px] text-[#6B5A4A]">({row.pct}%)</span>
                            </div>
                            <p className="text-[11px] text-[#6B5A4A] mt-0.5 leading-tight">{row.tip}</p>
                          </div>
                        </div>
                      ))}
                      {job.match_score < 80 && (
                        <a
                          href="/candidate/profile"
                          className="mt-1 text-xs font-bold text-center py-2 rounded-lg border border-[#6D3BEB] transition-colors hover:bg-[#6D3BEB] hover:text-white"
                          style={{ color: KZ.violet }}
                        >
                          Améliorer mon score → compléter mon profil
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Outils KazaIA — visible partout */}
          <div className="kz-card p-4 bg-white border-[#6D3BEB]" style={{ borderColor: KZ.violet }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg border border-[#1A1410] flex items-center justify-center" style={{ background: KZ.violet }}>
                <Sparkles size={13} color="white" />
              </div>
              <span className="text-sm font-bold text-[#1A1410]">KazaIA — Outils intelligents</span>
              <Badge color="violet" size="sm">Beta</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                kind="violet"
                size="md"
                full
                icon={<Sparkles size={15} />}
                onClick={() => setCoverLetterModal(true)}
              >
                Générer ma lettre de motivation
              </Button>
              <Button
                kind="outline"
                size="md"
                full
                icon={<Brain size={15} />}
                onClick={() => setInterviewModal(true)}
              >
                Préparer mon entretien
              </Button>
            </div>
          </div>

          {/* KazaIA — Comprendre l'offre en clair */}
          <ExplainJobSection jobId={id} />

          {/* CTA mobile — visible uniquement sur mobile */}
          <div className="lg:hidden kz-card p-4 bg-white">
            <div className="text-xl font-extrabold text-[#1A1410] mb-1">{formatSalary(job.salary_min, job.salary_max)}</div>
            {(() => {
              const sl = getSalaryLabel(job.salary_min, job.salary_max)
              return sl ? (
                <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#1A1410] mb-2"
                  style={{ background: sl.bg, color: sl.color }}>
                  {sl.label}
                </span>
              ) : null
            })()}
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

          {/* ── Description ────────────────────────────────── */}
          <div className="kz-card p-5 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: KZ.orangeSoft }}>
                <Briefcase size={13} color="#1A1410" />
              </div>
              <h2 className="text-base font-bold text-[#1A1410]">Description du poste</h2>
            </div>
            <div className="text-sm leading-relaxed text-[#2A2018] whitespace-pre-line">{job.description}</div>
          </div>

          {/* ── Missions ───────────────────────────────────── */}
          {(job as unknown as { missions?: string | null }).missions && (
            <div className="kz-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: KZ.violetSoft }}>
                  <ListChecks size={13} color={KZ.violet} />
                </div>
                <h2 className="text-base font-bold text-[#1A1410]">Missions attendues</h2>
              </div>
              <div className="text-sm leading-relaxed text-[#2A2018] whitespace-pre-line">
                {(job as unknown as { missions: string }).missions}
              </div>
            </div>
          )}

          {/* ── Profil recherché ───────────────────────────── */}
          {job.requirements && (
            <div className="kz-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: KZ.greenSoft }}>
                  <GraduationCap size={13} color={KZ.green} />
                </div>
                <h2 className="text-base font-bold text-[#1A1410]">Profil recherché</h2>
                {(job as unknown as { required_level?: string | null }).required_level && (
                  <span className="ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#1A1410]"
                    style={{ background: KZ.cream2 }}>
                    {(job as unknown as { required_level: string }).required_level}
                  </span>
                )}
              </div>
              <div className="text-sm leading-relaxed text-[#2A2018] whitespace-pre-line">{job.requirements}</div>
            </div>
          )}

          {/* ── Avantages ──────────────────────────────────── */}
          {(job as unknown as { benefits?: string | null }).benefits && (
            <div className="kz-card p-5 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: '#FFF7C2' }}>
                  <Gift size={13} color="#C9A000" />
                </div>
                <h2 className="text-base font-bold text-[#1A1410]">Avantages & bénéfices</h2>
              </div>
              <div className="text-sm leading-relaxed text-[#2A2018] whitespace-pre-line">
                {(job as unknown as { benefits: string }).benefits}
              </div>
            </div>
          )}

          {/* Pour améliorer vos chances — si pas totalement compatible */}
          {job.match_score !== undefined && job.match_score < 80 && (
            <TrainingRecoCard sector={job.sector} />
          )}

          {/* Fourchette salariale (offre recruteur ou estimation KazaIA) */}
          <SalaryInsightsCard
            sector={job.sector}
            salaryMin={job.salary_min}
            salaryMax={job.salary_max}
            jobTitle={job.title}
            jobType={job.job_type}
          />
        </div>

        {/* Sidebar desktop */}
        <div className="hidden lg:flex flex-col gap-4">
          <div className="kz-card p-5 bg-white">
            <div className="text-2xl font-extrabold tracking-tight text-[#1A1410] mb-1">{formatSalary(job.salary_min, job.salary_max)}</div>
            {(() => {
              const sl = getSalaryLabel(job.salary_min, job.salary_max)
              return sl ? (
                <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full border border-[#1A1410] mb-2"
                  style={{ background: sl.bg, color: sl.color }}>
                  {sl.label}
                </span>
              ) : null
            })()}
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
              {/* KazaScore recruteur */}
              {job.recruiter_id && (
                <div className="mt-2 pt-2 border-t border-[#E8DDC9] flex items-center gap-2">
                  <span className="text-xs text-[#6B5A4A]">Réactivité :</span>
                  <KazaScoreMini recruiterId={job.recruiter_id} />
                </div>
              )}
            </div>
          </div>
          {/* Réputation employeur (indicateurs réels) */}
          <EmployerReputation companyId={job.company?.id} />

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

          {prequalQuestions.length > 0 && (
            <div className="flex flex-col gap-3 p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft }}>
              <p className="text-sm font-bold text-[#1A1410]">Questions du recruteur</p>
              {prequalQuestions.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-semibold text-[#2A2018] mb-1.5">{q.label}{q.required && ' *'}</label>
                  {q.type === 'oui_non' ? (
                    <div className="flex gap-2">
                      {['Oui', 'Non'].map((opt) => (
                        <button key={opt} type="button" onClick={() => setPrequalAnswers((a) => ({ ...a, [q.id]: opt }))}
                          className="flex-1 py-2 rounded-lg border-[1.5px] text-sm font-semibold"
                          style={prequalAnswers[q.id] === opt
                            ? { background: KZ.ink, color: KZ.cream, borderColor: KZ.ink }
                            : { background: 'white', color: KZ.ink, borderColor: KZ.ink }}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : q.type === 'choix' ? (
                    <select value={prequalAnswers[q.id] ?? ''} onChange={(e) => setPrequalAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-[#1A1410] text-sm bg-white">
                      <option value="">Choisir…</option>
                      {(q.options ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input value={prequalAnswers[q.id] ?? ''} onChange={(e) => setPrequalAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border-2 border-[#1A1410] text-sm" placeholder="Votre réponse" />
                  )}
                </div>
              ))}
            </div>
          )}

          <Textarea
            label="Lettre de motivation (optionnel)"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            placeholder="Pourquoi ce poste t'interesse..."
            rows={5}
          />

          {/* Raccourci KazaIA dans le modal */}
          {!coverLetter && (
            <button
              type="button"
              onClick={() => { setApplyModal(false); setCoverLetterModal(true) }}
              className="flex items-center gap-2 text-sm font-semibold p-3 rounded-xl border border-[#1A1410] transition-all hover:shadow-[2px_2px_0_#1A1410]"
              style={{ background: KZ.violetSoft }}
            >
              <Sparkles size={15} color={KZ.violet} />
              <span style={{ color: KZ.violet }}>Générer avec KazaIA</span>
              <span className="text-xs text-[#6B5A4A]">→ Lettre personnalisée en 5 secondes</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row gap-2.5">
            <Button kind="outline" size="lg" full onClick={() => setApplyModal(false)}>Annuler</Button>
            <Button kind="primary" size="lg" full loading={applying} onClick={handleApply}>Envoyer ma candidature</Button>
          </div>
        </div>
      </Modal>

      {/* Modal KazaIA — Cover Letter */}
      <CoverLetterModal
        open={coverLetterModal}
        onClose={() => setCoverLetterModal(false)}
        jobId={id}
        jobTitle={job.title}
        companyName={job.company?.name ?? 'l\'entreprise'}
        onUseLetter={(letter) => {
          setCoverLetter(letter)
          setApplyModal(true)
        }}
      />

      {/* Modal KazaIA — Préparation entretien */}
      <InterviewPrepModal
        open={interviewModal}
        onClose={() => setInterviewModal(false)}
        jobId={id}
        jobTitle={job.title}
      />
    </div>
  )
}

// ── Section « Comprendre l'offre en clair » ───────────────────
import { useInterviewPrepAI, useExplainJobAI } from '@/features/ai/useKazaIA'
import { Modal as ModalBase } from '@/components/ui/Modal'

function ExplainJobSection({ jobId }: { jobId: string }) {
  const { generating, explain, raw, error, generate } = useExplainJobAI()
  const [open, setOpen] = useState(false)
  const started = generating || explain || raw || error

  const handleClick = () => {
    setOpen(v => !v)
    if (!started) generate(jobId)
  }

  return (
    <div className="kz-card p-4 bg-white" style={{ borderColor: KZ.green }}>
      <button onClick={handleClick} className="flex items-center gap-2 w-full text-left">
        <div className="w-7 h-7 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: KZ.green }}>
          <Lightbulb size={13} color="white" />
        </div>
        <span className="text-sm font-bold text-[#1A1410]">Comprendre l&apos;offre en clair</span>
        <Badge color="green" size="sm">KazaIA</Badge>
        <span className="ml-auto">{open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
      </button>

      {open && (
        <div className="mt-4">
          {generating && (
            <div className="flex flex-col items-center gap-3 py-6">
              <InlineLoader size={40} />
              <p className="text-sm text-[#6B5A4A]">KazaIA décrypte l&apos;offre pour toi…</p>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          {!generating && explain && (
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-1">Synthèse</p>
                <p className="text-sm text-[#2A2018] leading-relaxed">{explain.synthese}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-1.5">Les missions, simplement</p>
                <ul className="flex flex-col gap-1.5">
                  {explain.missions?.map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#2A2018]">
                      <Check size={14} className="mt-0.5 shrink-0" color={KZ.green} />{m}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-1">En langage accessible</p>
                <p className="text-sm text-[#2A2018] leading-relaxed">{explain.reformulation}</p>
              </div>
              <div className="p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.greenSoft }}>
                <p className="text-xs font-bold uppercase tracking-wide text-[#1A1410] mb-1 flex items-center gap-1.5">
                  <Wallet size={13} /> Marché salarial local (indicatif)
                </p>
                <p className="text-sm text-[#2A2018] leading-relaxed">{explain.salaire}</p>
              </div>
              {explain.competences?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#6B5A4A] mb-1.5">Compétences principales recherchées</p>
                  <div className="flex gap-2 flex-wrap">
                    {explain.competences.map((c, i) => <Tag key={i}>{c}</Tag>)}
                  </div>
                </div>
              )}
              <p className="text-[11px] text-[#6B5A4A] italic">Généré par KazaIA — à titre indicatif, vérifie toujours l&apos;offre originale.</p>
            </div>
          )}

          {!generating && !explain && raw && (
            <div className="p-4 rounded-xl border border-[#1A1410] text-sm text-[#2A2018] leading-relaxed whitespace-pre-wrap" style={{ background: KZ.paper }}>
              {raw}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function InterviewPrepModal({ open, onClose, jobId, jobTitle }: {
  open: boolean; onClose: () => void; jobId: string; jobTitle: string
}) {
  const { generating, questions, error, generate } = useInterviewPrepAI()

  const handleOpen = () => {
    if (!questions && !generating) generate(jobId)
  }

  // Générer dès l'ouverture
  if (open && !questions && !generating && !error) {
    generate(jobId)
  }

  return (
    <ModalBase open={open} onClose={onClose} title={`Préparer l'entretien — ${jobTitle}`} size="lg">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5 p-3 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft }}>
          <Brain size={18} color={KZ.violet} />
          <p className="text-sm font-semibold text-[#1A1410]">
            KazaIA génère des questions d&apos;entretien personnalisées pour ce poste.
          </p>
        </div>

        {generating && (
          <div className="flex flex-col items-center gap-3 py-8">
            <InlineLoader size={48} />
            <p className="text-sm text-[#6B5A4A]">Analyse du poste en cours...</p>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {questions && !generating && (
          <div
            className="p-4 rounded-xl border border-[#1A1410] text-sm text-[#2A2018] leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto"
            style={{ background: KZ.paper }}
          >
            {questions}
          </div>
        )}

        <Button kind="outline" size="md" onClick={onClose}>Fermer</Button>
      </div>
    </ModalBase>
  )
}
