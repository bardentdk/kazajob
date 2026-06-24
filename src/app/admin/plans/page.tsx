'use client'

/**
 * Administration > Monétisation > Forfaits.
 * Pilotage de la disponibilité des forfaits (et de l'offre gratuite KazaLaunch)
 * sans toucher au code ni redéployer. Toute modification est auditée côté serveur.
 */
import { useEffect, useState } from 'react'
import { Rocket, Building2, Briefcase, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { KZ, LAUNCH_PLAN_ID } from '@/lib/constants'

interface PlanRow {
  id: string; name: string; price_cts: number; max_jobs: number; max_members: number
  is_free: boolean; is_active: boolean; is_public: boolean; is_selectable: boolean
  is_featured: boolean; duration_months: number; sort_order: number
  starts_at: string | null; ends_at: string | null; updated_at: string | null
}
interface ApiData { plans: PlanRow[]; launchUsage: { companies: number; activeJobs: number } }

const TOGGLES: { key: keyof PlanRow; label: string; help: string }[] = [
  { key: 'is_active',     label: 'Activé',         help: 'Utilisable par le moteur de droits' },
  { key: 'is_public',     label: 'Public',         help: 'Visible sur les pages publiques' },
  { key: 'is_selectable', label: 'Souscriptible',  help: 'Sélectionnable par un nouveau recruteur' },
  { key: 'is_featured',   label: 'Mis en avant',   help: 'Mise en avant visuelle' },
]

function Toggle({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button" onClick={onClick} disabled={disabled}
      className="relative inline-flex h-6 w-11 items-center rounded-full border border-[#1A1410] transition-colors disabled:opacity-40"
      style={{ background: on ? KZ.green : KZ.beige }}
      aria-pressed={on}
    >
      <span className="inline-block h-4 w-4 rounded-full bg-white border border-[#1A1410] transition-transform"
        style={{ transform: on ? 'translateX(22px)' : 'translateX(2px)' }} />
    </button>
  )
}

export default function AdminPlansPage() {
  const [data, setData] = useState<ApiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/plans')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const patch = async (planId: string, p: Partial<PlanRow>, optimistic: Partial<PlanRow>) => {
    if (!data) return
    setData({ ...data, plans: data.plans.map((pl) => (pl.id === planId ? { ...pl, ...optimistic } : pl)) })
    setSaving(planId)
    try {
      await fetch('/api/admin/plans', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, patch: p }),
      })
    } finally { setSaving(null) }
  }

  const toggle = (plan: PlanRow, key: keyof PlanRow) => {
    const next = !plan[key]
    // Garde-fou : désactivation de KazaLaunch → prévisualisation d'impact + confirmation.
    if (plan.id === LAUNCH_PLAN_ID && !next && (key === 'is_active' || key === 'is_selectable' || key === 'is_public')) {
      const u = data?.launchUsage
      const ok = window.confirm(
        `Désactiver « ${TOGGLES.find((t) => t.key === key)?.label} » sur KazaLaunch ?\n\n` +
        `Impact : ${u?.companies ?? 0} entreprise(s) rattachée(s), ${u?.activeJobs ?? 0} offre(s) active(s).\n` +
        `Les comptes existants CONSERVENT leur offre et leur échéance ; seuls les nouveaux parcours sont affectés. Aucune donnée n'est supprimée.`,
      )
      if (!ok) return
    }
    const map: Record<string, string> = {
      is_active: 'isActive', is_public: 'isPublic', is_selectable: 'isSelectable', is_featured: 'isFeatured',
    }
    patch(plan.id, { [map[key as string]]: next } as Partial<PlanRow>, { [key]: next } as Partial<PlanRow>)
  }

  const setDate = (plan: PlanRow, field: 'starts_at' | 'ends_at', value: string) => {
    const iso = value ? new Date(value).toISOString() : null
    const apiKey = field === 'starts_at' ? 'startsAt' : 'endsAt'
    patch(plan.id, { [apiKey]: iso } as Partial<PlanRow>, { [field]: iso } as Partial<PlanRow>)
  }

  const launch = data?.plans.find((p) => p.id === LAUNCH_PLAN_ID)

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-[#1A1410]">Monétisation · Forfaits</h1>
        <p className="text-sm text-[#6B5A4A] mt-1">Activez, masquez ou planifiez la disponibilité des forfaits. Les modifications sont auditées.</p>
      </div>

      {/* Bandeau KazaLaunch — impact en direct */}
      {launch && (
        <div className="kz-card p-4 mb-6 flex flex-wrap items-center gap-4" style={{ background: KZ.violetSoft }}>
          <div className="flex items-center gap-2">
            <Rocket size={20} className="text-[#6D3BEB]" />
            <span className="font-extrabold text-[#1A1410]">KazaLaunch</span>
            <Badge color={launch.is_active && launch.is_selectable ? 'green' : 'orange'} size="sm">
              {launch.is_active && launch.is_selectable ? 'En ligne' : 'Restreint'}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[#1A1410]">
            <Building2 size={15} /> <b>{data?.launchUsage.companies ?? 0}</b> entreprise(s)
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[#1A1410]">
            <Briefcase size={15} /> <b>{data?.launchUsage.activeJobs ?? 0}</b> offre(s) active(s)
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B5A4A]">
            <AlertTriangle size={14} /> Désactiver n'affecte que les nouveaux parcours, jamais les comptes existants.
          </div>
        </div>
      )}

      {loading ? (
        <div className="kz-card p-8 text-center text-[#6B5A4A] bg-white">Chargement…</div>
      ) : !data ? (
        <div className="kz-card p-8 text-center text-[#6B5A4A] bg-white">Accès refusé ou erreur de chargement.</div>
      ) : (
        <div className="space-y-3">
          {data.plans.map((plan) => (
            <div key={plan.id} className="kz-card p-4 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#1A1410]">{plan.name}</span>
                  {plan.is_free
                    ? <Badge color="violet" size="sm">Gratuit · {plan.duration_months} mois</Badge>
                    : <Badge color="cream" size="sm">{Math.round(plan.price_cts / 100)} €/mois</Badge>}
                  <span className="text-xs text-[#6B5A4A]">
                    {plan.max_jobs === -1 ? 'offres ∞' : `${plan.max_jobs} offres`} · {plan.max_members === -1 ? 'sièges ∞' : `${plan.max_members} siège(s)`}
                  </span>
                  {saving === plan.id && <span className="text-xs text-[#6D3BEB]">enregistrement…</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {TOGGLES.map((t) => (
                  <div key={t.key} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[#E8DDC9]">
                    <div>
                      <div className="text-xs font-bold text-[#1A1410]">{t.label}</div>
                      <div className="text-[10px] text-[#6B5A4A] leading-tight">{t.help}</div>
                    </div>
                    <Toggle on={Boolean(plan[t.key])} onClick={() => toggle(plan, t.key)} />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-xs text-[#6B5A4A]">
                  Disponible à partir du
                  <input type="date" defaultValue={plan.starts_at ? plan.starts_at.slice(0, 10) : ''}
                    onChange={(e) => setDate(plan, 'starts_at', e.target.value)}
                    className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E8DDC9] bg-white text-[#1A1410]" />
                </label>
                <label className="text-xs text-[#6B5A4A]">
                  Disponible jusqu'au
                  <input type="date" defaultValue={plan.ends_at ? plan.ends_at.slice(0, 10) : ''}
                    onChange={(e) => setDate(plan, 'ends_at', e.target.value)}
                    className="mt-1 w-full px-2 py-1.5 rounded-lg border border-[#E8DDC9] bg-white text-[#1A1410]" />
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
