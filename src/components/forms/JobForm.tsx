'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { REUNION_CITIES, JOB_TYPES, JOB_SECTORS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
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
  const supabase = createClient()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !location) {
      setError('Titre, description et localisation sont obligatoires.')
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
      recruiter_id: recruiterId,
      company_id: companyId ?? null,
      is_active: true,
      updated_at: new Date().toISOString(),
    }

    if (job?.id) {
      await supabase.from('jobs').update(payload).eq('id', job.id)
    } else {
      await supabase.from('jobs').insert(payload)
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
        <Input
          label="Titre du poste *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Developpeur Full-Stack"
          className="col-span-2"
          required
        />
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
