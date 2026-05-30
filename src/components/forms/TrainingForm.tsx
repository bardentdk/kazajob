'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { createClient } from '@/lib/supabase/client'
import {
  REUNION_CITIES, JOB_SECTORS, KZ,
  CERTIFICATION_LEVELS, FINANCING_OPTIONS, DURATION_UNITS, hasMentionHF,
} from '@/lib/constants'
import type { TrainingOffer } from '@/lib/types'

interface TrainingFormProps {
  training?: Partial<TrainingOffer>
  recruiterId: string
  companyId?: string
  onSuccess?: () => void
}

const CITY_OPTIONS  = REUNION_CITIES.map(c => ({ value: c, label: c }))
const SECTOR_OPTIONS = JOB_SECTORS.map(s => ({ value: s, label: s }))
const CERT_OPTIONS  = CERTIFICATION_LEVELS.map(c => ({ value: c.id, label: c.label }))
const UNIT_OPTIONS  = DURATION_UNITS.map(u => ({ value: u.id, label: u.label }))

export function TrainingForm({ training, recruiterId, companyId, onSuccess }: TrainingFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  // Champs
  const [title,              setTitle]             = useState(training?.title ?? '')
  const [description,        setDescription]       = useState(training?.description ?? '')
  const [program,            setProgram]           = useState(training?.program ?? '')
  const [prerequisites,      setPrerequisites]     = useState(training?.prerequisites ?? '')
  const [certification,      setCertification]     = useState(training?.certification ?? '')
  const [certificationLevel, setCertLevel]         = useState(training?.certification_level ?? '')
  const [durationValue,      setDurationValue]     = useState(training?.duration_value?.toString() ?? '35')
  const [durationUnit, setDurationUnit] = useState<'heures' | 'jours' | 'semaines' | 'mois'>(training?.duration_unit ?? 'heures')
  const [location,           setLocation]          = useState(training?.location ?? '')
  const [remote,             setRemote]            = useState(training?.remote ?? false)
  const [sector,             setSector]            = useState(training?.sector ?? '')
  const [startDate,          setStartDate]         = useState(training?.start_date ?? '')
  const [maxParticipants,    setMaxParticipants]   = useState(training?.max_participants?.toString() ?? '15')
  const [isFinanced,         setIsFinanced]        = useState(training?.is_financed ?? false)
  const [financing,          setFinancing]         = useState<string[]>(training?.financing_options ?? [])
  const [imageUrl,           setImageUrl]          = useState(training?.image_url ?? null as string | null)
  const [imagePreview,       setImagePreview]      = useState<string | null>(null)

  // IC events du recruteur
  const [events, setEvents]     = useState<{ id: string; title: string; date: string }[]>([])
  const [infoSessionId,  setInfoSessionId] = useState(training?.info_session_id ?? '')

  useEffect(() => {
    supabase.from('events')
      .select('id, title, date')
      .eq('organizer_id', recruiterId)
      .eq('is_published', true)
      .gte('date', new Date().toISOString())
      .eq('type', 'info_collective')
      .order('date')
      .then(({ data }) => setEvents((data ?? []) as typeof events))
  }, [recruiterId])

  const toggleFinancing = (opt: string) =>
    setFinancing(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUploading(true)
    const path = `${recruiterId}/${Date.now()}-${file.name}`
    const { data, error: uploadErr } = await supabase.storage
      .from('training-images').upload(path, file, { upsert: true })
    if (!uploadErr && data) {
      const { data: pub } = supabase.storage.from('training-images').getPublicUrl(path)
      setImageUrl(pub.publicUrl)
      setImagePreview(URL.createObjectURL(file))
    }
    setImageUploading(false)
  }

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
      title, description,
      program:             program || null,
      prerequisites:       prerequisites || null,
      certification:       certification || null,
      certification_level: certificationLevel || null,
      duration_value:      parseInt(durationValue) || 35,
      duration_unit:       durationUnit,
      location, remote,
      sector:              sector || null,
      start_date:          startDate || null,
      max_participants:    parseInt(maxParticipants) || 15,
      is_financed:         isFinanced,
      financing_options:   financing,
      image_url:           imageUrl,
      info_session_id:     infoSessionId || null,
      recruiter_id:        recruiterId,
      company_id:          companyId ?? null,
      is_active:           true,
      updated_at:          new Date().toISOString(),
    }

    if (training?.id) {
      await supabase.from('training_offers').update(payload).eq('id', training.id)
    } else {
      await supabase.from('training_offers').insert(payload)
    }

    setSaving(false)
    onSuccess?.()
    router.push('/recruiter/training')
  }

  const hfOk = !title || hasMentionHF(title)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={15} />{error}
        </div>
      )}

      {/* ── Image ────────────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-bold text-[#1A1410] mb-2">
          Image de l&apos;offre <span className="text-[#6B5A4A] font-normal text-xs">(obligatoire — visuel, logo OF, etc.)</span>
        </label>
        <label className="cursor-pointer">
          <div
            className="relative rounded-2xl border-2 border-dashed border-[#1A1410] overflow-hidden flex items-center justify-center"
            style={{ height: 180, background: KZ.cream2 }}
          >
            {imagePreview || imageUrl ? (
              <>
                <img src={imagePreview ?? imageUrl!} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setImageUrl(null); setImagePreview(null) }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white border border-[#1A1410] flex items-center justify-center"
                >
                  <X size={13} />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#6B5A4A]">
                {imageUploading ? (
                  <div className="animate-spin w-6 h-6 border-2 border-[#1A1410] border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Upload size={28} />
                    <span className="text-sm font-semibold">Cliquer pour uploader</span>
                    <span className="text-xs">JPG, PNG, WebP · max 5 Mo</span>
                  </>
                )}
              </div>
            )}
          </div>
          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={handleImageUpload} disabled={imageUploading} />
        </label>
      </div>

      {/* ── Titre avec (H/F) ──────────────────────────────── */}
      <div>
        <Input
          label="Titre de la formation *"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Développeur Web Full-Stack (H/F)"
          required
        />
        {!hfOk && (
          <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#FFC93C]"
            style={{ background: '#FFF1C2', color: '#1A1410' }}>
            ⚠️ La mention <strong>(H/F)</strong> est obligatoire dans le titre.
          </div>
        )}
      </div>

      {/* ── Certification ─────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Certification / Titre obtenu"
          value={certification}
          onChange={e => setCertification(e.target.value)}
          placeholder="Titre Pro Développeur Web"
        />
        <Select
          label="Niveau RNCP"
          options={[{ value: '', label: 'Choisir un niveau' }, ...CERT_OPTIONS]}
          value={certificationLevel}
          onChange={e => setCertLevel(e.target.value)}
        />
      </div>

      {/* ── Durée ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Input
            label="Durée *"
            type="number"
            value={durationValue}
            onChange={e => setDurationValue(e.target.value)}
            min="1"
            required
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <Select
            label="Unité"
            options={UNIT_OPTIONS}
            value={durationUnit}
            onChange={e => setDurationUnit(e.target.value as 'heures' | 'jours' | 'semaines' | 'mois')}
          />
        </div>
        <Input
          label="Places max *"
          type="number"
          value={maxParticipants}
          onChange={e => setMaxParticipants(e.target.value)}
          min="1"
          required
        />
        <Input
          label="Date de début"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />
      </div>

      {/* ── Lieu ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-2">
          <Select
            label="Ville *"
            options={[{ value: '', label: 'Choisir une ville' }, ...CITY_OPTIONS]}
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Choisir une ville"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Format</label>
          <div className="flex gap-2 h-[42px]">
            {[{ v: false, l: 'Présentiel' }, { v: true, l: 'Distanciel' }].map(({ v, l }) => (
              <button key={l} type="button" onClick={() => setRemote(v)}
                className="flex-1 rounded-xl border-2 text-sm font-semibold transition-all"
                style={remote === v
                  ? { background: '#1A1410', color: KZ.cream, borderColor: '#1A1410' }
                  : { background: 'white', color: '#1A1410', borderColor: '#1A1410' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Secteur ───────────────────────────────────────── */}
      <Select
        label="Secteur"
        options={[{ value: '', label: 'Choisir un secteur' }, ...SECTOR_OPTIONS]}
        value={sector}
        onChange={e => setSector(e.target.value)}
        placeholder="Choisir un secteur"
      />

      {/* ── Description ───────────────────────────────────── */}
      <Textarea
        label="Description de la formation *"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Objectifs, public cible, débouchés professionnels..."
        rows={4}
        required
      />

      {/* ── Programme ─────────────────────────────────────── */}
      <Textarea
        label="Programme / Contenu pédagogique"
        value={program}
        onChange={e => setProgram(e.target.value)}
        placeholder="Modules, compétences développées, méthodes pédagogiques..."
        rows={4}
      />

      {/* ── Prérequis ─────────────────────────────────────── */}
      <Textarea
        label="Prérequis d'accès"
        value={prerequisites}
        onChange={e => setPrerequisites(e.target.value)}
        placeholder="Niveau minimum requis, compétences préalables..."
        rows={2}
      />

      {/* ── Financement ───────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <label className="text-sm font-bold text-[#1A1410]">Financement disponible</label>
          <button
            type="button"
            onClick={() => setIsFinanced(v => !v)}
            className="relative inline-flex h-6 w-11 items-center rounded-full border border-[#1A1410] transition-colors shrink-0"
            style={{ background: isFinanced ? KZ.green : KZ.cream2 }}
          >
            <span className="inline-block w-4 h-4 rounded-full bg-white border border-[#1A1410] transition-transform"
              style={{ transform: isFinanced ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
        </div>
        {isFinanced && (
          <div className="flex flex-wrap gap-2">
            {FINANCING_OPTIONS.map(opt => (
              <button
                key={opt} type="button"
                onClick={() => toggleFinancing(opt)}
                className="px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all"
                style={{
                  borderColor: financing.includes(opt) ? KZ.green : '#E8DDC9',
                  background: financing.includes(opt) ? KZ.greenSoft : KZ.cream2,
                  color: financing.includes(opt) ? KZ.green : '#2A2018',
                }}
              >
                {financing.includes(opt) && '✓ '}{opt}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Session IC ────────────────────────────────────── */}
      <div>
        <label className="block text-sm font-bold text-[#1A1410] mb-1.5">
          Session d&apos;Information Collective (IC)
          <span className="text-[#6B5A4A] font-normal text-xs ml-2">optionnel — lier à un KazaEvent IC</span>
        </label>
        {events.length === 0 ? (
          <div className="text-xs text-[#6B5A4A] p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
            Aucune session IC planifiée. Créez d&apos;abord un event de type &quot;Info Collective&quot; dans KazaEvents.
          </div>
        ) : (
          <select
            className="w-full px-3 py-2.5 rounded-xl border-2 border-[#1A1410] text-sm bg-white focus:outline-none"
            value={infoSessionId}
            onChange={e => setInfoSessionId(e.target.value)}
          >
            <option value="">Aucune session liée</option>
            {events.map(ev => (
              <option key={ev.id} value={ev.id}>
                {ev.title} — {new Date(ev.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* ── Actions ───────────────────────────────────────── */}
      <div className="flex gap-3 pt-2">
        <Button type="button" kind="soft" size="lg" onClick={() => router.back()}>Annuler</Button>
        <Button type="submit" kind="primary" size="lg" full loading={saving}>
          {training?.id ? 'Mettre à jour' : 'Publier la formation'}
        </Button>
      </div>
    </form>
  )
}
