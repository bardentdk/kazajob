'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check, Sparkles, FileText, Gamepad2, Star, Flame } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { Logo } from '@/components/layout/Logo'
import { AvatarBuilder } from '@/components/ui/AvatarBuilder'
import { useAuth } from '@/features/auth/useAuth'
import { PROFESSION_CATEGORIES } from '@/lib/onboarding-categories'
import { KZ, SOFT_SKILLS, HOBBIES } from '@/lib/constants'
import { Soleil, Palme, Hibiscus } from '@/components/illustrations/Tropical'
import { type AvatarConfig, buildAvatarUrl, buildCharacterConfig, CHARACTER_GENDERS, CHARACTER_DOMAINS } from '@/lib/avatar'

const TOTAL_STEPS = 6  // +2 : Avatar (étape 2) + Gamification Welcome (étape 6)

export default function OnboardingPage() {
  const { profile, refetch } = useAuth()
  const router = useRouter()

  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig | null>(null)
  const [gender, setGender] = useState<string>('autre')
  const [charDomain, setCharDomain] = useState<string>('autre')
  const [softSkills, setSoftSkills] = useState<string[]>([])
  const [hobbies, setHobbies] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)

  // Génère un personnage "métier" à partir du genre + domaine choisis
  const applyCharacter = (g: string, d: string) => {
    setGender(g); setCharDomain(d)
    setAvatarConfig(buildCharacterConfig(d, g))
  }
  const toggleIn = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setLocation(profile.location ?? '')
      setPhone(profile.phone ?? '')
      setBio(profile.bio ?? '')
      if (profile.gender) setGender(profile.gender)
      if (profile.character_domain) setCharDomain(profile.character_domain)
      if (profile.soft_skills) setSoftSkills(profile.soft_skills)
      if (profile.hobbies) setHobbies(profile.hobbies)
    }
  }, [profile])

  // Pré-remplir la bio depuis la première catégorie sélectionnée
  useEffect(() => {
    if (selected.length > 0 && !bio) {
      const cat = PROFESSION_CATEGORIES.find(c => c.id === selected[0])
      if (cat) setBio(cat.bio)
    }
  }, [selected, bio])

  const toggleCategory = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const selectedCategories = PROFESSION_CATEGORIES.filter(c => selected.includes(c.id))
  const suggestedSkills = [...new Set(selectedCategories.flatMap(c => c.skills))].slice(0, 8)

  const handleSaveAvatar = async (config: AvatarConfig) => {
    if (!profile) return
    setSavingAvatar(true)
    setAvatarConfig(config)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ avatar_config: config }),
    })
    setSavingAvatar(false)
    setStep(3) // → Profil info
  }

  const handleFinish = async () => {
    if (!profile) return
    setSaving(true)

    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: fullName,
        location,
        phone,
        bio,
        avatar_category:      selected[0] ?? null,
        avatar_categories:    selected,
        avatar_config:        avatarConfig ?? null,
        gender,
        character_domain:     charDomain,
        soft_skills:          softSkills,
        hobbies,
        gamification_enabled: true,
        onboarding_completed: true,
      }),
    })

    // Ajouter les compétences suggérées (en masse, par nom)
    if (suggestedSkills.length > 0) {
      await fetch('/api/candidate-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names: suggestedSkills }),
      })
    }

    await refetch?.()
    setSaving(false)
    setStep(6) // → Gamification Welcome avant le CV builder
  }

  const canNext = step === 1 ? selected.length > 0
    : step === 3 ? fullName.trim().length > 0
    : true

  return (
    <div className="min-h-screen flex flex-col" style={{ background: KZ.cream }}>
      {/* Header */}
      <header className="h-16 px-6 border-b border-[#1A1410] bg-white flex items-center justify-between">
        <Logo size={28} href="/" />
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#6B5A4A]">Étape {step}/{TOTAL_STEPS}</span>
          <div className="w-32">
            <Progress value={(step / TOTAL_STEPS) * 100} color={KZ.violet} height={8} />
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-[760px]">

          {/* ── Étape 1 : Choix des catégories ─────────────────── */}
          {step === 1 && (
            <div className="animate-slide-up">
              <div className="text-center mb-8">
                <Badge color="violet" size="lg" className="mb-4">Étape 1 — Ton domaine</Badge>
                <h1 className="text-3xl lg:text-[42px] font-extrabold tracking-tight text-[#1A1410] mb-3">
                  Quel est ton<br />
                  <span style={{ color: KZ.orange }}>domaine de compétence</span> ?
                </h1>
                <p className="text-sm text-[#6B5A4A] max-w-[480px] mx-auto">
                  Sélectionne un ou plusieurs domaines. KazaIA va personnaliser ton profil
                  et te suggérer des offres qui correspondent vraiment.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
                {PROFESSION_CATEGORIES.map((cat) => {
                  const isSelected = selected.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-[2px] transition-all duration-150 text-center"
                      style={{
                        background: isSelected ? cat.color : KZ.paper,
                        borderColor: isSelected ? cat.accentColor : '#E8DDC9',
                        boxShadow: isSelected ? `3px 3px 0 ${cat.accentColor}` : '2px 2px 0 #E8DDC9',
                        transform: isSelected ? 'translate(-1px, -1px)' : 'none',
                      }}
                    >
                      {/* Check badge */}
                      {isSelected && (
                        <div
                          className="absolute -top-2 -right-2 w-5 h-5 rounded-full border border-white flex items-center justify-center"
                          style={{ background: cat.accentColor }}
                        >
                          <Check size={11} color="white" />
                        </div>
                      )}

                      {/* Illustration — grand emoji stylisé */}
                      <div
                        className="w-14 h-14 rounded-xl border border-[#E8DDC9] flex items-center justify-center text-3xl"
                        style={{ background: isSelected ? 'rgba(255,255,255,0.6)' : KZ.cream2 }}
                      >
                        {cat.emoji}
                      </div>

                      <span className="text-xs font-bold text-[#1A1410] leading-tight">{cat.label}</span>
                    </button>
                  )
                })}
              </div>

              {selected.length > 0 && (
                <div className="text-center text-sm text-[#6B5A4A] mb-4">
                  <span className="font-bold" style={{ color: KZ.violet }}>{selected.length}</span> domaine{selected.length > 1 ? 's' : ''} sélectionné{selected.length > 1 ? 's' : ''}
                  {selected.length > 0 && ` · ${suggestedSkills.length} compétences suggérées`}
                </div>
              )}
            </div>
          )}

          {/* ── Étape 2 : Avatar Builder ────────────────────────── */}
          {step === 2 && (
            <div className="animate-slide-up max-w-[560px] mx-auto">
              <div className="text-center mb-6">
                <Badge color="orange" size="lg" className="mb-4">Étape 2 — Ton avatar</Badge>
                <h1 className="text-3xl lg:text-[38px] font-extrabold tracking-tight text-[#1A1410] mb-2">
                  Crée ton<br />
                  <span style={{ color: KZ.orange }}>personnage</span>
                </h1>
                <p className="text-sm text-[#6B5A4A] max-w-[400px] mx-auto">
                  Personnalise ton avatar. Il représente qui tu es — sans photo, sans discrimination.
                </p>
              </div>
              {/* Genre */}
              <div className="kz-card p-4 bg-white mb-3">
                <p className="text-xs font-extrabold text-[#1A1410] uppercase tracking-widest mb-2.5">Ton genre</p>
                <div className="grid grid-cols-3 gap-2">
                  {CHARACTER_GENDERS.map(g => (
                    <button key={g.id} type="button" onClick={() => applyCharacter(g.id, charDomain)}
                      className="py-2.5 rounded-xl border-2 text-sm font-bold transition-all"
                      style={gender === g.id
                        ? { background: KZ.violet, color: 'white', borderColor: KZ.violet }
                        : { background: KZ.paper, color: '#1A1410', borderColor: '#E8DDC9' }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personnage métier */}
              <div className="kz-card p-4 bg-white mb-3">
                <p className="text-xs font-extrabold text-[#1A1410] uppercase tracking-widest mb-2.5">
                  Ton personnage métier <span className="text-[#6B5A4A] font-semibold normal-case">— génère une tenue adaptée</span>
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {CHARACTER_DOMAINS.map(d => (
                    <button key={d.id} type="button" onClick={() => applyCharacter(gender, d.id)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition-all"
                      style={charDomain === d.id
                        ? { background: KZ.orangeSoft, borderColor: KZ.orange, boxShadow: `2px 2px 0 ${KZ.orange}` }
                        : { background: KZ.paper, borderColor: '#E8DDC9' }}>
                      <span className="text-xl">{d.emoji}</span>
                      <span className="text-[10px] font-bold text-[#1A1410] leading-tight">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="kz-card p-6 bg-white">
                <AvatarBuilder
                  key={`${gender}-${charDomain}`}
                  initialConfig={avatarConfig}
                  onSave={handleSaveAvatar}
                  saving={savingAvatar}
                  compact
                />
              </div>
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="text-sm text-[#6B5A4A] font-semibold hover:text-[#1A1410] underline"
                >
                  Passer cette étape →
                </button>
              </div>
            </div>
          )}

          {/* ── Étape 3 : Infos de base ─────────────────────────── */}
          {step === 3 && (
            <div className="animate-slide-up max-w-[500px] mx-auto">
              <div className="text-center mb-8">
                <Badge color="orange" size="lg" className="mb-4">Étape 2 — Tes infos</Badge>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1410] mb-3">
                  Présente-toi en<br />
                  <span style={{ color: KZ.orange }}>30 secondes</span>
                </h1>
                <p className="text-sm text-[#6B5A4A]">Ces infos apparaîtront sur ton profil et ton CV.</p>
              </div>

              <div className="kz-card p-6 bg-white flex flex-col gap-4">
                <Input
                  label="Nom complet *"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Marie Hoarau"
                  required
                />
                <Input
                  label="Ville *"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Saint-Denis, Saint-Pierre..."
                />
                <Input
                  label="Téléphone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+262 692 ..."
                />
                <Textarea
                  label="Bio professionnelle"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  hint="KazaIA a pré-rempli une suggestion basée sur ton domaine. Personnalise-la !"
                />
              </div>
            </div>
          )}

          {/* ── Étape 4 : Compétences suggérées ─────────────────── */}
          {step === 4 && (
            <div className="animate-slide-up max-w-[540px] mx-auto">
              <div className="text-center mb-8">
                <Badge color="green" size="lg" className="mb-4">Étape 3 — Tes compétences</Badge>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1410] mb-3">
                  <span style={{ color: KZ.orange }}>KazaIA</span> a sélectionné<br />
                  tes compétences
                </h1>
                <p className="text-sm text-[#6B5A4A]">
                  Ces compétences seront ajoutées à ton profil. Tu pourras les modifier plus tard.
                </p>
              </div>

              <div className="kz-card p-6 bg-white">
                <div className="flex items-center gap-2 mb-5 p-3 rounded-xl" style={{ background: KZ.violetSoft }}>
                  <Sparkles size={16} color={KZ.violet} />
                  <span className="text-sm font-semibold text-[#1A1410]">
                    {suggestedSkills.length} compétences détectées depuis tes {selected.length} domaine{selected.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-5">
                  {suggestedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold border border-[#1A1410] rounded-lg"
                      style={{ background: KZ.violetSoft }}
                    >
                      <Check size={12} color={KZ.violet} />
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-[#6B5A4A]">
                  Tu pourras ajouter ou supprimer des compétences depuis ton profil à tout moment.
                </p>
              </div>

              {/* Soft skills */}
              <div className="kz-card p-5 bg-white mt-4">
                <p className="text-sm font-bold text-[#1A1410] mb-1">Tes soft skills <span className="text-[#6B5A4A] font-normal text-xs">(savoir-être)</span></p>
                <p className="text-xs text-[#6B5A4A] mb-3">Ajoutés à ton profil et ton CV.</p>
                <div className="flex flex-wrap gap-1.5">
                  {SOFT_SKILLS.map(s => {
                    const on = softSkills.includes(s)
                    return (
                      <button key={s} type="button" onClick={() => setSoftSkills(prev => toggleIn(prev, s))}
                        className="px-2.5 py-1 text-xs font-semibold border rounded-full transition-all"
                        style={on ? { background: KZ.violet, color: 'white', borderColor: KZ.violet }
                                  : { background: KZ.paper, color: '#2A2018', borderColor: '#E8DDC9' }}>
                        {on && '✓ '}{s}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Loisirs */}
              <div className="kz-card p-5 bg-white mt-4">
                <p className="text-sm font-bold text-[#1A1410] mb-1">Tes loisirs <span className="text-[#6B5A4A] font-normal text-xs">(centres d&apos;intérêt)</span></p>
                <p className="text-xs text-[#6B5A4A] mb-3">Ajoutés à ton profil et ton CV.</p>
                <div className="flex flex-wrap gap-1.5">
                  {HOBBIES.map(h => {
                    const on = hobbies.includes(h)
                    return (
                      <button key={h} type="button" onClick={() => setHobbies(prev => toggleIn(prev, h))}
                        className="px-2.5 py-1 text-xs font-semibold border rounded-full transition-all"
                        style={on ? { background: KZ.green, color: 'white', borderColor: KZ.green }
                                  : { background: KZ.paper, color: '#2A2018', borderColor: '#E8DDC9' }}>
                        {on && '✓ '}{h}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Récap domaines */}
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {selectedCategories.map(cat => (
                  <span
                    key={cat.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border border-[#1A1410] rounded-full"
                    style={{ background: cat.color }}
                  >
                    {cat.emoji} {cat.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Étape 5 : Bio + Finish ───────────────────────────── */}
          {step === 5 && (
            <div className="animate-slide-up max-w-[500px] mx-auto text-center">
              <div className="mb-8">
                <Badge color="violet" size="lg" className="mb-4">Étape 4 — Ton CV</Badge>
                <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1410] mb-3">
                  Génère ton CV<br />
                  <span style={{ color: KZ.orange }}>en quelques secondes</span>
                </h1>
                <p className="text-sm text-[#6B5A4A] max-w-[380px] mx-auto">
                  À partir de tes informations, nous allons créer un CV professionnel personnalisable
                  avec les couleurs et le style qui te ressemblent.
                </p>
              </div>

              {/* Preview aperçu mini CV */}
              <div
                className="kz-card p-6 bg-white mb-6 relative overflow-hidden"
                style={{ transform: 'rotate(-1deg)' }}
              >
                <div className="absolute top-0 left-0 right-0 h-16" style={{ background: selectedCategories[0]?.accentColor ?? KZ.violet }} />
                <div className="relative z-10 pt-8">
                  <div className="w-14 h-14 rounded-full border-2 border-white mx-auto mb-2 flex items-center justify-center text-xl font-extrabold" style={{ background: selectedCategories[0]?.color ?? KZ.violetSoft }}>
                    {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="text-base font-extrabold text-[#1A1410]">{fullName || 'Ton nom'}</div>
                  <div className="text-xs text-[#6B5A4A] mb-3">{selectedCategories[0]?.label} · {location || 'La Réunion'}</div>
                  <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                    {suggestedSkills.slice(0, 4).map(s => (
                      <span key={s} className="text-[10px] px-2 py-0.5 rounded border border-[#E8DDC9] text-[#6B5A4A]">{s}</span>
                    ))}
                  </div>
                  <div className="text-xs text-[#6B5A4A] line-clamp-2 max-w-[280px] mx-auto">{bio || 'Ta bio professionnelle apparaîtra ici'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl border border-[#1A1410] text-left" style={{ background: KZ.greenSoft }}>
                <FileText size={18} color={KZ.green} />
                <div>
                  <div className="text-sm font-bold text-[#1A1410]">CV Builder visuel</div>
                  <div className="text-xs text-[#6B5A4A]">Choisis tes couleurs, ton template, ajoute tes expériences</div>
                </div>
              </div>
            </div>
          )}

          {/* ── Étape 6 : Gamification Welcome ──────────────────── */}
          {step === 6 && (
            <div className="animate-slide-up max-w-[520px] mx-auto text-center">
              <div className="text-6xl mb-4">🎮</div>
              <Badge color="violet" size="lg" className="mb-4">Mode Quête activé !</Badge>
              <h1 className="text-3xl lg:text-[38px] font-extrabold tracking-tight text-[#1A1410] mb-3">
                L&apos;aventure<br />
                <span style={{ color: KZ.violet }}>commence !</span>
              </h1>
              <p className="text-sm text-[#6B5A4A] mb-6">
                Tu démarres à <strong>Niveau 1 · Débutant</strong>. Accomplis des quêtes pour gagner des XP et progresser.
              </p>

              {/* Level card */}
              <div className="rounded-2xl border-2 border-[#1A1410] p-5 mb-5 text-left"
                style={{ background: '#1A1410', boxShadow: '5px 5px 0 #6B5A4A' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">🌱</span>
                    <div>
                      <div className="text-xs opacity-50 font-bold uppercase tracking-widest" style={{ color: KZ.cream }}>NIVEAU ACTUEL</div>
                      <div className="text-base font-extrabold" style={{ color: '#6B5A4A' }}>Débutant</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-extrabold" style={{ color: KZ.cream }}>0 <span className="text-sm opacity-50">XP</span></div>
                    <div className="text-[10px] opacity-40" style={{ color: KZ.cream }}>→ 1 000 XP pour Niveau 2</div>
                  </div>
                </div>
                <div className="h-3 rounded-full border border-white/20 overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
                  <div className="h-full w-0 rounded-full" style={{ background: '#6B5A4A' }} />
                </div>
              </div>

              {/* Premières quêtes */}
              <div className="kz-card p-4 bg-white text-left mb-6">
                <p className="text-xs font-extrabold text-[#1A1410] uppercase tracking-widest mb-3">
                  Tes premières quêtes
                </p>
                {[
                  { icon: '📄', label: 'Crée ton CV', xp: '+50 XP' },
                  { icon: '🎯', label: 'Postule à ta 1ère offre', xp: '+30 XP' },
                  { icon: '💼', label: 'Ajoute 3 compétences', xp: '+40 XP' },
                ].map(q => (
                  <div key={q.label} className="flex items-center gap-3 py-2 border-b border-[#E8DDC9] last:border-0">
                    <span className="text-lg">{q.icon}</span>
                    <span className="flex-1 text-sm font-semibold text-[#1A1410]">{q.label}</span>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full border border-[#1A1410]"
                      style={{ background: KZ.violetSoft, color: KZ.violet }}>{q.xp}</span>
                  </div>
                ))}
              </div>

              <Button
                kind="primary" size="lg" full
                icon={<Gamepad2 size={16} />}
                onClick={() => router.push('/onboarding/cv-builder')}
              >
                Commencer l&apos;aventure →
              </Button>
            </div>
          )}

          {/* Navigation (masquée aux étapes 2, 6) */}
          {step !== 2 && step !== 6 && (
          <div className="flex gap-3 mt-8 max-w-[500px] mx-auto">
            {step > 1 && (
              <Button kind="soft" size="lg" icon={<ArrowLeft size={16} />} onClick={() => setStep(s => s - 1)}>
                Retour
              </Button>
            )}
            {step < 5 ? (
              <Button
                kind="primary"
                size="lg"
                full
                iconRight={<ArrowRight size={16} />}
                disabled={!canNext}
                onClick={() => setStep(s => s + 1)}
              >
                {step === 1 ? `Continuer avec ${selected.length} domaine${selected.length > 1 ? 's' : ''}` : 'Continuer'}
              </Button>
            ) : (
              <Button
                kind="primary"
                size="lg"
                full
                icon={<Sparkles size={16} />}
                loading={saving}
                onClick={handleFinish}
              >
                Finaliser mon profil
              </Button>
            )}
          </div>
          )}

          {step === 1 && (
            <div className="text-center mt-4">
              <button
                onClick={() => {
                  router.push(profile?.role === 'recruiter' ? '/recruiter/dashboard' : '/candidate/dashboard')
                }}
                className="text-xs text-[#6B5A4A] hover:text-[#1A1410] underline"
              >
                Passer cette étape pour l&apos;instant
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Décor tropical */}
      <div className="fixed bottom-0 left-0 pointer-events-none opacity-20 hidden lg:block">
        <Palme size={200} />
      </div>
      <div className="fixed top-24 right-0 pointer-events-none opacity-15 hidden lg:block">
        <Hibiscus size={120} />
      </div>
    </div>
  )
}
