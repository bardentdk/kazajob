'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, Check, Sparkles, FileText } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Progress } from '@/components/ui/Progress'
import { Badge } from '@/components/ui/Badge'
import { Logo } from '@/components/layout/Logo'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import { PROFESSION_CATEGORIES } from '@/lib/onboarding-categories'
import { KZ } from '@/lib/constants'
import { Soleil, Palme, Hibiscus } from '@/components/illustrations/Tropical'

const TOTAL_STEPS = 4

export default function OnboardingPage() {
  const { profile, refetch } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [fullName, setFullName] = useState('')
  const [location, setLocation] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setLocation(profile.location ?? '')
      setPhone(profile.phone ?? '')
      setBio(profile.bio ?? '')
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

  const handleFinish = async () => {
    if (!profile) return
    setSaving(true)

    const primaryCat = PROFESSION_CATEGORIES.find(c => c.id === selected[0])

    await supabase.from('profiles').update({
      full_name: fullName,
      location,
      phone,
      bio,
      avatar_category:   selected[0] ?? null,
      avatar_categories: selected,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)

    // Ajouter les compétences suggérées
    if (suggestedSkills.length > 0) {
      const { data: skillRows } = await supabase
        .from('skills')
        .select('id, name')
        .in('name', suggestedSkills)

      if (skillRows && skillRows.length > 0) {
        await supabase.from('candidate_skills').upsert(
          skillRows.map((s: { id: string }) => ({
            candidate_id: profile.id,
            skill_id: s.id,
          })),
          { onConflict: 'candidate_id,skill_id' }
        )
      }
    }

    await refetch?.()
    setSaving(false)
    router.push('/onboarding/cv-builder')
  }

  const canNext = step === 1 ? selected.length > 0
    : step === 2 ? fullName.trim().length > 0
    : step === 3 ? true
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

          {/* ── Étape 2 : Infos de base ─────────────────────────── */}
          {step === 2 && (
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

          {/* ── Étape 3 : Compétences suggérées ─────────────────── */}
          {step === 3 && (
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

          {/* ── Étape 4 : Génération CV ──────────────────────────── */}
          {step === 4 && (
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

          {/* Navigation */}
          <div className="flex gap-3 mt-8 max-w-[500px] mx-auto">
            {step > 1 && (
              <Button kind="soft" size="lg" icon={<ArrowLeft size={16} />} onClick={() => setStep(s => s - 1)}>
                Retour
              </Button>
            )}
            {step < TOTAL_STEPS ? (
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
                Créer mon CV personnalisé
              </Button>
            )}
          </div>

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
