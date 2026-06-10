'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { REUNION_CITIES, JOB_TYPES, JOB_SECTORS, KZ, hasMentionHF } from '@/lib/constants'
import type { Job } from '@/lib/types'

const CITY_OPTIONS = REUNION_CITIES.map((c) => ({ value: c, label: c }))
const TYPE_OPTIONS = JOB_TYPES.map((t) => ({ value: t, label: t }))
const SECTOR_OPTIONS = JOB_SECTORS.map((s) => ({ value: s, label: s }))

interface JobFormProps {
  job?: Partial<Job>
  recruiterId: string
  companyId?: string
  onSuccess?: () => void
}

export function JobForm({ job, recruiterId, companyId, onSuccess }: JobFormProps) {
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
  const [isAnonymous, setIsAnonymous] = useState((job as Record<string, unknown>)?.is_anonymous as boolean ?? false)

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
      requirements: requirements || null,
      location,
      job_type: jobType,
      sector: sector || null,
      remote,
      salary_min: salaryMin ? parseInt(salaryMin) : null,
      salary_max: salaryMax ? parseInt(salaryMax) : null,
      salary_currency: '€',
      is_anonymous: isAnonymous,
      is_active: true,
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
    router.push('/recruiter/jobs')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
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

      <Textarea
        label="Description du poste *"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Decrivez le poste, les missions, l'environnement de travail..."
        rows={6}
        required
      />

      <Textarea
        label="Profil recherche"
        value={requirements}
        onChange={(e) => setRequirements(e.target.value)}
        placeholder="Formation, experience, competences requises..."
        rows={4}
      />

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
