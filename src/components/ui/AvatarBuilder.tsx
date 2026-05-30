'use client'

import { useState, useEffect } from 'react'
import { Shuffle, Check } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { KZ } from '@/lib/constants'
import {
  generateAvatarSvg, randomAvatarConfig, DEFAULT_AVATAR_CONFIG,
  SKIN_COLORS, HAIR_STYLES, HAIR_COLORS, EYES_STYLES,
  MOUTH_STYLES, CLOTHES_STYLES, CLOTHES_COLORS, ACCESSORIES,
  type AvatarConfig,
} from '@/lib/avatar'

// ── Hook : génère SVG localement via npm (0 appel HTTP) ──────────
function useLocalSvg(config: AvatarConfig) {
  const [svg, setSvg] = useState<string | null>(null)

  useEffect(() => {
    // Génération synchrone — pas besoin de loading async
    try {
      const s = generateAvatarSvg(config)
      setSvg(s)
    } catch {
      setSvg(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(config)])

  return svg
}

interface AvatarBuilderProps {
  initialConfig?: AvatarConfig | null
  onSave: (config: AvatarConfig) => void | Promise<void>
  saving?: boolean
  compact?: boolean   // version sans titre (dans l'onboarding)
}

function ColorSwatch({ hex, selected, onClick }: { hex: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110 active:scale-95"
      style={{
        background: '#' + hex,
        borderColor: selected ? '#1A1410' : 'transparent',
        boxShadow: selected ? '0 0 0 2px white, 0 0 0 4px #1A1410' : 'none',
      }}
      title={hex}
    />
  )
}

function OptionChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-3 py-1.5 rounded-full border-2 text-xs font-bold transition-all whitespace-nowrap hover:scale-105 active:scale-95"
      style={{
        borderColor: selected ? '#1A1410' : '#E8DDC9',
        background: selected ? '#1A1410' : KZ.cream2,
        color: selected ? KZ.cream : '#2A2018',
        boxShadow: selected ? '2px 2px 0 ' + KZ.orange : 'none',
      }}
    >
      {selected && <span className="mr-1">✓</span>}
      {label}
    </button>
  )
}

export function AvatarBuilder({ initialConfig, onSave, saving, compact }: AvatarBuilderProps) {
  const [config, setConfig] = useState<AvatarConfig>(
    (initialConfig as AvatarConfig) ?? DEFAULT_AVATAR_CONFIG
  )

  const set = (key: keyof AvatarConfig, val: string) =>
    setConfig(prev => ({ ...prev, [key]: val }))

  const handleRandomize = () => setConfig(randomAvatarConfig())

  // SVG généré localement — aucun appel HTTP
  const previewSvg = useLocalSvg(config)

  const SECTIONS: { label: string; key: keyof AvatarConfig; type: 'color' | 'chip'; options: { id: string; label: string }[] }[] = [
    { label: 'Couleur de peau',   key: 'skinColor',    type: 'color', options: SKIN_COLORS    },
    { label: 'Coiffure',          key: 'top',          type: 'chip',  options: HAIR_STYLES    },
    { label: 'Couleur des cheveux',key: 'hairColor',   type: 'color', options: HAIR_COLORS    },
    { label: 'Yeux',              key: 'eyes',         type: 'chip',  options: EYES_STYLES    },
    { label: 'Bouche',            key: 'mouth',        type: 'chip',  options: MOUTH_STYLES   },
    { label: 'Tenue',             key: 'clothes',      type: 'chip',  options: CLOTHES_STYLES },
    { label: 'Couleur de tenue',  key: 'clothesColor', type: 'color', options: CLOTHES_COLORS },
    { label: 'Accessoires',       key: 'accessories',  type: 'chip',  options: ACCESSORIES    },
  ]

  return (
    <div className="w-full">
      {/* Prévisualisation */}
      <div className="flex flex-col items-center mb-6">
        <div
          className="relative rounded-full border-4 border-[#1A1410] overflow-hidden mb-3 flex items-center justify-center"
          style={{ width: 140, height: 140, background: KZ.cream2, boxShadow: '6px 6px 0 #1A1410' }}
        >
          {!previewSvg ? (
            <div className="w-full h-full animate-pulse" style={{ background: KZ.orangeSoft }} />
          ) : previewSvg ? (
            <div
              className="w-full h-full"
              style={{ padding: 4 }}
              dangerouslySetInnerHTML={{ __html: previewSvg }}
            />
          ) : (
            /* Fallback si l'API DiceBear est inaccessible */
            <span className="text-4xl select-none">🧑</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleRandomize}
          className="flex items-center gap-2 px-4 py-2 rounded-full border-2 border-[#1A1410] text-sm font-bold transition-all hover:shadow-[3px_3px_0_#1A1410]"
          style={{ background: KZ.yellowSoft, color: '#1A1410' }}
        >
          <Shuffle size={14} /> Aléatoire
        </button>
      </div>

      {/* Options par section */}
      <div className="flex flex-col gap-5">
        {SECTIONS.map(section => (
          <div key={section.key}>
            <p className="text-xs font-extrabold text-[#1A1410] uppercase tracking-widest mb-2">
              {section.label}
            </p>
            {section.type === 'color' ? (
              <div className="flex gap-2 flex-wrap">
                {section.options.map(opt => (
                  <ColorSwatch
                    key={opt.id}
                    hex={opt.id}
                    selected={config[section.key] === opt.id}
                    onClick={() => set(section.key, opt.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex gap-1.5 flex-wrap">
                {section.options.map(opt => (
                  <OptionChip
                    key={opt.id}
                    label={opt.label}
                    selected={config[section.key] === opt.id}
                    onClick={() => set(section.key, opt.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bouton sauvegarde */}
      <div className="mt-6">
        <Button
          kind="primary"
          size="lg"
          full
          icon={<Check size={16} />}
          loading={saving}
          onClick={() => onSave(config)}
        >
          {compact ? 'Valider mon avatar' : 'Sauvegarder mon avatar'}
        </Button>
      </div>
    </div>
  )
}
