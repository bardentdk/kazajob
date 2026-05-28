'use client'

import { useState } from 'react'
import { Sparkles, Copy, Check, RefreshCw, ChevronDown } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useCoverLetterAI } from '@/features/ai/useKazaIA'
import { KZ } from '@/lib/constants'

type Tone = 'professional' | 'creative' | 'concise'

const TONE_OPTIONS: { value: Tone; label: string; desc: string }[] = [
  { value: 'professional', label: 'Professionnel',  desc: 'Classique et efficace' },
  { value: 'creative',     label: 'Original',       desc: 'Accroche créative' },
  { value: 'concise',      label: 'Court',          desc: 'Max 200 mots' },
]

interface CoverLetterModalProps {
  open: boolean
  onClose: () => void
  jobId: string
  jobTitle: string
  companyName: string
  onUseLetter?: (letter: string) => void
}

export function CoverLetterModal({
  open, onClose, jobId, jobTitle, companyName, onUseLetter
}: CoverLetterModalProps) {
  const { generating, letter, error, generate, reset } = useCoverLetterAI()
  const [tone, setTone] = useState<Tone>('professional')
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => generate(jobId, tone)

  const handleCopy = async () => {
    if (!letter) return
    await navigator.clipboard.writeText(letter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Générer une lettre de motivation" size="lg">
      <div className="flex flex-col gap-5">
        {/* En-tête */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#1A1410]" style={{ background: KZ.violetSoft }}>
          <div className="w-9 h-9 rounded-xl border border-[#1A1410] flex items-center justify-center shrink-0" style={{ background: KZ.violet }}>
            <Sparkles size={17} color="white" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#1A1410]">KazaIA génère ta lettre en quelques secondes</div>
            <div className="text-xs text-[#6B5A4A]">{jobTitle} · {companyName}</div>
          </div>
          <Badge color="violet" size="sm" className="ml-auto shrink-0">IA</Badge>
        </div>

        {/* Choix du ton */}
        {!letter && (
          <div>
            <div className="text-xs font-semibold text-[#2A2018] mb-2">Ton de la lettre</div>
            <div className="grid grid-cols-3 gap-2">
              {TONE_OPTIONS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTone(t.value)}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border-[1.5px] text-center transition-all"
                  style={tone === t.value
                    ? { borderColor: KZ.violet, background: KZ.violetSoft, boxShadow: '2px 2px 0 #6D3BEB' }
                    : { borderColor: KZ.line, background: KZ.paper }
                  }
                >
                  <span className="text-sm font-bold text-[#1A1410]">{t.label}</span>
                  <span className="text-[11px] text-[#6B5A4A]">{t.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Zone de résultat */}
        {error && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error === 'GROQ_API_KEY manquant dans .env.local'
              ? 'Configure ta clé Groq dans .env.local pour activer KazaIA.'
              : error}
          </div>
        )}

        {generating && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 rounded-xl border border-[#1A1410] flex items-center justify-center" style={{ background: KZ.violet }}>
              <Sparkles size={22} color="white" className="animate-pulse" />
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-[#1A1410] mb-1">KazaIA rédige ta lettre...</div>
              <div className="text-xs text-[#6B5A4A]">Analyse du profil et de l&apos;offre en cours</div>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-[#6D3BEB] animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        {letter && !generating && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs font-semibold text-[#2A2018]">Lettre générée</div>
              <div className="flex gap-1.5">
                <Badge color="violet" size="sm">Groq · Llama 3.3</Badge>
              </div>
            </div>
            <div
              className="p-4 rounded-xl border border-[#1A1410] text-sm text-[#2A2018] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto"
              style={{ background: KZ.paper, boxShadow: '2px 2px 0 #E8DDC9' }}
            >
              {letter}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          {!letter && !generating && (
            <Button kind="violet" size="lg" full icon={<Sparkles size={16} />} onClick={handleGenerate}>
              Générer avec KazaIA
            </Button>
          )}

          {letter && !generating && (
            <>
              <Button
                kind="soft"
                size="md"
                icon={<RefreshCw size={15} />}
                onClick={() => { reset(); handleGenerate() }}
              >
                Regénérer
              </Button>
              <Button
                kind="outline"
                size="md"
                icon={copied ? <Check size={15} color={KZ.green} /> : <Copy size={15} />}
                onClick={handleCopy}
                className="flex-1"
              >
                {copied ? 'Copié !' : 'Copier'}
              </Button>
              {onUseLetter && (
                <Button
                  kind="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => { onUseLetter(letter); handleClose() }}
                >
                  Utiliser cette lettre
                </Button>
              )}
            </>
          )}
        </div>

        {!letter && !generating && (
          <p className="text-[11px] text-[#6B5A4A] text-center">
            La lettre est générée à partir de ton profil et de l&apos;offre.
            Tu peux la modifier avant d&apos;envoyer ta candidature.
          </p>
        )}
      </div>
    </Modal>
  )
}
