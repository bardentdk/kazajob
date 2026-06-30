'use client'

/**
 * Administration > Lancement — pilotage de la campagne de lancement (accès gratuit
 * temporaire), totalement indépendante des forfaits Stripe. Activer/planifier/mettre
 * en pause/prolonger/arrêter sans redéploiement. Toute action est auditée côté serveur ;
 * les actions à impact sur les entreprises déjà enrôlées affichent un aperçu avant confirmation.
 */
import { useCallback, useEffect, useState } from 'react'
import { Rocket, Building2, Briefcase, BookOpen, AlertTriangle, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { KZ } from '@/lib/constants'
import type { BadgeColor } from '@/lib/types'

interface CampaignRow {
  id: string; name: string; slug: string; state: string
  starts_at: string | null; ends_at: string | null; end_mode: string
  free_publishing_enabled: boolean; new_subscriptions_enabled: boolean
  jobs_allowed: boolean; trainings_allowed: boolean
  max_active_jobs_per_company: number; max_active_trainings_per_company: number
  grant_duration_days: number; require_admin_approval: boolean; auto_publish: boolean
  end_of_campaign_behavior: string; recruiter_message: string | null
  version: number; updated_at: string | null
  effective_status: string
}
interface Usage { companies: number; activeJobs: number; activeTrainings: number }
interface ApiData { campaigns: CampaignRow[]; usage: Usage }

const STATUS_LABEL: Record<string, { label: string; color: BadgeColor }> = {
  draft:     { label: 'Brouillon',  color: 'cream' },
  scheduled: { label: 'Planifiée',  color: 'blue' },
  active:    { label: 'Active',     color: 'green' },
  paused:    { label: 'En pause',   color: 'yellow' },
  ended:     { label: 'Terminée',   color: 'ink' },
  cancelled: { label: 'Annulée',    color: 'orange' },
}

const QUICK_ACTIONS: Record<string, { to: string; label: string; destructive: boolean }[]> = {
  draft:     [{ to: 'scheduled', label: 'Planifier', destructive: false }, { to: 'active', label: 'Activer', destructive: false }, { to: 'cancelled', label: 'Annuler', destructive: true }],
  scheduled: [{ to: 'active', label: 'Activer maintenant', destructive: false }, { to: 'draft', label: 'Repasser en brouillon', destructive: false }, { to: 'cancelled', label: 'Annuler', destructive: true }],
  active:    [{ to: 'paused', label: 'Mettre en pause', destructive: true }, { to: 'ended', label: 'Terminer', destructive: true }, { to: 'cancelled', label: 'Annuler', destructive: true }],
  paused:    [{ to: 'active', label: 'Reprendre', destructive: false }, { to: 'ended', label: 'Terminer', destructive: true }, { to: 'cancelled', label: 'Annuler', destructive: true }],
  ended: [], cancelled: [],
}

const TOGGLES: { key: keyof CampaignRow; label: string; help: string }[] = [
  { key: 'new_subscriptions_enabled', label: 'Abonnements payants', help: 'Si désactivé, bloque le paiement Stripe pendant la campagne' },
  { key: 'jobs_allowed',              label: 'Offres d’emploi', help: 'Publication gratuite d’offres pour les entreprises enrôlées' },
  { key: 'trainings_allowed',         label: 'Formations',          help: 'Publication gratuite de formations pour les entreprises enrôlées' },
  { key: 'auto_publish',              label: 'Publication auto',    help: 'Publié sans validation manuelle' },
  { key: 'require_admin_approval',    label: 'Validation admin',    help: 'Chaque publication doit être validée' },
]

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="relative inline-flex h-6 w-11 items-center rounded-full border border-[#1A1410] transition-colors disabled:opacity-40 shrink-0"
      style={{ background: on ? KZ.green : KZ.beige }}
      aria-pressed={on}
    >
      <span className="inline-block h-4 w-4 rounded-full bg-white border border-[#1A1410] transition-transform"
        style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  )
}

const toLocalInput = (iso: string | null) => (iso ? iso.slice(0, 10) : '')

export default function AdminLaunchPage() {
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', slug: '', startsAt: '', endsAt: '' })
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)

  const load = useCallback(() => {
    fetch('/api/admin/launch-campaigns')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const fetchImpact = async (id: string): Promise<Usage | null> => {
    const r = await fetch(`/api/admin/launch-campaigns/${id}`)
    if (!r.ok) return null
    const d = await r.json().catch(() => null)
    return d?.usage ?? null
  }

  const patchConfig = async (c: CampaignRow, patch: Record<string, unknown>) => {
    setBusy(c.id)
    await fetch(`/api/admin/launch-campaigns/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patch, version: c.version }),
    })
    await load()
    setBusy(null)
  }

  const toggleKillSwitch = async (c: CampaignRow) => {
    const next = !c.free_publishing_enabled
    if (!next) {
      const u = await fetchImpact(c.id)
      const ok = window.confirm(
        `Couper l’accès gratuit MAINTENANT pour « ${c.name} » ?\n\n` +
        `Impact immédiat : ${u?.companies ?? 0} entreprise(s) enrôlée(s), ${u?.activeJobs ?? 0} offre(s) active(s), ${u?.activeTrainings ?? 0} formation(s) active(s).\n` +
        `Contrairement à une pause normale, cette coupure est IMMÉDIATE pour TOUTES les entreprises déjà enrôlées. Aucune donnée n’est supprimée.`,
      )
      if (!ok) return
    }
    await patchConfig(c, { freePublishingEnabled: next })
  }

  const doTransition = async (c: CampaignRow, to: string, destructive: boolean) => {
    if (destructive) {
      const u = await fetchImpact(c.id)
      const verb = to === 'paused' ? 'mettre en pause' : to === 'ended' ? 'terminer' : 'annuler'
      const ok = window.confirm(
        `${verb.charAt(0).toUpperCase() + verb.slice(1)} la campagne « ${c.name} » ?\n\n` +
        `Impact : ${u?.companies ?? 0} entreprise(s) enrôlée(s), ${u?.activeJobs ?? 0} offre(s) active(s), ${u?.activeTrainings ?? 0} formation(s) active(s).\n` +
        `Les entreprises déjà enrôlées conservent leur accès jusqu’à leur propre échéance individuelle (sauf coupure immédiate via l’interrupteur d’urgence). Aucune donnée n’est supprimée, aucun abonnement payant n’est touché.`,
      )
      if (!ok) return
    }
    setBusy(c.id)
    await fetch(`/api/admin/launch-campaigns/${c.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transitionTo: to, version: c.version }),
    })
    await load()
    setBusy(null)
  }

  const submitCreate = async () => {
    setCreating(true)
    setCreateError('')
    const res = await fetch('/api/admin/launch-campaigns', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: createForm.name, slug: createForm.slug,
        startsAt: createForm.startsAt ? new Date(createForm.startsAt).toISOString() : null,
        endsAt: createForm.endsAt ? new Date(createForm.endsAt).toISOString() : null,
      }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) { setCreateError(d.error ?? 'Erreur de création'); setCreating(false); return }
    setCreateForm({ name: '', slug: '', startsAt: '', endsAt: '' })
    setShowCreate(false)
    setCreating(false)
    await load()
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1410]">Campagne de lancement</h1>
          <p className="text-sm text-[#6B5A4A] mt-1">
            Accès gratuit temporaire, indépendant des forfaits Stripe. Jamais visible comme tarif public.
          </p>
        </div>
        <Button kind="primary" size="md" icon={<Plus size={15} />} onClick={() => setShowCreate((v) => !v)}>
          Nouvelle campagne
        </Button>
      </div>

      {/* Impact global — toutes campagnes confondues */}
      {data && (
        <div className="kz-card p-4 mb-6 flex flex-wrap items-center gap-4" style={{ background: KZ.violetSoft }}>
          <div className="flex items-center gap-2">
            <Rocket size={20} className="text-[#6D3BEB]" />
            <span className="font-extrabold text-[#1A1410]">Impact global</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[#1A1410]">
            <Building2 size={15} /> <b>{data.usage.companies}</b> entreprise(s) enrôlée(s)
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[#1A1410]">
            <Briefcase size={15} /> <b>{data.usage.activeJobs}</b> offre(s) active(s)
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[#1A1410]">
            <BookOpen size={15} /> <b>{data.usage.activeTrainings}</b> formation(s) active(s)
          </div>
        </div>
      )}

      {/* Création d'une campagne */}
      {showCreate && (
        <div className="kz-card p-4 mb-6 bg-white">
          <h2 className="font-bold text-[#1A1410] mb-3">Nouvelle campagne (créée en brouillon)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <Input label="Nom" value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="KazaLaunch — Rentrée 2026" />
            <Input label="Identifiant (slug)" value={createForm.slug}
              onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="rentree-2026" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <label className="text-xs text-[#6B5A4A]">
              Ouverture des inscriptions (optionnel)
              <input type="date" value={createForm.startsAt}
                onChange={(e) => setCreateForm((f) => ({ ...f, startsAt: e.target.value }))}
                className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E8DDC9] bg-white text-[#1A1410]" />
            </label>
            <label className="text-xs text-[#6B5A4A]">
              Fermeture des inscriptions (optionnel)
              <input type="date" value={createForm.endsAt}
                onChange={(e) => setCreateForm((f) => ({ ...f, endsAt: e.target.value }))}
                className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E8DDC9] bg-white text-[#1A1410]" />
            </label>
          </div>
          {createError && <p className="text-sm font-semibold mb-3" style={{ color: '#E54E4E' }}>{createError}</p>}
          <div className="flex gap-2">
            <Button kind="primary" size="md" loading={creating} disabled={!createForm.name.trim() || !createForm.slug.trim()} onClick={submitCreate}>
              Créer la campagne
            </Button>
            <Button kind="soft" size="md" onClick={() => setShowCreate(false)}>Annuler</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="kz-card p-8 text-center text-[#6B5A4A] bg-white">Chargement…</div>
      ) : !data || data.campaigns.length === 0 ? (
        <div className="kz-card p-8 text-center text-[#6B5A4A] bg-white">Aucune campagne pour le moment.</div>
      ) : (
        <div className="space-y-4">
          {data.campaigns.map((c) => {
            const status = STATUS_LABEL[c.effective_status] ?? STATUS_LABEL.draft
            const actions = QUICK_ACTIONS[c.state] ?? []
            return (
              <div key={c.id} className="kz-card p-4 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-[#1A1410]">{c.name}</span>
                    <Badge color={status.color} size="sm">{status.label}</Badge>
                    {c.starts_at && <span className="text-xs text-[#6B5A4A]">du {toLocalInput(c.starts_at)}</span>}
                    {c.ends_at && <span className="text-xs text-[#6B5A4A]">au {toLocalInput(c.ends_at)}</span>}
                    {busy === c.id && <span className="text-xs text-[#6D3BEB]">enregistrement…</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {actions.map((a) => (
                      <Button key={a.to} kind={a.destructive ? 'danger' : 'outline'} size="sm"
                        disabled={busy === c.id} onClick={() => doTransition(c, a.to, a.destructive)}>
                        {a.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Arrêt d'urgence — coupe l'accès gratuit immédiatement pour TOUTES les entreprises enrôlées */}
                <div className="flex items-center justify-between gap-3 p-2.5 rounded-lg border mb-3"
                  style={{ borderColor: c.free_publishing_enabled ? KZ.line : '#E54E4E', background: c.free_publishing_enabled ? KZ.cream2 : '#FFEAEA' }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} style={{ color: c.free_publishing_enabled ? KZ.mute : '#E54E4E' }} />
                    <div>
                      <div className="text-xs font-bold text-[#1A1410]">Arrêt d&apos;urgence</div>
                      <div className="text-[10px] text-[#6B5A4A] leading-tight">Coupe l&apos;accès gratuit immédiatement, pour toutes les entreprises déjà enrôlées</div>
                    </div>
                  </div>
                  <Toggle on={c.free_publishing_enabled} disabled={busy === c.id} onClick={() => toggleKillSwitch(c)} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-3">
                  {TOGGLES.map((t) => (
                    <div key={t.key} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[#E8DDC9]">
                      <div>
                        <div className="text-xs font-bold text-[#1A1410]">{t.label}</div>
                        <div className="text-[10px] text-[#6B5A4A] leading-tight">{t.help}</div>
                      </div>
                      <Toggle on={Boolean(c[t.key])} disabled={busy === c.id}
                        onClick={() => patchConfig(c, { [t.key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())]: !c[t.key] })} />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <label className="text-xs text-[#6B5A4A]">
                    Durée d&apos;accès par entreprise (jours)
                    <input type="number" min={1} defaultValue={c.grant_duration_days}
                      onBlur={(e) => { const v = Number(e.target.value); if (v > 0 && v !== c.grant_duration_days) patchConfig(c, { grantDurationDays: v }) }}
                      className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E8DDC9] bg-white text-[#1A1410]" />
                  </label>
                  <label className="text-xs text-[#6B5A4A]">
                    Offres actives max / entreprise
                    <input type="number" min={0} defaultValue={c.max_active_jobs_per_company}
                      onBlur={(e) => { const v = Number(e.target.value); if (v >= 0 && v !== c.max_active_jobs_per_company) patchConfig(c, { maxActiveJobsPerCompany: v }) }}
                      className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E8DDC9] bg-white text-[#1A1410]" />
                  </label>
                  <label className="text-xs text-[#6B5A4A]">
                    Formations actives max / entreprise
                    <input type="number" min={0} defaultValue={c.max_active_trainings_per_company}
                      onBlur={(e) => { const v = Number(e.target.value); if (v >= 0 && v !== c.max_active_trainings_per_company) patchConfig(c, { maxActiveTrainingsPerCompany: v }) }}
                      className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E8DDC9] bg-white text-[#1A1410]" />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <label className="text-xs text-[#6B5A4A]">
                    Inscriptions ouvertes à partir du
                    <input type="date" defaultValue={toLocalInput(c.starts_at)}
                      onChange={(e) => patchConfig(c, { startsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E8DDC9] bg-white text-[#1A1410]" />
                  </label>
                  <label className="text-xs text-[#6B5A4A]">
                    Inscriptions fermées à partir du
                    <input type="date" defaultValue={toLocalInput(c.ends_at)}
                      onChange={(e) => patchConfig(c, { endsAt: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E8DDC9] bg-white text-[#1A1410]" />
                  </label>
                </div>

                <label className="text-xs text-[#6B5A4A] block">
                  Message recruteur (affiché aux entreprises enrôlées — wording réutilisable)
                  <Textarea value={c.recruiter_message ?? ''} rows={2} label=""
                    onChange={(e) => setData((d) => d ? { ...d, campaigns: d.campaigns.map((x) => x.id === c.id ? { ...x, recruiter_message: e.target.value } : x) } : d)}
                    onBlur={(e) => patchConfig(c, { recruiterMessage: e.target.value || null })}
                    placeholder="Profitez de votre accès gratuit pour publier vos premières offres sans engagement." />
                </label>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
