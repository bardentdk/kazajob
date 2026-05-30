'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Download, Check, Plus, Trash2, ArrowRight, Palette,
  LayoutTemplate, ChevronDown, ChevronUp, Loader2, Eye
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Logo } from '@/components/layout/Logo'
import { useAuth } from '@/features/auth/useAuth'
import { createClient } from '@/lib/supabase/client'
import { PROFESSION_CATEGORIES } from '@/lib/onboarding-categories'
import { KZ } from '@/lib/constants'

// ── Types ─────────────────────────────────────────────────────

interface CvExperience {
  id: string
  company: string
  title: string
  startDate: string
  endDate: string
  current: boolean
  description: string
}

interface CvEducation {
  id: string
  school: string
  degree: string
  year: string
}

interface CvData {
  fullName: string
  title: string
  email: string
  phone: string
  location: string
  bio: string
  skills: string[]
  experiences: CvExperience[]
  education: CvEducation[]
  links: { label: string; url: string }[]
}

// ── Templates ─────────────────────────────────────────────────

const TEMPLATES = [
  { id: 'modern',   label: 'Moderne',   desc: 'Sobre et professionnel' },
  { id: 'creative', label: 'Créatif',   desc: 'Coloré et dynamique' },
  { id: 'minimal',  label: 'Minimaliste', desc: 'Épuré et élégant' },
]

const PRESET_COLORS = [
  '#FF6B35', '#6D3BEB', '#19A974', '#1B4FB8', '#FFC93C', '#1A1410',
  '#E54E1A', '#8B5CF6', '#059669', '#2563EB', '#D97706', '#374151',
]

function uid() { return Math.random().toString(36).slice(2) }

// ── CV Preview Components ─────────────────────────────────────

function CvModern({ data, color }: { data: CvData; color: string }) {
  return (
    <div className="bg-white w-full h-full font-sans text-[#1A1410]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="px-8 pt-8 pb-6" style={{ background: color }}>
        <div className="flex items-end gap-5">
          <div
            className="w-16 h-16 rounded-xl border-2 border-white flex items-center justify-center text-xl font-extrabold shrink-0 bg-white/20"
            style={{ color: 'white' }}
          >
            {data.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{data.fullName || 'Ton nom'}</h1>
            <p className="text-sm font-semibold text-white/80">{data.title || 'Titre professionnel'}</p>
            <div className="flex gap-3 mt-1.5 flex-wrap">
              {data.email && <span className="text-xs text-white/70">{data.email}</span>}
              {data.phone && <span className="text-xs text-white/70">{data.phone}</span>}
              {data.location && <span className="text-xs text-white/70">{data.location}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-0 h-[calc(100%-120px)]">
        {/* Colonne principale */}
        <div className="px-7 py-5 border-r border-[#F0F0F0]">
          {data.bio && (
            <Section title="À propos" color={color}>
              <p className="text-xs leading-relaxed text-[#4A4A4A]">{data.bio}</p>
            </Section>
          )}

          {data.experiences.length > 0 && (
            <Section title="Expériences" color={color}>
              {data.experiences.map(exp => (
                <div key={exp.id} className="mb-3 last:mb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold">{exp.title}</div>
                      <div className="text-xs font-semibold" style={{ color }}>{exp.company}</div>
                    </div>
                    <div className="text-[10px] text-[#888] shrink-0 ml-2">
                      {exp.startDate} — {exp.current ? 'Présent' : exp.endDate}
                    </div>
                  </div>
                  {exp.description && (
                    <p className="text-[11px] text-[#4A4A4A] mt-1 leading-relaxed">{exp.description}</p>
                  )}
                </div>
              ))}
            </Section>
          )}

          {data.education.length > 0 && (
            <Section title="Formation" color={color}>
              {data.education.map(edu => (
                <div key={edu.id} className="mb-2 last:mb-0">
                  <div className="text-sm font-bold">{edu.degree}</div>
                  <div className="text-xs text-[#4A4A4A]">{edu.school} · {edu.year}</div>
                </div>
              ))}
            </Section>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="px-5 py-5">
          {data.skills.length > 0 && (
            <Section title="Compétences" color={color} compact>
              <div className="flex flex-col gap-1.5">
                {data.skills.map(skill => (
                  <div key={skill} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                    <span className="text-xs text-[#1A1410]">{skill}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {data.links.filter(l => l.url).length > 0 && (
            <Section title="Liens" color={color} compact>
              {data.links.filter(l => l.url).map((l, i) => (
                <div key={i} className="text-xs text-[#4A4A4A] mb-1">{l.label || l.url}</div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function CvCreative({ data, color }: { data: CvData; color: string }) {
  return (
    <div className="bg-white w-full h-full font-sans" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="flex h-full">
        {/* Sidebar colorée */}
        <div className="w-[38%] px-6 pt-8 pb-6 flex flex-col gap-5" style={{ background: color }}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full border-2 border-white/50 bg-white/20 flex items-center justify-center text-xl font-extrabold text-white mx-auto mb-2">
              {data.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <h1 className="text-lg font-extrabold text-white leading-tight">{data.fullName || 'Ton nom'}</h1>
            <p className="text-xs text-white/80 mt-0.5">{data.title}</p>
          </div>

          <div className="border-t border-white/20 pt-4">
            <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">Contact</div>
            {[data.email, data.phone, data.location].filter(Boolean).map((v, i) => (
              <div key={i} className="text-[11px] text-white/80 mb-1">{v}</div>
            ))}
          </div>

          {data.skills.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider mb-2">Compétences</div>
              <div className="flex flex-col gap-1.5">
                {data.skills.map(s => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
                    <span className="text-[11px] text-white/85">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main */}
        <div className="flex-1 px-6 py-7">
          {data.bio && (
            <Section title="Profil" color={color} compact>
              <p className="text-[11px] leading-relaxed text-[#4A4A4A]">{data.bio}</p>
            </Section>
          )}
          {data.experiences.length > 0 && (
            <Section title="Expériences" color={color} compact>
              {data.experiences.map(exp => (
                <div key={exp.id} className="mb-3">
                  <div className="text-sm font-bold">{exp.title}</div>
                  <div className="text-xs font-semibold mb-0.5" style={{ color }}>{exp.company}</div>
                  <div className="text-[10px] text-[#888]">{exp.startDate} — {exp.current ? 'Présent' : exp.endDate}</div>
                  {exp.description && <p className="text-[11px] text-[#4A4A4A] mt-1">{exp.description}</p>}
                </div>
              ))}
            </Section>
          )}
          {data.education.length > 0 && (
            <Section title="Formation" color={color} compact>
              {data.education.map(edu => (
                <div key={edu.id} className="mb-2">
                  <div className="text-sm font-bold">{edu.degree}</div>
                  <div className="text-xs text-[#4A4A4A]">{edu.school} · {edu.year}</div>
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>
    </div>
  )
}

function CvMinimal({ data, color }: { data: CvData; color: string }) {
  return (
    <div className="bg-white w-full h-full px-10 py-8 font-sans" style={{ fontFamily: 'system-ui, sans-serif' }}>
      <div className="border-b-2 pb-4 mb-5" style={{ borderColor: color }}>
        <h1 className="text-[26px] font-extrabold tracking-tight text-[#1A1410]">{data.fullName || 'Ton nom'}</h1>
        <p className="text-sm font-medium text-[#6B5A4A] mt-0.5">{data.title}</p>
        <div className="flex gap-4 mt-2 flex-wrap">
          {[data.email, data.phone, data.location].filter(Boolean).map((v, i) => (
            <span key={i} className="text-xs text-[#888]">{v}</span>
          ))}
        </div>
      </div>
      {data.bio && <p className="text-xs text-[#4A4A4A] mb-5 leading-relaxed">{data.bio}</p>}
      {data.skills.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>Compétences</div>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map(s => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded border" style={{ borderColor: color, color }}>{s}</span>
            ))}
          </div>
        </div>
      )}
      {data.experiences.length > 0 && (
        <div className="mb-5">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color }}>Expériences</div>
          {data.experiences.map(exp => (
            <div key={exp.id} className="mb-3 flex gap-4">
              <div className="text-[10px] text-[#888] w-24 shrink-0 pt-0.5">{exp.startDate}–{exp.current ? 'Présent' : exp.endDate}</div>
              <div>
                <div className="text-sm font-bold">{exp.title}</div>
                <div className="text-xs text-[#888]">{exp.company}</div>
                {exp.description && <p className="text-[11px] text-[#4A4A4A] mt-0.5">{exp.description}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
      {data.education.length > 0 && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color }}>Formation</div>
          {data.education.map(edu => (
            <div key={edu.id} className="mb-2 flex gap-4">
              <div className="text-[10px] text-[#888] w-24 shrink-0">{edu.year}</div>
              <div>
                <div className="text-sm font-bold">{edu.degree}</div>
                <div className="text-xs text-[#888]">{edu.school}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({ title, color, children, compact }: { title: string; color: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={compact ? 'mb-4' : 'mb-5'}>
      <div className="flex items-center gap-1.5 mb-2">
        <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: color }} />
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1A1410]">{title}</span>
      </div>
      {children}
    </div>
  )
}

// ── Main CV Builder ───────────────────────────────────────────

export default function CvBuilderPage() {
  const { profile, refetch } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const printRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)

  const [template, setTemplate] = useState('modern')
  const [color, setColor] = useState<string>(KZ.violet)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>('info')

  const [cvData, setCvData] = useState<CvData>({
    fullName: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
    skills: [],
    experiences: [],
    education: [],
    links: [{ label: 'LinkedIn', url: '' }],
  })

  const [newSkill, setNewSkill] = useState('')

  // Init depuis le profil
  useEffect(() => {
    if (!profile) return

    const primaryCat = PROFESSION_CATEGORIES.find(c => c.id === (profile.avatar_category ?? profile.avatar_categories?.[0]))
    const suggestedSkills = profile.avatar_categories
      ? PROFESSION_CATEGORIES.filter(c => profile.avatar_categories?.includes(c.id)).flatMap(c => c.skills)
      : primaryCat?.skills ?? []

    setCvData(prev => ({
      ...prev,
      fullName: profile.full_name ?? '',
      email:    profile.email ?? '',
      phone:    profile.phone ?? '',
      location: profile.location ?? '',
      bio:      profile.bio ?? '',
      title:    primaryCat?.label ?? '',
      skills:   [...new Set(suggestedSkills)].slice(0, 8),
    }))

    setColor(profile.cv_color ?? primaryCat?.accentColor ?? KZ.violet)
    setTemplate(profile.cv_template ?? 'modern')
  }, [profile])

  const update = (field: keyof CvData, value: unknown) =>
    setCvData(prev => ({ ...prev, [field]: value }))

  const addExperience = () => update('experiences', [...cvData.experiences, {
    id: uid(), company: '', title: '', startDate: '', endDate: '', current: false, description: '',
  }])

  const updateExp = (id: string, field: keyof CvExperience, value: string | boolean) =>
    update('experiences', cvData.experiences.map(e => e.id === id ? { ...e, [field]: value } : e))

  const removeExp = (id: string) =>
    update('experiences', cvData.experiences.filter(e => e.id !== id))

  const addEducation = () => update('education', [...cvData.education, { id: uid(), school: '', degree: '', year: '' }])
  const updateEdu = (id: string, field: keyof CvEducation, value: string) =>
    update('education', cvData.education.map(e => e.id === id ? { ...e, [field]: value } : e))
  const removeEdu = (id: string) =>
    update('education', cvData.education.filter(e => e.id !== id))

  const addSkill = () => {
    if (newSkill.trim() && !cvData.skills.includes(newSkill.trim())) {
      update('skills', [...cvData.skills, newSkill.trim()])
      setNewSkill('')
    }
  }
  const removeSkill = (s: string) => update('skills', cvData.skills.filter(k => k !== s))

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    await supabase.from('profiles').update({
      cv_data:     cvData,
      cv_template: template,
      cv_color:    color,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    }).eq('id', profile.id)
    await refetch?.()
    setSaving(false)
    router.push('/candidate/dashboard')
  }

  const handleDownload = async () => {
    const element = printRef.current
    if (!element) return
    setDownloading(true)

    try {
      // Import dynamique pour éviter le SSR
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      // A4 : 595 × 842 px à 96dpi → scale 2 pour la qualité
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width:  element.offsetWidth,
        height: element.offsetHeight,
        // Fix : html2canvas ne supporte pas oklch/oklab (Tailwind v4).
        // On réinitialise les CSS custom properties de Tailwind qui en contiennent.
        onclone: (clonedDoc: Document) => {
          const style = clonedDoc.createElement('style')
          style.textContent = `
            *, *::before, *::after {
              --tw-ring-color: rgba(59,130,246,0.5) !important;
              --tw-ring-shadow: 0 0 #0000 !important;
              --tw-shadow: 0 0 #0000 !important;
              --tw-shadow-colored: 0 0 #0000 !important;
              --tw-inset-shadow: 0 0 #0000 !important;
              --tw-inset-shadow-colored: 0 0 #0000 !important;
              --tw-outline-style: solid !important;
            }
          `
          clonedDoc.head.appendChild(style)

          // Sécurité : remplacer inline oklch/oklab résiduels par rgb
          clonedDoc.querySelectorAll<HTMLElement>('*').forEach(el => {
            const s = el.style
            const props = ['color','backgroundColor','borderColor','borderTopColor',
              'borderRightColor','borderBottomColor','borderLeftColor','outlineColor']
            props.forEach(p => {
              const v = s.getPropertyValue(p)
              if (v && (v.includes('oklab(') || v.includes('oklch('))) {
                el.style.setProperty(p, '#1a1410')
              }
            })
          })
        },
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      })

      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH)

      const fileName = `CV-${(cvData.fullName || 'Kazajob').replace(/\s+/g, '-')}.pdf`
      pdf.save(fileName)
    } finally {
      setDownloading(false)
    }
  }

  const CvComponent = template === 'creative' ? CvCreative : template === 'minimal' ? CvMinimal : CvModern

  const SECTIONS = [
    { id: 'info',        label: 'Informations' },
    { id: 'bio',         label: 'Bio' },
    { id: 'skills',      label: 'Compétences' },
    { id: 'experiences', label: 'Expériences' },
    { id: 'education',   label: 'Formation' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-[#F0EDE8]">
      {/* Header */}
      <header className="h-14 px-4 lg:px-6 bg-white border-b border-[#1A1410] flex items-center justify-between z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <Logo size={24} href="/" />
          <div className="h-5 w-px bg-[#E8DDC9] hidden sm:block" />
          <span className="text-sm font-bold text-[#1A1410] hidden sm:block">CV Builder</span>
          <Badge color="violet" size="sm">Beta</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button kind="outline" size="sm" icon={downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} onClick={handleDownload} disabled={downloading}>
            <span className="hidden sm:inline">{downloading ? 'Génération...' : 'Télécharger PDF'}</span>
          </Button>
          <Button kind="primary" size="sm" icon={<Check size={14} />} loading={saving} onClick={handleSave}>
            <span className="hidden sm:inline">Sauvegarder</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Panneau gauche — édition ──────────────────────── */}
        <div className="w-full lg:w-[380px] shrink-0 overflow-y-auto bg-white border-r border-[#1A1410]">
          {/* Templates */}
          <div className="p-4 border-b border-[#E8DDC9]">
            <div className="flex items-center gap-2 mb-3">
              <LayoutTemplate size={15} className="text-[#6B5A4A]" />
              <span className="text-xs font-bold text-[#1A1410] uppercase tracking-wide">Template</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTemplate(t.id)}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-lg border-[1.5px] text-center transition-all"
                  style={template === t.id
                    ? { borderColor: color, background: `${color}15`, boxShadow: `2px 2px 0 ${color}` }
                    : { borderColor: '#E8DDC9', background: KZ.paper }}
                >
                  <span className="text-xs font-bold text-[#1A1410]">{t.label}</span>
                  <span className="text-[10px] text-[#6B5A4A]">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div className="p-4 border-b border-[#E8DDC9]">
            <div className="flex items-center gap-2 mb-3">
              <Palette size={15} className="text-[#6B5A4A]" />
              <span className="text-xs font-bold text-[#1A1410] uppercase tracking-wide">Couleur principale</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-lg border-2 transition-all"
                  style={{
                    background: c,
                    borderColor: color === c ? '#1A1410' : 'transparent',
                    boxShadow: color === c ? `0 0 0 2px white, 0 0 0 3px ${c}` : 'none',
                    transform: color === c ? 'scale(1.15)' : 'none',
                  }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-lg border-2 border-[#E8DDC9] cursor-pointer"
                title="Couleur personnalisée"
              />
            </div>
          </div>

          {/* Sections accordéon */}
          {SECTIONS.map(section => (
            <div key={section.id} className="border-b border-[#E8DDC9]">
              <button
                onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#FBEFE0] transition-colors"
              >
                <span className="text-sm font-bold text-[#1A1410]">{section.label}</span>
                {activeSection === section.id ? <ChevronUp size={15} className="text-[#6B5A4A]" /> : <ChevronDown size={15} className="text-[#6B5A4A]" />}
              </button>

              {activeSection === section.id && (
                <div className="px-4 pb-4 flex flex-col gap-3">

                  {section.id === 'info' && (
                    <>
                      <Input label="Nom complet" value={cvData.fullName} onChange={e => update('fullName', e.target.value)} />
                      <Input label="Titre professionnel" value={cvData.title} onChange={e => update('title', e.target.value)} placeholder="Ex: Développeur Full-Stack" />
                      <Input label="Email" value={cvData.email} onChange={e => update('email', e.target.value)} />
                      <Input label="Téléphone" value={cvData.phone} onChange={e => update('phone', e.target.value)} />
                      <Input label="Localisation" value={cvData.location} onChange={e => update('location', e.target.value)} />
                    </>
                  )}

                  {section.id === 'bio' && (
                    <Textarea label="Présentation" value={cvData.bio} onChange={e => update('bio', e.target.value)} rows={5} placeholder="Décris ton profil professionnel en 3-4 phrases..." />
                  )}

                  {section.id === 'skills' && (
                    <>
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {cvData.skills.map(s => (
                          <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold border border-[#1A1410] rounded-md" style={{ background: KZ.violetSoft }}>
                            {s}
                            <button onClick={() => removeSkill(s)} className="ml-0.5 text-[#6B5A4A] hover:text-red-600"><Trash2 size={9} /></button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Ajouter une compétence" onKeyDown={e => e.key === 'Enter' && addSkill()} className="flex-1" />
                        <Button kind="primary" size="sm" icon={<Plus size={13} />} onClick={addSkill} />
                      </div>
                    </>
                  )}

                  {section.id === 'experiences' && (
                    <>
                      {cvData.experiences.map(exp => (
                        <div key={exp.id} className="p-3 rounded-xl border border-[#E8DDC9] flex flex-col gap-2.5" style={{ background: KZ.cream2 }}>
                          <Input label="Entreprise" value={exp.company} onChange={e => updateExp(exp.id, 'company', e.target.value)} />
                          <Input label="Poste" value={exp.title} onChange={e => updateExp(exp.id, 'title', e.target.value)} />
                          <div className="grid grid-cols-2 gap-2">
                            <Input label="Début" value={exp.startDate} onChange={e => updateExp(exp.id, 'startDate', e.target.value)} placeholder="2022" />
                            <Input label="Fin" value={exp.endDate} onChange={e => updateExp(exp.id, 'endDate', e.target.value)} placeholder="2024" disabled={exp.current} />
                          </div>
                          <label className="flex items-center gap-2 text-xs font-semibold text-[#1A1410] cursor-pointer">
                            <input type="checkbox" checked={exp.current} onChange={e => updateExp(exp.id, 'current', e.target.checked)} className="rounded" />
                            Poste actuel
                          </label>
                          <Textarea label="Description" value={exp.description} onChange={e => updateExp(exp.id, 'description', e.target.value)} rows={3} />
                          <Button kind="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => removeExp(exp.id)}>Supprimer</Button>
                        </div>
                      ))}
                      <Button kind="outline" size="sm" full icon={<Plus size={13} />} onClick={addExperience}>Ajouter une expérience</Button>
                    </>
                  )}

                  {section.id === 'education' && (
                    <>
                      {cvData.education.map(edu => (
                        <div key={edu.id} className="p-3 rounded-xl border border-[#E8DDC9] flex flex-col gap-2.5" style={{ background: KZ.cream2 }}>
                          <Input label="École / Université" value={edu.school} onChange={e => updateEdu(edu.id, 'school', e.target.value)} />
                          <Input label="Diplôme" value={edu.degree} onChange={e => updateEdu(edu.id, 'degree', e.target.value)} />
                          <Input label="Année" value={edu.year} onChange={e => updateEdu(edu.id, 'year', e.target.value)} placeholder="2020" />
                          <Button kind="danger" size="sm" icon={<Trash2 size={12} />} onClick={() => removeEdu(edu.id)}>Supprimer</Button>
                        </div>
                      ))}
                      <Button kind="outline" size="sm" full icon={<Plus size={13} />} onClick={addEducation}>Ajouter une formation</Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Panneau droit — preview A4 ─────────────────────── */}
        <div className="flex-1 overflow-auto p-6 flex items-start justify-center">
          <div className="w-full max-w-[595px]">
            <div className="text-xs text-[#6B5A4A] text-center mb-3 flex items-center justify-center gap-2">
              <Eye size={13} />
              Aperçu en temps réel · Format A4
            </div>

            {/* A4 ratio: 595 × 842 px */}
            <div
              className="w-full rounded-xl border border-[#1A1410] overflow-hidden"
              style={{
                aspectRatio: '595/842',
                boxShadow: '6px 6px 0 #1A1410',
              }}
              ref={printRef}
            >
              <CvComponent data={cvData} color={color} />
            </div>

            {/* Actions bas de page */}
            <div className="flex gap-3 mt-5 justify-center">
              <Button kind="outline" size="md" icon={downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} onClick={handleDownload} loading={downloading}>
                {downloading ? 'Génération en cours...' : 'Télécharger PDF'}
              </Button>
              <Button kind="primary" size="md" loading={saving} icon={<ArrowRight size={15} />} onClick={handleSave}>
                Terminer et aller au dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
