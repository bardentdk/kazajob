'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Search, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { KZ, JOB_SECTORS } from '@/lib/constants'

interface Skill {
  id: string
  name: string
  category: string | null
  usage_count?: number
}

export default function AdminSkillsPage() {
  const [skills, setSkills]       = useState<Skill[]>([])
  const [filtered, setFiltered]   = useState<Skill[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [newName, setNewName]     = useState('')
  const [newCat, setNewCat]       = useState('')
  const [adding, setAdding]       = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchSkills = async () => {
    try {
      const res = await fetch('/api/admin/skills')
      const enriched = res.ok ? ((await res.json()) as Skill[]) : []
      enriched.sort((a, b) => (b.usage_count ?? 0) - (a.usage_count ?? 0))
      setSkills(enriched)
      setFiltered(enriched)
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => { fetchSkills() }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      q ? skills.filter(s => s.name.toLowerCase().includes(q) || (s.category ?? '').toLowerCase().includes(q)) : skills
    )
  }, [search, skills])

  const handleAdd = async () => {
    if (!newName.trim()) return
    setAdding(true)
    const res = await fetch('/api/admin/skills', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), category: newCat.trim() || null }),
    })
    if (res.ok) { setNewName(''); setNewCat(''); await fetchSkills() }
    setAdding(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer la compétence "${name}" ? Cela la retirera de tous les profils candidats.`)) return
    setDeletingId(id)
    await fetch(`/api/admin/skills/${id}`, { method: 'DELETE' })
    await fetchSkills()
    setDeletingId(null)
  }

  // Grouper par catégorie pour les stats
  const categoryStats = skills.reduce<Record<string, number>>((acc, s) => {
    const cat = s.category ?? 'Autre'
    acc[cat] = (acc[cat] ?? 0) + 1
    return acc
  }, {})
  const topCats = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).slice(0, 5)

  return (
    <div className="max-w-[1000px] mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1A1410]">Référentiel compétences</h1>
          <p className="text-sm text-[#6B5A4A] mt-1">{skills.length} compétences · catalogue global</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5">
        {/* Liste */}
        <div className="flex flex-col gap-4">
          {/* Ajouter */}
          <div className="kz-card p-4 bg-white">
            <h2 className="text-sm font-bold text-[#1A1410] mb-3 flex items-center gap-2">
              <Plus size={15} color={KZ.violet} /> Ajouter une compétence
            </h2>
            <div className="flex gap-2 flex-wrap">
              <Input
                label=""
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Nom de la compétence"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                className="flex-1 min-w-[160px]"
              />
              <div className="flex-1 min-w-[140px]">
                <select
                  className="w-full h-full px-3 py-2.5 rounded-xl border-2 border-[#1A1410] text-sm bg-white focus:outline-none focus:border-[#6D3BEB]"
                  value={newCat}
                  onChange={e => setNewCat(e.target.value)}
                >
                  <option value="">Catégorie (optionnel)</option>
                  {JOB_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Button kind="primary" size="md" icon={<Plus size={14} />} loading={adding} onClick={handleAdd}
                disabled={!newName.trim()}>
                Ajouter
              </Button>
            </div>
          </div>

          {/* Recherche + liste */}
          <div className="kz-card bg-white overflow-hidden">
            <div className="p-4 border-b border-[#E8DDC9]">
              <Input
                label=""
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher une compétence…"
                icon={<Search size={15} />}
              />
            </div>
            {loading ? (
              <div className="p-4 flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-lg bg-[#FBEFE0] animate-pulse" />)}
              </div>
            ) : (
              <div className="max-h-[500px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="text-center text-sm text-[#6B5A4A] py-8">Aucun résultat.</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="sticky top-0" style={{ background: KZ.cream2 }}>
                      <tr>
                        <th className="text-left p-3 font-bold text-[#1A1410]">Compétence</th>
                        <th className="text-left p-3 font-bold text-[#1A1410] hidden sm:table-cell">Catégorie</th>
                        <th className="text-center p-3 font-bold text-[#1A1410]">Utilisations</th>
                        <th className="p-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(skill => (
                        <tr key={skill.id} className="border-t border-[#E8DDC9] hover:bg-[#FBEFE0] transition-colors">
                          <td className="p-3 font-semibold text-[#1A1410]">{skill.name}</td>
                          <td className="p-3 hidden sm:table-cell">
                            {skill.category
                              ? <Badge color="cream" size="sm">{skill.category}</Badge>
                              : <span className="text-[#6B5A4A] text-xs">—</span>}
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-xs font-bold" style={{ color: (skill.usage_count ?? 0) > 0 ? KZ.green : KZ.mute }}>
                              {skill.usage_count ?? 0}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => handleDelete(skill.id, skill.name)}
                              disabled={deletingId === skill.id}
                              className="p-1.5 rounded-lg border border-[#E8DDC9] hover:border-red-400 hover:text-red-500 transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats sidebar */}
        <div className="flex flex-col gap-4">
          <div className="kz-card p-5 bg-white">
            <h3 className="text-sm font-bold text-[#1A1410] mb-4 flex items-center gap-2">
              <BookOpen size={15} /> Top catégories
            </h3>
            {topCats.length === 0 ? (
              <p className="text-xs text-[#6B5A4A]">Aucune donnée.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {topCats.map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-[#1A1410] truncate">{cat}</span>
                      <span className="text-[#6B5A4A] shrink-0 ml-2">{count}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden border border-[#1A1410]" style={{ background: KZ.cream2 }}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.round((count / (topCats[0]?.[1] ?? 1)) * 100)}%`,
                        background: KZ.violet,
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="kz-card p-5 bg-white">
            <h3 className="text-sm font-bold text-[#1A1410] mb-3">Top 5 compétences</h3>
            <div className="flex flex-col gap-2">
              {skills.slice(0, 5).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full border border-[#1A1410] text-[10px] font-extrabold flex items-center justify-center shrink-0" style={{ background: KZ.orangeSoft }}>
                    {i + 1}
                  </span>
                  <span className="flex-1 text-xs font-semibold text-[#1A1410] truncate">{s.name}</span>
                  <span className="text-xs text-[#6B5A4A]">{s.usage_count ?? 0}×</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
