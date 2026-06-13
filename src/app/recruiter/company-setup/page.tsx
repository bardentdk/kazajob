'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Building2, Users, Check, ArrowRight, Upload, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/features/auth/useAuth'
import { uploadFile } from '@/features/profile/useUpload'
import { KZ, SUBSCRIPTION_PLANS, JOB_SECTORS } from '@/lib/constants'
import type { Company } from '@/lib/types'

type Mode = 'search' | 'join' | 'create' | 'plan' | 'done'

const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+']

const STEPS = [
  { n: 1, label: 'Votre entreprise' },
  { n: 2, label: 'Configuration' },
  { n: 3, label: 'Forfait' },
  { n: 4, label: 'Activation' },
]

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="w-8 h-8 rounded-full border-2 border-[#1A1410] flex items-center justify-center text-xs font-extrabold transition-all"
              style={{
                background: step >= s.n ? KZ.violet : step === s.n - 1 ? KZ.cream2 : KZ.cream2,
                color: step >= s.n ? 'white' : KZ.mute,
              }}
            >
              {step > s.n ? <Check size={14} /> : s.n}
            </div>
            <span className="text-xs font-semibold hidden sm:block" style={{ color: step >= s.n ? KZ.violet : KZ.mute }}>
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="flex-1 h-0.5 rounded" style={{ background: step > s.n ? KZ.violet : KZ.line }} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function CompanySetupPage() {
  const { profile, refetch, loading: authLoading } = useAuth()
  const router = useRouter()
  const initialGuardRef = useRef(false)

  const [mode, setMode] = useState<Mode>('search')
  const [step, setStep] = useState(1)

  // Étape 1 — Recherche
  const [query, setQuery]               = useState('')
  const [results, setResults]           = useState<Company[]>([])
  const [searching, setSearching]       = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  // Étape 2a — Rejoindre
  const [joinMessage, setJoinMessage]   = useState('')
  const [joining, setJoining]           = useState(false)
  const [joinSent, setJoinSent]         = useState(false)

  // Étape 2b — Créer
  const [logoFile, setLogoFile]         = useState<File | null>(null)
  const [logoPreview, setLogoPreview]   = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '', legal_name: '', siret: '', sector: '',
    size: '1-10', website: '', description: '', location: '',
    address: '', phone: '',
  })
  const [creating, setCreating]         = useState(false)
  const [newCompany, setNewCompany]     = useState<Company | null>(null)

  // Étape 3 — Plan
  const [planId, setPlanId]             = useState('pro')
  const [planSaving, setPlanSaving]     = useState(false)
  const [planError, setPlanError]       = useState('')

  // Redirige UNIQUEMENT au chargement initial si l'utilisateur a déjà une entreprise.
  // (Ne pas rediriger pendant la création en cours, sinon on saute l'étape Forfait + paiement.)
  useEffect(() => {
    if (initialGuardRef.current || authLoading) return
    initialGuardRef.current = true
    if (profile?.company_id) router.replace('/recruiter/dashboard')
  }, [authLoading, profile, router])

  // Présélection du forfait depuis ?plan= (clic depuis la page tarifs)
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get('plan')
    if (p && SUBSCRIPTION_PLANS.some((pl) => pl.id === p)) setPlanId(p)
  }, [])

  // Live search
  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (q.length < 2) { setResults([]); return }
    setSearching(true)
    try {
      const res = await fetch(`/api/companies/search?q=${encodeURIComponent(q)}`)
      setResults(res.ok ? ((await res.json()) as Company[]) : [])
    } catch { setResults([]) }
    setSearching(false)
  }, [])

  const handleJoin = async () => {
    if (!selectedCompany || !profile?.id) return
    setJoining(true)
    const res = await fetch(`/api/companies/${selectedCompany.id}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: joinMessage }),
    })
    const { id } = await res.json().catch(() => ({}))

    // Notifier l'owner par email (fire & forget)
    if (id) {
      fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'join_request', requestId: id }),
      }).catch(() => {})
    }

    setJoinSent(true)
    setJoining(false)
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleCreate = async () => {
    if (!profile?.id || !form.name.trim()) return
    setCreating(true)
    let logoUrl: string | null = null

    // Upload logo (Vercel Blob)
    if (logoFile) {
      const { url } = await uploadFile(logoFile, 'company-logos')
      logoUrl = url
    }

    // Créer la company (+ owner member + rattachement profil) côté serveur
    const res = await fetch('/api/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, logoUrl }),
    })
    if (!res.ok) { setCreating(false); return }
    const company = (await res.json()) as Company
    await refetch?.()

    setNewCompany(company)
    setCreating(false)
    setStep(3)
    setMode('plan')
  }

  const handleSelectPlan = async () => {
    const company = newCompany
    if (!company) { setStep(4); setMode('done'); return }
    setPlanSaving(true)
    setPlanError('')

    // 1. Démarre l'essai 30 j en base (nécessaire pour reporter les jours restants sur Stripe)
    await fetch(`/api/companies/${company.id}/subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })

    // 2. Paiement obligatoire : Stripe collecte la carte maintenant, 1er débit après l'essai de 30 j.
    try {
      const co = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await co.json().catch(() => ({}))
      if (co.ok && data.url) { window.location.href = data.url as string; return }
      setPlanError(
        co.status === 503
          ? 'Le paiement est momentanément indisponible. Réessaie dans un instant.'
          : (data.error as string) || 'Impossible d\'ouvrir le paiement. Réessaie dans un instant.',
      )
    } catch {
      setPlanError('Connexion au paiement impossible. Vérifie ta connexion et réessaie.')
    }

    // Aucun accès sans carte : on reste sur l'étape forfait pour réessayer.
    setPlanSaving(false)
  }

  // ── Rendu ─────────────────────────────────────────────────────
  const currentStep = mode === 'search' ? 1 : mode === 'join' || mode === 'create' ? 2 : mode === 'plan' ? 3 : 4

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: KZ.cream }}>
      <div className="w-full max-w-[640px]">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="kz-eyebrow mb-1" style={{ color: KZ.violet }}>Configuration</p>
          <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-[#1A1410]">
            Votre espace entreprise
          </h1>
        </div>

        <ProgressBar step={currentStep} />

        <div className="kz-card p-6 bg-white">
          {/* ── ÉTAPE 1 : Recherche ──────────────────────────────────── */}
          {mode === 'search' && (
            <div>
              <h2 className="text-lg font-bold text-[#1A1410] mb-1">Votre entreprise existe-t-elle déjà ?</h2>
              <p className="text-sm text-[#6B5A4A] mb-5">Recherchez pour rejoindre une équipe existante ou créez votre espace.</p>

              <Input
                label=""
                value={query}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Nom de l'entreprise..."
                icon={<Search size={15} />}
              />

              {searching && <p className="text-xs text-[#6B5A4A] mt-2">Recherche...</p>}

              {results.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {results.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedCompany(c); setMode('join'); setStep(2) }}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:border-[#6D3BEB]"
                      style={{ borderColor: KZ.line, background: KZ.cream2 }}
                    >
                      <div className="w-10 h-10 rounded-lg border border-[#1A1410] flex items-center justify-center text-sm font-bold shrink-0"
                        style={{ background: KZ.orangeSoft }}>
                        {c.logo_url
                          ? <img src={c.logo_url} alt="" className="w-full h-full object-cover rounded-lg" />
                          : c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-[#1A1410] flex items-center gap-1.5">
                          {c.name}
                          {c.is_verified && <Check size={12} color={KZ.green} />}
                        </div>
                        <div className="text-xs text-[#6B5A4A]">{c.location} · {c.sector}</div>
                      </div>
                      <ChevronRight size={16} className="text-[#6B5A4A] shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-[#E8DDC9] flex flex-col gap-2">
                <Button
                  kind="primary" size="lg" full icon={<Building2 size={15} />}
                  onClick={() => { setMode('create'); setStep(2) }}
                >
                  Créer mon entreprise
                </Button>
                {query.length >= 2 && results.length === 0 && !searching && (
                  <p className="text-xs text-center text-[#6B5A4A]">
                    Aucun résultat pour &quot;{query}&quot; — créez votre entreprise ci-dessus.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── ÉTAPE 2a : Rejoindre ─────────────────────────────────── */}
          {mode === 'join' && selectedCompany && (
            <div>
              {joinSent ? (
                <div className="text-center py-6">
                  <div className="text-5xl mb-4">📬</div>
                  <h2 className="text-lg font-bold text-[#1A1410] mb-2">Demande envoyée !</h2>
                  <p className="text-sm text-[#6B5A4A] mb-6">
                    L&apos;administrateur de <strong>{selectedCompany.name}</strong> recevra votre demande.
                    Vous serez notifié par email lors de l&apos;approbation.
                  </p>
                  <Button kind="outline" size="md" onClick={() => router.push('/recruiter/dashboard')}>
                    Retour au tableau de bord
                  </Button>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold text-[#1A1410] mb-1">Rejoindre l&apos;équipe</h2>
                  <p className="text-sm text-[#6B5A4A] mb-5">
                    Vous demandez à rejoindre <strong>{selectedCompany.name}</strong>.
                  </p>
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E8DDC9] mb-5" style={{ background: KZ.cream2 }}>
                    <div className="w-12 h-12 rounded-lg border border-[#1A1410] flex items-center justify-center text-sm font-bold"
                      style={{ background: KZ.orangeSoft }}>
                      {selectedCompany.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1A1410]">{selectedCompany.name}</div>
                      <div className="text-xs text-[#6B5A4A]">{selectedCompany.location}</div>
                    </div>
                  </div>
                  <Textarea
                    label="Message à l'administrateur (optionnel)"
                    value={joinMessage}
                    onChange={e => setJoinMessage(e.target.value)}
                    placeholder="Je souhaite rejoindre votre espace recruteur sur Kazajob..."
                    rows={3}
                  />
                  <div className="flex gap-2.5 mt-4">
                    <Button kind="soft" size="lg" full onClick={() => { setMode('search'); setStep(1) }}>Retour</Button>
                    <Button kind="primary" size="lg" full loading={joining} onClick={handleJoin}
                      icon={<ArrowRight size={15} />}>
                      Envoyer la demande
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 2b : Créer ─────────────────────────────────────── */}
          {mode === 'create' && (
            <div>
              <h2 className="text-lg font-bold text-[#1A1410] mb-1">Créer votre entreprise</h2>
              <p className="text-sm text-[#6B5A4A] mb-5">Ces informations seront visibles par les candidats.</p>

              {/* Logo */}
              <div className="flex items-center gap-4 mb-5">
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-[#1A1410] flex items-center justify-center overflow-hidden"
                  style={{ background: KZ.cream2 }}>
                  {logoPreview
                    ? <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                    : <Upload size={20} color={KZ.mute} />}
                </div>
                <div>
                  <label className="cursor-pointer">
                    <span className="text-sm font-bold text-[#1A1410] underline">Ajouter un logo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </label>
                  <p className="text-xs text-[#6B5A4A]">PNG, JPG ou SVG · max 2 Mo</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Nom commercial *" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ma Société SAS" />
                  <Input label="Raison sociale" value={form.legal_name}
                    onChange={e => setForm(f => ({ ...f, legal_name: e.target.value }))}
                    placeholder="MA SOCIETE SAS" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="SIRET" value={form.siret}
                    onChange={e => setForm(f => ({ ...f, siret: e.target.value }))}
                    placeholder="12345678901234" maxLength={14} />
                  <Input label="Téléphone" value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+262 262 ..." />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Secteur</label>
                    <select className="w-full px-3 py-2.5 rounded-xl border-2 border-[#1A1410] text-sm bg-white focus:outline-none"
                      value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}>
                      <option value="">Choisir...</option>
                      {JOB_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Taille</label>
                    <select className="w-full px-3 py-2.5 rounded-xl border-2 border-[#1A1410] text-sm bg-white focus:outline-none"
                      value={form.size} onChange={e => setForm(f => ({ ...f, size: e.target.value }))}>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s} employés</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Ville" value={form.location}
                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Saint-Denis" />
                  <Input label="Site web" value={form.website}
                    onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://masociete.re" />
                </div>
                <Textarea label="Description de l'entreprise" value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Présentez votre entreprise aux candidats..." rows={3} />
              </div>

              <div className="flex gap-2.5 mt-5">
                <Button kind="soft" size="lg" full onClick={() => { setMode('search'); setStep(1) }}>Retour</Button>
                <Button kind="primary" size="lg" full loading={creating}
                  disabled={!form.name.trim()} onClick={handleCreate}
                  icon={<ArrowRight size={15} />}>
                  Créer et continuer
                </Button>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 3 : Plan ───────────────────────────────────────── */}
          {mode === 'plan' && (
            <div>
              <h2 className="text-lg font-bold text-[#1A1410] mb-1">Choisissez votre forfait</h2>
              <p className="text-sm text-[#6B5A4A] mb-5">30 jours d&apos;essai · Carte bancaire requise · 1er débit à la fin de l&apos;essai · Annulable avant la fin.</p>

              <div className="flex flex-col gap-3 mb-5">
                {SUBSCRIPTION_PLANS.map(plan => {
                  const euros = Math.floor(plan.priceCts / 100)
                  const isSelected = planId === plan.id
                  return (
                    <button
                      key={plan.id}
                      onClick={() => setPlanId(plan.id)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: isSelected ? KZ.violet : KZ.line,
                        background: isSelected ? KZ.violetSoft : KZ.cream2,
                      }}
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-[#1A1410] flex items-center justify-center shrink-0"
                        style={{ background: isSelected ? KZ.violet : 'white' }}>
                        {isSelected && <Check size={14} color="white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#1A1410]">{plan.name}</span>
                          {plan.highlight && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#1A1410]"
                            style={{ background: KZ.yellowSoft }}>Populaire</span>}
                        </div>
                        <div className="text-xs text-[#6B5A4A]">
                          {plan.maxMembers} recruteur{plan.maxMembers > 1 ? 's' : ''} ·
                          {plan.maxJobs === -1 ? ' offres illimitées' : ` ${plan.maxJobs} offres`} ·
                          {plan.partners.length > 0 ? ` ${plan.partners.length} plateforme(s)` : ' Kazajob uniquement'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-extrabold text-[#1A1410]">{euros}€</div>
                        <div className="text-[10px] text-[#6B5A4A]">/mois</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {planError && (
                <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{planError}</div>
              )}
              <Button kind="primary" size="lg" full loading={planSaving} onClick={handleSelectPlan}
                icon={<ArrowRight size={15} />}>
                Continuer vers le paiement sécurisé
              </Button>
              <p className="text-xs text-center text-[#6B5A4A] mt-3">
                Paiement sécurisé par Stripe. Aucun débit pendant les 30 jours d&apos;essai.
              </p>
            </div>
          )}

          {/* ── ÉTAPE 4 : Succès ─────────────────────────────────────── */}
          {mode === 'done' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full border-2 border-[#1A1410] flex items-center justify-center mx-auto mb-5"
              style={{ background: KZ.greenSoft }}>
              <Check size={36} color={KZ.green} />
            </div>
              <h2 className="text-xl font-extrabold text-[#1A1410] mb-2">Votre espace est prêt !</h2>
              <p className="text-sm text-[#6B5A4A] mb-6 leading-relaxed">
                Votre entreprise est configurée. Vous pouvez maintenant publier des offres,
                inviter vos collègues recruteurs et accéder à vos analytics.
              </p>
              <div className="flex flex-col gap-2">
                <Button kind="primary" size="lg" full icon={<ArrowRight size={15} />}
                  onClick={() => router.push('/recruiter/jobs/new')}>
                  Publier ma 1ère offre
                </Button>
                <Button kind="outline" size="md" full onClick={() => router.push('/recruiter/company/team')}>
                  Inviter mon équipe
                </Button>
                <Button kind="soft" size="md" full onClick={() => router.push('/recruiter/dashboard')}>
                  Tableau de bord
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
