'use client'

import { useState } from 'react'
import { Briefcase, Globe, FileText, Plus, Trash2, Check, FolderGit2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { uploadFile } from '@/features/profile/useUpload'
import { KZ } from '@/lib/constants'

interface Realisation { title: string; description?: string; url?: string }

interface ProfileLike {
  linkedin_url?: string | null
  github_url?: string | null
  portfolio_url?: string | null
  portfolio_pdf_url?: string | null
  realisations?: Realisation[] | null
}

/** KazaPortfolio — liens pro, PDF et réalisations du candidat. Sauvegarde via /api/profile. */
export function KazaPortfolioSection({ profile, onSaved }: { profile: Record<string, unknown> | null; onSaved?: () => void | Promise<void> }) {
  const p = (profile ?? {}) as ProfileLike
  const [linkedin, setLinkedin] = useState(p.linkedin_url ?? '')
  const [github, setGithub] = useState(p.github_url ?? '')
  const [portfolio, setPortfolio] = useState(p.portfolio_url ?? '')
  const [pdfUrl, setPdfUrl] = useState<string | null>(p.portfolio_pdf_url ?? null)
  const [realisations, setRealisations] = useState<Realisation[]>(p.realisations ?? [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const addReal = () => setRealisations((r) => [...r, { title: '' }])
  const updateReal = (i: number, patch: Partial<Realisation>) =>
    setRealisations((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)))
  const removeReal = (i: number) => setRealisations((r) => r.filter((_, j) => j !== i))

  const handlePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { url } = await uploadFile(file, 'cvs')
    if (url) setPdfUrl(url)
    setUploading(false)
  }

  const save = async () => {
    setSaving(true); setSaved(false)
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkedin_url: linkedin || null,
        github_url: github || null,
        portfolio_url: portfolio || null,
        portfolio_pdf_url: pdfUrl,
        realisations: realisations.filter((r) => r.title.trim()),
      }),
    })
    await onSaved?.()
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="kz-card p-5 bg-white">
      <div className="flex items-center gap-2 mb-1">
        <FolderGit2 size={16} color={KZ.violet} />
        <h3 className="text-sm font-bold text-[#1A1410]">KazaPortfolio</h3>
      </div>
      <p className="text-xs text-[#6B5A4A] mb-4">Mets en avant tes liens, ton portfolio et tes réalisations auprès des recruteurs.</p>

      <div className="flex flex-col gap-3">
        <Input label="LinkedIn" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." icon={<Briefcase size={15} />} />
        <Input label="GitHub" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="https://github.com/..." icon={<FolderGit2 size={15} />} />
        <Input label="Site / Portfolio" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://mon-portfolio.re" icon={<Globe size={15} />} />

        {/* PDF portfolio */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Portfolio PDF (optionnel)</label>
          {pdfUrl ? (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#1A1410]" style={{ background: KZ.greenSoft }}>
              <FileText size={14} />
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#1A1410] flex-1 truncate hover:underline">Voir le PDF</a>
              <button type="button" onClick={() => setPdfUrl(null)} className="text-[#6B5A4A] hover:text-red-600"><Trash2 size={14} /></button>
            </div>
          ) : (
            <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 border-dashed border-[#1A1410] cursor-pointer hover:bg-[#FBEFE0]">
              <FileText size={14} />
              <span className="text-xs font-semibold text-[#1A1410]">{uploading ? 'Envoi…' : 'Ajouter un PDF (max 10 Mo)'}</span>
              <input type="file" accept=".pdf" className="hidden" onChange={handlePdf} disabled={uploading} />
            </label>
          )}
        </div>

        {/* Réalisations */}
        <div>
          <label className="block text-sm font-semibold text-[#1A1410] mb-1.5">Réalisations</label>
          <div className="flex flex-col gap-2">
            {realisations.map((r, i) => (
              <div key={i} className="rounded-xl border border-[#E8DDC9] p-2.5 flex flex-col gap-2" style={{ background: KZ.cream2 }}>
                <div className="flex gap-2">
                  <Input className="flex-1" value={r.title} placeholder="Titre (ex : Refonte site X)" onChange={(e) => updateReal(i, { title: e.target.value })} />
                  <button type="button" onClick={() => removeReal(i)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#6B5A4A] hover:text-red-600 shrink-0 self-center"><Trash2 size={15} /></button>
                </div>
                <Input value={r.url ?? ''} placeholder="Lien (optionnel)" onChange={(e) => updateReal(i, { url: e.target.value })} icon={<Globe size={14} />} />
                <Textarea value={r.description ?? ''} rows={2} placeholder="Description courte (optionnel)" onChange={(e) => updateReal(i, { description: e.target.value })} />
              </div>
            ))}
          </div>
          <Button type="button" kind="outline" size="sm" icon={<Plus size={14} />} className="mt-2" onClick={addReal}>Ajouter une réalisation</Button>
        </div>

        <Button kind="primary" size="md" full loading={saving} icon={saved ? <Check size={15} /> : undefined} onClick={save}>
          {saved ? 'Enregistré !' : 'Enregistrer mon portfolio'}
        </Button>
      </div>
    </div>
  )
}
