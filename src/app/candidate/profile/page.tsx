'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Phone, Mail, Edit3, Check, Plus, X, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { FileUpload } from '@/components/ui/FileUpload'
import dynamic from 'next/dynamic'
import { KazaBoostButton } from '@/components/ui/KazaBoostButton'

// Import dynamique ssr:false pour éviter les erreurs MediaRecorder en prod
const VideoPitchRecorder = dynamic(
  () => import('@/components/ui/VideoPitchRecorder').then(m => ({ default: m.VideoPitchRecorder })),
  { ssr: false, loading: () => <div className="h-24 rounded-xl bg-[#FBEFE0] animate-pulse" /> }
)
import { useAuth } from '@/features/auth/useAuth'
import { useApplications } from '@/features/applications/useApplications'
import { useAvatarUpload, useCvUpload } from '@/features/profile/useUpload'
import { createClient } from '@/lib/supabase/client'
import { KZ, SOFT_SKILLS, HOBBIES } from '@/lib/constants'

interface SkillRow { id: string; name: string; category: string | null }

async function patchProfile(patch: Record<string, unknown>) {
  await fetch('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

export default function CandidateProfilePage() {
  const { profile, refetch } = useAuth()
  const { applications } = useApplications(profile?.id)
  const { upload: uploadAvatar, uploading: uploadingAvatar } = useAvatarUpload(profile?.id)
  const { upload: uploadCv, uploading: uploadingCv, progress: cvProgress, getSignedUrl } = useCvUpload(profile?.id)

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [softSkills, setSoftSkills] = useState<string[]>([])
  const [hobbies, setHobbies] = useState<string[]>([])
  const [allSkills, setAllSkills] = useState<SkillRow[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [showSkillSearch, setShowSkillSearch] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [cvFileName, setCvFileName] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setBio(profile.bio ?? '')
      setLocation(profile.location ?? '')
      setPhone(profile.phone ?? '')
      setSoftSkills(profile.soft_skills ?? [])
      setHobbies(profile.hobbies ?? [])
    }
  }, [profile])

  useEffect(() => {
    if (!profile?.id) return
    const fetchSkills = async () => {
      const res = await fetch('/api/candidate-skills')
      if (res.ok) setSkills(((await res.json()) as SkillRow[]).filter(Boolean))
    }
    fetchSkills()
  }, [profile?.id])

  useEffect(() => {
    if (!showSkillSearch) return
    fetch('/api/skills')
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAllSkills(d as SkillRow[]))
  }, [showSkillSearch])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName, bio, location, phone,
        soft_skills: softSkills, hobbies,
      }),
    })
    await refetch?.()
    setSaving(false)
    setEditing(false)
  }

  const handleAvatarFile = async (file: File) => {
    setUploadError(null)
    const { error } = await uploadAvatar(file)
    if (error) { setUploadError(error); return }
    await refetch?.()
  }

  const handleCvFile = async (file: File) => {
    setUploadError(null)
    setCvFileName(file.name)
    const { error } = await uploadCv(file)
    if (error) { setUploadError(error); setCvFileName(null) }
    else await refetch?.()
  }

  const handleDownloadCv = async () => {
    if (!profile?.cv_url) return
    const url = await getSignedUrl(profile.cv_url)
    if (url) window.open(url, '_blank')
  }

  // ── Video Pitch ───────────────────────────────────────────────
  const handleVideoPitchUpload = async (blob: Blob, mimeType: string) => {
    if (!profile?.id) return { url: null, error: 'Non authentifié' }
    const path = `${profile.id}/pitch.webm`
    const { error: storageError } = await supabase.storage
      .from('video-pitches')
      .upload(path, blob, { upsert: true, contentType: mimeType })
    if (storageError) return { url: null, error: storageError.message }
    const signedResult = await supabase.storage
      .from('video-pitches').createSignedUrl(path, 60 * 60 * 24 * 365)
    const signedUrl = signedResult.data?.signedUrl ?? null
    await patchProfile({ video_pitch_url: `video-pitches/${path}` })
    await refetch?.()
    return { url: signedUrl, error: null }
  }

  const handleVideoPitchDelete = async () => {
    if (!profile?.id) return
    await supabase.storage.from('video-pitches').remove([`${profile.id}/pitch.webm`])
    await patchProfile({ video_pitch_url: null })
    await refetch?.()
  }

  const addSkill = async (skill: SkillRow) => {
    if (!profile?.id || skills.find(s => s.id === skill.id)) return
    await fetch('/api/candidate-skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId: skill.id }),
    })
    setSkills(prev => [...prev, skill])
    setSkillSearch('')
  }

  const removeSkill = async (skillId: string) => {
    if (!profile?.id) return
    await fetch(`/api/candidate-skills?skillId=${skillId}`, { method: 'DELETE' })
    setSkills(prev => prev.filter(s => s.id !== skillId))
  }

  const fields = [profile?.full_name, profile?.bio, profile?.location, profile?.phone, profile?.cv_url, profile?.avatar_url]
  const profileScore = Math.round((fields.filter(Boolean).length / fields.length) * 100)

  const filteredSkills = allSkills.filter(s =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()) && !skills.find(cs => cs.id === s.id)
  )

  const hasCv = !!profile?.cv_url
  const hasCvBuilder = !!profile?.cv_data

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410]">Mon profil</h1>
        {!editing ? (
          <Button kind="outline" size="md" icon={<Edit3 size={15} />} onClick={() => setEditing(true)}>Modifier</Button>
        ) : (
          <div className="flex gap-2">
            <Button kind="soft" size="md" onClick={() => setEditing(false)}>Annuler</Button>
            <Button kind="primary" size="md" icon={<Check size={15} />} loading={saving} onClick={handleSave}>Sauvegarder</Button>
          </div>
        )}
      </div>

      {uploadError && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <X size={15} />{uploadError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Colonne gauche */}
        <div className="flex flex-col gap-4">
          {/* Avatar avec upload */}
          <div className="kz-card p-5 bg-white text-center">
            <div className="flex justify-center mb-4 relative">
              <div className="relative">
                <Avatar name={profile?.full_name ?? 'KZ'} src={profile?.avatar_url} size={80} color={KZ.orangeSoft} badge />
                {/* Zone de click pour changer l'avatar */}
                <FileUpload
                  accept="image/jpeg,image/png,image/webp"
                  maxSizeMb={5}
                  onFile={handleAvatarFile}
                  variant="avatar"
                  uploading={uploadingAvatar}
                  className="absolute inset-0 rounded-full"
                />
              </div>
            </div>
            {uploadingAvatar && (
              <p className="text-xs text-[#6B5A4A] mb-2">Upload de la photo...</p>
            )}
            <div className="text-base font-bold text-[#1A1410]">{profile?.full_name}</div>
            <div className="text-xs text-[#6B5A4A] mt-0.5 mb-4">{profile?.location ?? 'La Reunion'}</div>
            <Progress value={profileScore} color={KZ.orange} label="Profil complete" />
            <p className="text-[11px] text-[#6B5A4A] mt-2">Clique sur ta photo pour la changer</p>
          </div>

          {/* CV */}
          <div className="kz-card p-5 bg-white">
            <h3 className="text-sm font-bold text-[#1A1410] mb-3">Mon CV</h3>

            {/* CV Builder (cv_data) */}
            {hasCvBuilder && (
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[#6D3BEB] bg-[#E5DCFF]">
                  <Check size={16} color={KZ.violet} />
                  <span className="text-sm font-semibold text-[#1A1410] flex-1">CV Builder — créé</span>
                </div>
                <div className="flex gap-2">
                  <Link href="/onboarding/cv-builder" className="flex-1">
                    <Button kind="violet" size="sm" full icon={<ExternalLink size={13} />}>
                      Modifier / Télécharger
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* CV uploadé (cv_url) */}
            {hasCv ? (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[#19A974] bg-[#D6F0E0]">
                  <Check size={16} color={KZ.green} />
                  <span className="text-sm font-semibold text-[#1A1410] flex-1 min-w-0 truncate">
                    {cvFileName ?? 'CV uploadé'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button kind="soft" size="sm" full icon={<Download size={13} />} onClick={handleDownloadCv}>
                    Télécharger
                  </Button>
                  <Button kind="outline" size="sm" icon={<ExternalLink size={13} />} onClick={() => setCvFileName(null)}>
                    Changer
                  </Button>
                </div>
              </div>
            ) : !hasCvBuilder ? (
              <div className="flex flex-col gap-2">
                <Link href="/onboarding/cv-builder">
                  <Button kind="primary" size="sm" full icon={<ExternalLink size={13} />}>
                    Créer mon CV avec le Builder
                  </Button>
                </Link>
                <div className="text-center text-xs text-[#6B5A4A] py-1">ou</div>
                <FileUpload
                  accept=".pdf,.doc,.docx"
                  maxSizeMb={10}
                  hint="PDF ou Word · max 10 Mo"
                  onFile={handleCvFile}
                  uploading={uploadingCv}
                  progress={cvProgress}
                  currentFileName={cvFileName ?? undefined}
                />
              </div>
            ) : null}

            {/* Permettre un nouvel upload si on veut changer */}
            {hasCv && !cvFileName && (
              <div className="mt-3">
                <FileUpload
                  accept=".pdf,.doc,.docx"
                  maxSizeMb={10}
                  hint="Remplacer par un nouveau CV"
                  onFile={handleCvFile}
                  uploading={uploadingCv}
                  progress={cvProgress}
                />
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="kz-card p-5 bg-white">
            <h3 className="text-sm font-bold text-[#1A1410] mb-3">Badges obtenus</h3>
            <div className="flex flex-wrap gap-2">
              {(profile?.streak ?? 0) > 0  && <Badge color="orange" size="md">Streak {profile!.streak}j</Badge>}
              {(profile?.xp ?? 0) >= 1000   && <Badge color="violet" size="md">Niveau {Math.floor((profile!.xp) / 1000) + 1}</Badge>}
              {profileScore >= 80            && <Badge color="green"  size="md">Profil complet</Badge>}
              {hasCv                         && <Badge color="blue"   size="md">CV uploade</Badge>}
              {!!profile?.video_pitch_url && <Badge color="orange" size="md">Pitch video</Badge>}
              {applications.length >= 5      && <Badge color="yellow" size="md">{applications.length} candidatures</Badge>}
              {(profile?.streak ?? 0) === 0 && (profile?.xp ?? 0) === 0 && !hasCv && (
                <p className="text-xs text-[#6B5A4A]">Complete ton profil pour obtenir des badges.</p>
              )}
            </div>
          </div>

          {/* Video Pitch */}
          <div className="kz-card p-5 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-bold text-[#1A1410]">Pitch vidéo</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#1A1410]"
                style={{ background: KZ.orangeSoft, color: KZ.ink }}>
                60s max
              </span>
            </div>
            <p className="text-xs text-[#6B5A4A] mb-3 leading-relaxed">
              Présente-toi en 60 secondes. Les recruteurs peuvent voir ton pitch directement sur ton profil — un vrai avantage pour te démarquer !
            </p>
            <VideoPitchRecorder
              currentUrl={profile?.video_pitch_url ?? null}
              onUpload={handleVideoPitchUpload}
              onDelete={handleVideoPitchDelete}
            />
          </div>

          {/* KazaBoost */}
          <div className="kz-card p-5 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-[#1A1410]">KazaBoost</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#1A1410]"
                style={{ background: KZ.yellowSoft, color: '#1A1410' }}>
                48h
              </span>
            </div>
            <p className="text-xs text-[#6B5A4A] mb-3 leading-relaxed">
              Boostez votre profil et apparaissez en priorité dans les recherches recruteurs pendant 48h.
            </p>
            {profile && (
              <KazaBoostButton
                profileId={profile.id}
                xp={profile.xp ?? 0}
                boostedUntil={profile.boosted_until ?? null}
                onBoost={refetch}
              />
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          {/* Infos personnelles */}
          <div className="kz-card p-5 bg-white">
            <h2 className="text-lg font-bold text-[#1A1410] mb-4">Informations personnelles</h2>
            {editing ? (
              <div className="flex flex-col gap-4">
                <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Textarea label="Bio / Presentation" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Parle de toi en quelques lignes..." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Localisation" value={location} onChange={(e) => setLocation(e.target.value)} icon={<MapPin size={15} />} placeholder="Saint-Denis" />
                  <Input label="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={15} />} placeholder="+262 692 ..." />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div>
                  <div className="text-xs text-[#6B5A4A] mb-0.5">Nom complet</div>
                  <div className="text-sm font-semibold text-[#1A1410]">{profile?.full_name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-[#6B5A4A] mb-0.5">Email</div>
                  <div className="flex items-center gap-2 text-sm text-[#1A1410]"><Mail size={13} />{profile?.email}</div>
                </div>
                <div>
                  <div className="text-xs text-[#6B5A4A] mb-0.5">Bio</div>
                  <div className="text-sm text-[#2A2018]">{profile?.bio || <span className="text-[#6B5A4A] italic">Aucune bio — clique sur Modifier</span>}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B5A4A] mb-0.5">Localisation</div>
                    <div className="flex items-center gap-1 text-sm text-[#1A1410]"><MapPin size={13} />{profile?.location || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B5A4A] mb-0.5">Telephone</div>
                    <div className="flex items-center gap-1 text-sm text-[#1A1410]"><Phone size={13} />{profile?.phone || '—'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compétences */}
          <div className="kz-card p-5 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#1A1410]">Competences</h2>
              <Button kind="soft" size="sm" icon={<Plus size={13} />} onClick={() => setShowSkillSearch(v => !v)}>
                Ajouter
              </Button>
            </div>

            {showSkillSearch && (
              <div className="mb-4 relative">
                <Input
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Rechercher React, Python, Figma..."
                  autoFocus
                />
                {skillSearch.length > 0 && filteredSkills.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[#1A1410] rounded-lg shadow-[3px_3px_0_#1A1410] mt-1 max-h-44 overflow-y-auto">
                    {filteredSkills.slice(0, 8).map(s => (
                      <button key={s.id} onClick={() => { addSkill(s); setShowSkillSearch(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#FBEFE0] text-sm">
                        <span className="font-semibold text-[#1A1410]">{s.name}</span>
                        {s.category && <span className="text-xs text-[#6B5A4A]">{s.category}</span>}
                      </button>
                    ))}
                  </div>
                )}
                {skillSearch.length > 0 && filteredSkills.length === 0 && (
                  <p className="mt-2 text-xs text-[#6B5A4A]">Aucune competence trouvee.</p>
                )}
              </div>
            )}

            {skills.length === 0 ? (
              <div className="text-sm text-[#6B5A4A] py-4 text-center border border-dashed border-[#E8DDC9] rounded-lg">
                Aucune competence — clique sur &quot;Ajouter&quot; pour commencer.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border border-[#1A1410] rounded-md" style={{ background: KZ.violetSoft }}>
                    {s.name}
                    <button onClick={() => removeSkill(s.id)} className="text-[#6B5A4A] hover:text-red-600"><X size={10} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Soft skills */}
          <div className="kz-card p-5 bg-white">
            <h2 className="text-lg font-bold text-[#1A1410] mb-1">Soft skills</h2>
            <p className="text-xs text-[#6B5A4A] mb-4">Savoir-être — visible sur ton CV.</p>
            {editing ? (
              <div className="flex flex-wrap gap-1.5">
                {SOFT_SKILLS.map(s => {
                  const on = softSkills.includes(s)
                  return (
                    <button key={s} type="button"
                      onClick={() => setSoftSkills(prev => on ? prev.filter(x => x !== s) : [...prev, s])}
                      className="px-2.5 py-1 text-xs font-semibold border rounded-full transition-all"
                      style={on ? { background: KZ.violet, color: 'white', borderColor: KZ.violet }
                                : { background: KZ.paper, color: '#2A2018', borderColor: '#E8DDC9' }}>
                      {on && '✓ '}{s}
                    </button>
                  )
                })}
              </div>
            ) : softSkills.length === 0 ? (
              <div className="text-sm text-[#6B5A4A] py-4 text-center border border-dashed border-[#E8DDC9] rounded-lg">
                Aucun soft skill — clique sur &quot;Modifier&quot;.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {softSkills.map(s => (
                  <span key={s} className="px-2.5 py-1 text-xs font-semibold border border-[#1A1410] rounded-md" style={{ background: KZ.violetSoft }}>{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Loisirs */}
          <div className="kz-card p-5 bg-white">
            <h2 className="text-lg font-bold text-[#1A1410] mb-1">Loisirs</h2>
            <p className="text-xs text-[#6B5A4A] mb-4">Centres d&apos;intérêt — visible sur ton CV.</p>
            {editing ? (
              <div className="flex flex-wrap gap-1.5">
                {HOBBIES.map(h => {
                  const on = hobbies.includes(h)
                  return (
                    <button key={h} type="button"
                      onClick={() => setHobbies(prev => on ? prev.filter(x => x !== h) : [...prev, h])}
                      className="px-2.5 py-1 text-xs font-semibold border rounded-full transition-all"
                      style={on ? { background: KZ.green, color: 'white', borderColor: KZ.green }
                                : { background: KZ.paper, color: '#2A2018', borderColor: '#E8DDC9' }}>
                      {on && '✓ '}{h}
                    </button>
                  )
                })}
              </div>
            ) : hobbies.length === 0 ? (
              <div className="text-sm text-[#6B5A4A] py-4 text-center border border-dashed border-[#E8DDC9] rounded-lg">
                Aucun loisir — clique sur &quot;Modifier&quot;.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {hobbies.map(h => (
                  <span key={h} className="px-2.5 py-1 text-xs font-semibold border border-[#1A1410] rounded-md" style={{ background: KZ.greenSoft }}>{h}</span>
                ))}
              </div>
            )}
          </div>

          {/* Statistiques */}
          <div className="kz-card p-5 bg-white">
            <h2 className="text-lg font-bold text-[#1A1410] mb-4">Statistiques</h2>
            <div className="grid grid-cols-3 gap-3">
              {[
                { v: (profile?.xp ?? 0).toLocaleString('fr-FR'), l: 'XP total' },
                { v: profile?.streak ?? 0, l: 'Jours streak' },
                { v: applications.length, l: 'Candidatures' },
              ].map((s) => (
                <div key={s.l} className="text-center p-3 rounded-xl border border-[#E8DDC9]" style={{ background: KZ.cream2 }}>
                  <div className="text-2xl font-extrabold text-[#1A1410]">{String(s.v)}</div>
                  <div className="text-xs text-[#6B5A4A] mt-0.5">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
