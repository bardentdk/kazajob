'use client'

import { useState, useEffect } from 'react'
import { Upload, MapPin, Phone, Mail, Edit3, Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import { Progress } from '@/components/ui/Progress'
import { useAuth } from '@/features/auth/useAuth'
import { useApplications } from '@/features/applications/useApplications'
import { createClient } from '@/lib/supabase/client'
import { KZ } from '@/lib/constants'

interface SkillRow { id: string; name: string; category: string | null }

export default function CandidateProfilePage() {
  const { profile, refetch } = useAuth()
  const { applications } = useApplications(profile?.id)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [skills, setSkills] = useState<SkillRow[]>([])
  const [allSkills, setAllSkills] = useState<SkillRow[]>([])
  const [skillSearch, setSkillSearch] = useState('')
  const [showSkillSearch, setShowSkillSearch] = useState(false)
  const supabase = createClient()

  // Initialiser les champs dès que le profil est disponible
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setBio(profile.bio ?? '')
      setLocation(profile.location ?? '')
      setPhone(profile.phone ?? '')
    }
  }, [profile])

  // Charger les compétences réelles du candidat
  useEffect(() => {
    if (!profile?.id) return
    const fetchSkills = async () => {
      const { data } = await supabase
        .from('candidate_skills')
        .select('skill:skills(id, name, category)')
        .eq('candidate_id', profile.id)
      if (data) {
        setSkills(data.map((r: { skill: unknown }) => r.skill as SkillRow).filter(Boolean))
      }
    }
    fetchSkills()
  }, [profile?.id, supabase])

  // Charger toutes les compétences disponibles pour l'autocomplete
  useEffect(() => {
    if (!showSkillSearch) return
    const fetchAll = async () => {
      const { data } = await supabase.from('skills').select('id, name, category').order('name')
      if (data) setAllSkills(data as SkillRow[])
    }
    fetchAll()
  }, [showSkillSearch, supabase])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({
      full_name: fullName,
      bio,
      location,
      phone,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)
    await refetch?.()
    setSaving(false)
    setEditing(false)
  }

  const addSkill = async (skill: SkillRow) => {
    if (!profile?.id || skills.find(s => s.id === skill.id)) return
    await supabase.from('candidate_skills').insert({ candidate_id: profile.id, skill_id: skill.id })
    setSkills(prev => [...prev, skill])
    setSkillSearch('')
  }

  const removeSkill = async (skillId: string) => {
    if (!profile?.id) return
    await supabase.from('candidate_skills').delete().eq('candidate_id', profile.id).eq('skill_id', skillId)
    setSkills(prev => prev.filter(s => s.id !== skillId))
  }

  // Score de complétion du profil
  const fields = [profile?.full_name, profile?.bio, profile?.location, profile?.phone, profile?.cv_url, profile?.avatar_url]
  const profileScore = Math.round((fields.filter(Boolean).length / fields.length) * 100)

  const filteredSkills = allSkills.filter(s =>
    s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
    !skills.find(cs => cs.id === s.id)
  )

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="kz-h2 text-[#1A1410]">Mon profil</h1>
        {!editing ? (
          <Button kind="outline" size="md" icon={<Edit3 size={16} />} onClick={() => setEditing(true)}>
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button kind="soft" size="md" onClick={() => setEditing(false)}>Annuler</Button>
            <Button kind="primary" size="md" icon={<Check size={16} />} loading={saving} onClick={handleSave}>
              Sauvegarder
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5">
        {/* Colonne gauche */}
        <div className="flex flex-col gap-4">
          {/* Avatar + score */}
          <div className="kz-card p-5 bg-white text-center">
            <div className="flex justify-center mb-4">
              <Avatar name={profile?.full_name ?? 'KZ'} src={profile?.avatar_url} size={80} color={KZ.orangeSoft} badge />
            </div>
            <div className="text-base font-bold text-[#1A1410]">{profile?.full_name}</div>
            <div className="text-xs text-[#6B5A4A] mt-0.5 mb-4">{profile?.location ?? 'La Reunion'}</div>
            <Progress value={profileScore} color={KZ.orange} label="Profil complete" />
            <Button kind="soft" size="sm" full className="mt-3" icon={<Upload size={14} />}>
              Changer la photo
            </Button>
          </div>

          {/* CV */}
          <div className="kz-card p-5 bg-white">
            <h3 className="text-sm font-bold text-[#1A1410] mb-3">Mon CV</h3>
            {profile?.cv_url ? (
              <div className="flex items-center gap-2.5 p-3 rounded-lg border border-[#E8DDC9]" style={{ background: KZ.greenSoft }}>
                <Check size={16} color={KZ.green} />
                <span className="text-sm font-semibold text-[#1A1410]">CV uploade</span>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-[#1A1410] text-center">
                <Upload size={24} className="mx-auto mb-2 text-[#6B5A4A]" />
                <p className="text-xs text-[#6B5A4A] mb-2">PDF, DOC · max 5 Mo</p>
                <Button kind="primary" size="sm">Uploader mon CV</Button>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="kz-card p-5 bg-white">
            <h3 className="text-sm font-bold text-[#1A1410] mb-3">Badges</h3>
            <div className="flex flex-wrap gap-2">
              {(profile?.streak ?? 0) > 0 && <Badge color="orange" size="md">Streak {profile!.streak}j</Badge>}
              {(profile?.xp ?? 0) >= 1000 && <Badge color="violet" size="md">Niveau {Math.floor((profile!.xp) / 1000) + 1}</Badge>}
              {profileScore >= 80 && <Badge color="green" size="md">Profil complet</Badge>}
              {applications.length >= 5 && <Badge color="yellow" size="md">{applications.length} candidatures</Badge>}
              {(profile?.streak ?? 0) === 0 && (profile?.xp ?? 0) === 0 && profileScore < 80 && applications.length < 5 && (
                <p className="text-xs text-[#6B5A4A]">Complete ton profil pour obtenir des badges.</p>
              )}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="flex flex-col gap-4">
          {/* Infos personnelles */}
          <div className="kz-card p-6 bg-white">
            <h2 className="kz-h3 text-[#1A1410] mb-5">Informations personnelles</h2>
            {editing ? (
              <div className="flex flex-col gap-4">
                <Input label="Nom complet" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                <Textarea label="Bio / Presentation" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Parle de toi en quelques lignes..." />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Localisation" value={location} onChange={(e) => setLocation(e.target.value)} icon={<MapPin size={16} />} placeholder="Saint-Denis" />
                  <Input label="Telephone" value={phone} onChange={(e) => setPhone(e.target.value)} icon={<Phone size={16} />} placeholder="+262 692 ..." />
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
                  <div className="flex items-center gap-2 text-sm text-[#1A1410]">
                    <Mail size={14} />{profile?.email}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#6B5A4A] mb-0.5">Bio</div>
                  <div className="text-sm text-[#2A2018]">{profile?.bio || <span className="text-[#6B5A4A] italic">Aucune bio — clique sur Modifier</span>}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#6B5A4A] mb-0.5">Localisation</div>
                    <div className="flex items-center gap-1.5 text-sm text-[#1A1410]">
                      <MapPin size={14} />{profile?.location || '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-[#6B5A4A] mb-0.5">Telephone</div>
                    <div className="flex items-center gap-1.5 text-sm text-[#1A1410]">
                      <Phone size={14} />{profile?.phone || '—'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compétences — données réelles */}
          <div className="kz-card p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h2 className="kz-h3 text-[#1A1410]">Competences</h2>
              <Button kind="soft" size="sm" icon={<Plus size={14} />} onClick={() => setShowSkillSearch(v => !v)}>
                Ajouter
              </Button>
            </div>

            {/* Recherche de compétences */}
            {showSkillSearch && (
              <div className="mb-4 relative">
                <Input
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  placeholder="Rechercher une competence..."
                  autoFocus
                />
                {skillSearch.length > 0 && filteredSkills.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[#1A1410] rounded-lg shadow-[3px_3px_0_#1A1410] mt-1 max-h-48 overflow-y-auto">
                    {filteredSkills.slice(0, 8).map(s => (
                      <button
                        key={s.id}
                        onClick={() => { addSkill(s); setShowSkillSearch(false) }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[#FBEFE0] transition-colors text-sm"
                      >
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
                Aucune competence ajoutee. Clique sur &quot;Ajouter&quot; pour commencer.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold border border-[#1A1410] rounded-md"
                    style={{ background: KZ.violetSoft }}
                  >
                    {s.name}
                    <button onClick={() => removeSkill(s.id)} className="text-[#6B5A4A] hover:text-red-600 transition-colors">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Statistiques réelles */}
          <div className="kz-card p-6 bg-white">
            <h2 className="kz-h3 text-[#1A1410] mb-4">Statistiques</h2>
            <div className="grid grid-cols-3 gap-4">
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
