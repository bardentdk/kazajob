'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EyeOff, Plus, Trash2, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { REUNION_CITIES, JOB_TYPES, JOB_SECTORS, KZ, hasMentionHF, REQUIRED_LEVELS, getSalaryLabel } from '@/lib/constants'
import { PREQUAL_TYPES, PREQUAL_SUGGESTIONS, MAX_PREQUAL_QUESTIONS, type PrequalQuestion } from '@/lib/prequal'
import type { Job } from '@/lib/types'

const CITY_OPTIONS = REUNION_CITIES.map((c) => ({ value: c, label: c }))
const TYPE_OPTIONS = JOB_TYPES.map((t) => ({ value: t, label: t }))
const SECTOR_OPTIONS = JOB_SECTORS.map((s) => ({ value: s, label: s }))

interface JobFormProps {
  job?: Partial<Job>
  recruiterId: string
  companyId?: string
  admin?: boolean
  onSuccess?: () => void
}

export function JobForm({ job, recruiterId, companyId, admin, onSuccess }: JobFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState(job?.title ?? '')
  const [description, setDescription] = useState(job?.description ?? '')
  const [requirements, setRequirements] = useState(job?.requirements ?? '')
  const [location, setLocation] = useState(job?.location ?? '')
  const [jobType, setJobType] = useState(job?.job_type ?? 'CDI')
  const [sector, setSector] = useState(job?.sector ?? '')
  const [remote, setRemote] = useState(job?.remote ?? false)
  const [salaryMin, setSalaryMin] = useState(job?.salary_min?.toString() ?? '')
  const [salaryMax, setSalaryMax] = useState(job?.salary_max?.toString() ?? '')
  const [missions, setMissions] = useState((job as Record<string, unknown>)?.missions as string ?? '')
  const [benefits, setBenefits] = useState((job as Record<string, unknown>)?.benefits as string ?? '')
  const [requiredLevel, setRequiredLevel] = useState((job as Record<string, unknown>)?.required_level as string ?? '')
  const [isAnonymous, setIsAnonymous] = useState((job as Record<string, unknown>)?.is_anonymous as boolean ?? false)
  const [contactEmail, setContactEmail] = useState((job as Record<string, unknown>)?.contact_email as string ?? '')
  const [externalCompany, setExternalCompany] = useState((job as Record<string, unknown>)?.external_company as string ?? '')
  const [prequal, setPrequal] = useState<PrequalQuestion[]>(
    ((job as Record<string, unknown>)?.prequal_questions as PrequalQuestion[] | undefined) ?? [],
  )

  const addQuestion = (label = '') => {
    if (prequal.length >= MAX_PREQUAL_QUESTIONS) return
    setPrequal((q) => [...q, { id: crypto.randomUUID(), label, type: 'oui_non', required: false }])
  }
  const updateQuestion = (id: string, patch: Partial<PrequalQuestion>) =>
    setPrequal((q) => q.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const removeQuestion = (id: string) => setPrequal((q) => q.filter((x) => x.id !== id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !location) {
      setError('Titre, description et localisation sont obligatoires.')
      return
    }
    if (!hasMentionHF(title)) {
      setError('La mention (H/F) est obligatoire dans le titre pour éviter toute discrimination.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      title,
      description,
      missions: missions || null,
      requirements: requirements || null,
      benefits: benefits || null,
      required_level: requiredLevel || null,
      location,
      job_type: jobType,
      sector: sector || null,
      remote,
      salary_min: salaryMin ? parseInt(salaryMin) : null,
      salary_max: salaryMax ? parseInt(salaryMax) : null,
      salary_currency: '€',
      is_anonymous: isAnonymous,
      is_active: true,
      ...(admin ? { contact_email: contactEmail || null, external_company: externalCompany || null } : {}),
      prequal_questions: prequal
        .filter((q) => q.label.trim())
        .map((q) => ({ ...q, options: q.type === 'choix' ? (q.options ?? []).filter(Boolean) : undefined })),
    }

    const res = job?.id
      ? await fetch(`/api/recruiter/jobs/${job.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      : await fetch('/api/recruiter/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, companyId: companyId ?? null }),
        })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Une erreur est survenue. Réessayez.')
      setSaving(false)
      return
    }

    setSaving(false)
    onSuccess?.()
    router.push(admin ? '/admin/jobs' : '/recruiter/jobs')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      {admin && (
        <div className="rounded-xl border-2 p-4" style={{ borderColor: KZ.violet, background: KZ.violetSoft }}>
          <h3 className="text-sm font-bold text-[#1A1410] mb-1">Annonce administrateur (externe)</h3>
          <p className="text-xs text-[#6B5A4A] mb-3">Annonce publiée par Kazajob sans compte recruteur. Les candidatures sont envoyées par email au contact ci-dessous.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Entreprise affichée" value={externalCompany} onChange={(e) => setExternalCompany(e.target.value)} placeholder="Nom de l'entreprise" />
            <Input label="Email de contact (candidatures)" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="recrutement@entreprise.re" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Input
            label="Titre du poste *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Développeur Full-Stack (H/F)"
            required
          />
          {title && !hasMentionHF(title) && (
            <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#FFC93C]"
              style={{ background: '#FFF1C2', color: '#1A1410' }}>
              ⚠️ La mention <strong>(H/F)</strong> est obligatoire pour éviter la discrimination — ajoutez-la au titre.
            </div>
          )}
        </div>
        <Select
          label="Type de contrat"
          options={TYPE_OPTIONS}
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
        />
        <Select
          label="Localisation *"
          options={CITY_OPTIONS}
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Choisir une ville"
        />
        <Select
          label="Secteur"
          options={SECTOR_OPTIONS}
          value={sector}
          onChange={(e) => setSector(e.target.value)}
          placeholder="Choisir un secteur"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#2A2018]">Remote</label>
          <div className="flex gap-2">
            {[{ v: false, l: 'Presentiel' }, { v: true, l: 'Remote possible' }].map(({ v, l }) => (
              <button
                key={l}
                type="button"
                onClick={() => setRemote(v)}
                className="flex-1 py-2.5 text-sm font-semibold border-[1.5px] rounded-lg"
                style={remote === v
                  ? { background: '#1A1410', color: '#FFF7EE', borderColor: '#1A1410' }
                  : { background: 'white', color: '#1A1410', borderColor: '#1A1410' }}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Salaire min (€/an)"
            type="number"
            value={salaryMin}
            onChange={(e) => setSalaryMin(e.target.value)}
            placeholder="30000"
          />
          <Input
            label="Salaire max (€/an)"
            type="number"
            value={salaryMax}
            onChange={(e) => setSalaryMax(e.target.value)}
            placeholder="45000"
          />
        </div>
        {/* Mini repère benchmark 974 */}
        {(salaryMin || salaryMax) && (() => {
          const sl = getSalaryLabel(salaryMin ? parseInt(salaryMin) : null, salaryMax ? parseInt(salaryMax) : null)
          return sl ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1A1410] text-sm font-semibold"
              style={{ background: sl.bg, color: sl.color }}>
              <span style={{ background: sl.color, width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }} />
              <span>{sl.label}</span>
              <span className="text-xs font-normal text-[#6B5A4A] ml-1">— repère marché La Réunion 974</span>
            </div>
          ) : null
        })()}
      </div>

      <Textarea
        label="Description du poste *"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Présentez le poste, l'environnement de travail, le contexte..."
        rows={5}
        required
      />

      <Textarea
        label="Missions attendues"
        value={missions}
        onChange={(e) => setMissions(e.target.value)}
        placeholder="Listez les responsabilités et missions principales du poste (une par ligne) :"
        rows={5}
      />

      <Textarea
        label="Profil recherche"
        value={requirements}
        onChange={(e) => setRequirements(e.target.value)}
        placeholder="Formation, expérience, compétences requises..."
        rows={4}
      />

      <Textarea
        label="Avantages & bénéfices"
        value={benefits}
        onChange={(e) => setBenefits(e.target.value)}
        placeholder="Mutuelle, tickets-restaurant, RTT, télétravail, primes, véhicule de fonction..."
        rows={3}
      />

      <div>
        <Select
          label="Niveau d'expérience requis"
          options={[{ value: '', label: 'Non précisé' }, ...REQUIRED_LEVELS.map(l => ({ value: l.id, label: l.label }))]}
          value={requiredLevel}
          onChange={(e) => setRequiredLevel(e.target.value)}
        />
      </div>

      {/* Toggle publication anonyme */}
      <button
        type="button"
        onClick={() => setIsAnonymous(v => !v)}
        className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all"
        style={{
          borderColor: isAnonymous ? KZ.violet : KZ.line,
          background: isAnonymous ? KZ.violetSoft : KZ.cream2,
        }}
      >
        <div className="w-9 h-9 rounded-lg border border-[#1A1410] flex items-center justify-center shrink-0"
          style={{ background: isAnonymous ? KZ.violet : 'white' }}>
          <EyeOff size={16} color={isAnonymous ? 'white' : KZ.mute} />
        </div>
        <div>
          <div className="text-sm font-bold text-[#1A1410]">Publication anonyme</div>
          <div className="text-xs text-[#6B5A4A]">
            {isAnonymous
              ? 'Les candidats verront "Entreprise confidentielle" — nom caché'
              : 'Les candidats verront le nom et le logo de votre entreprise'}
          </div>
        </div>
        <div className="ml-auto w-10 h-6 rounded-full border border-[#1A1410] transition-colors shrink-0 relative"
          style={{ background: isAnonymous ? KZ.violet : '#E8DDC9' }}>
          <div className="absolute top-0.5 h-5 w-5 rounded-full border border-[#1A1410] transition-all bg-white"
            style={{ left: isAnonymous ? 'calc(100% - 22px)' : '2px' }} />
        </div>
      </button>

      {/* Préqualification candidat */}
      <div className="rounded-xl border-2 p-4" style={{ borderColor: KZ.line, background: KZ.cream2 }}>
        <div className="flex items-center gap-2 mb-1">
          <ListChecks size={16} color={KZ.violet} />
          <h3 className="text-sm font-bold text-[#1A1410]">Questions de préqualification</h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]" style={{ background: KZ.violetSoft, color: KZ.violet }}>Optionnel</span>
        </div>
        <p className="text-xs text-[#6B5A4A] mb-3">
          Posez des questions rapides aux candidats pour faciliter le tri ({MAX_PREQUAL_QUESTIONS} max).
        </p>

        <div className="flex flex-col gap-2.5">
          {prequal.map((q) => (
            <div key={q.id} className="flex flex-col sm:flex-row gap-2 p-2.5 rounded-lg border border-[#E8DDC9] bg-white">
              <Input className="flex-1" value={q.label} placeholder="Ex : Avez-vous le permis B ?"
                onChange={(e) => updateQuestion(q.id, { label: e.target.value })} />
              <Select className="sm:w-40" options={PREQUAL_TYPES.map((t) => ({ value: t.id, label: t.label }))}
                value={q.type} onChange={(e) => updateQuestion(q.id, { type: e.target.value as PrequalQuestion['type'] })} />
              {q.type === 'choix' && (
                <Input className="sm:w-48" value={(q.options ?? []).join(', ')} placeholder="Options, séparées par virgule"
                  onChange={(e) => updateQuestion(q.id, { options: e.target.value.split(',').map((s) => s.trim()) })} />
              )}
              <button type="button" onClick={() => removeQuestion(q.id)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B5A4A] hover:text-red-600 shrink-0 self-center">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>

        {prequal.length < MAX_PREQUAL_QUESTIONS && (
          <>
            <Button type="button" kind="outline" size="sm" icon={<Plus size={14} />} className="mt-3" onClick={() => addQuestion()}>
              Ajouter une question
            </Button>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PREQUAL_SUGGESTIONS.filter((s) => !prequal.some((q) => q.label === s)).map((s) => (
                <button key={s} type="button" onClick={() => addQuestion(s)}
                  className="text-[11px] font-semibold px-2 py-1 rounded-full border border-[#1A1410] hover:shadow-[2px_2px_0_#1A1410] transition-all"
                  style={{ background: 'white', color: KZ.ink }}>
                  + {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" kind="soft" size="lg" onClick={() => router.back()}>
          Annuler
        </Button>
        <Button type="submit" kind="primary" size="lg" full loading={saving}>
          {job?.id ? 'Mettre a jour' : 'Publier l\'offre'}
        </Button>
      </div>
    </form>
  )
}
