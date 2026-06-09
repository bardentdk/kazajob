'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { useAuth } from '@/features/auth/useAuth'
import { QUIZ, ARCHETYPES, type ArchetypeKey } from '@/lib/quiz'
import { KZ } from '@/lib/constants'

export default function CandidateQuizPage() {
  const { profile, refetch } = useAuth()
  const router = useRouter()
  const [step, setStep]       = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [archetype, setArchetype] = useState<ArchetypeKey | null>(
    (profile?.quiz_result?.archetype as ArchetypeKey) ?? null
  )
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)

  const total = QUIZ.length

  const pick = async (optionIndex: number) => {
    const next = [...answers]
    next[step] = optionIndex
    setAnswers(next)

    if (step < total - 1) {
      setStep(step + 1)
      return
    }
    // Dernière question → envoi au serveur (scoring anti-triche)
    setSaving(true)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: next }),
      })
      if (res.ok) {
        const data = await res.json()
        setArchetype(data.archetype as ArchetypeKey)
        setDone(true)
        await refetch?.()
      }
    } catch { /* noop */ }
    setSaving(false)
  }

  const restart = () => { setStep(0); setAnswers([]); setDone(false); setArchetype(null) }

  // ── Écran résultat ────────────────────────────────────────────────
  if (done && archetype) {
    const a = ARCHETYPES[archetype]
    return (
      <div className="max-w-[560px] mx-auto py-6">
        <div className="kz-card p-8 bg-white text-center animate-slide-up"
          style={{ boxShadow: `6px 6px 0 ${a.color}` }}>
          <div className="text-6xl mb-3">{a.emoji}</div>
          <p className="kz-eyebrow mb-2" style={{ color: a.color }}>Ton profil</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1A1410] mb-3">{a.label}</h1>
          <p className="text-sm text-[#6B5A4A] leading-relaxed mb-6 max-w-[400px] mx-auto">{a.tagline}</p>
          <div className="p-3 rounded-xl border border-[#E8DDC9] text-xs text-[#2A2018] mb-6" style={{ background: KZ.cream2 }}>
            <strong>Visible par les recruteurs</strong> — ça leur donne un aperçu de ta façon de travailler.
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <Link href="/candidate/profile" className="flex-1">
              <Button kind="primary" size="lg" full iconRight={<ArrowRight size={15} />}>Voir mon profil</Button>
            </Link>
            <Button kind="soft" size="lg" icon={<RefreshCw size={14} />} onClick={restart}>Refaire</Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Quiz en cours ─────────────────────────────────────────────────
  const question = QUIZ[step]
  return (
    <div className="max-w-[560px] mx-auto py-6">
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <p className="kz-eyebrow flex items-center gap-1.5" style={{ color: KZ.violet }}>
            <Sparkles size={13} /> Quiz profil
          </p>
          <span className="text-xs font-semibold text-[#6B5A4A]">{step + 1} / {total}</span>
        </div>
        <Progress value={((step + 1) / total) * 100} color={KZ.violet} height={8} />
      </div>

      <div key={step} className="kz-card p-6 bg-white animate-slide-up">
        <h1 className="text-xl font-extrabold tracking-tight text-[#1A1410] mb-5 leading-snug">{question.q}</h1>
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              disabled={saving}
              onClick={() => pick(i)}
              className="text-left p-3.5 rounded-xl border-2 text-sm font-semibold text-[#1A1410] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-50"
              style={{ borderColor: KZ.line, background: KZ.cream2 }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = KZ.violet; e.currentTarget.style.boxShadow = `3px 3px 0 ${KZ.violet}` }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = KZ.line; e.currentTarget.style.boxShadow = 'none' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-[#6B5A4A] mt-4">
        Réponds spontanément — il n’y a pas de mauvaise réponse 😎
      </p>
    </div>
  )
}
