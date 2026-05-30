'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'
import { generateAvatarSvg } from '@/lib/avatar'
import type { AvatarConfig } from '@/lib/avatar'

interface AvatarProps {
  name: string
  src?: string | null
  avatarConfig?: Record<string, string> | null
  size?: number
  color?: string
  badge?: boolean
  className?: string
}

export function Avatar({ name, src, avatarConfig, size = 40, color = '#FFE0CF', badge, className }: AvatarProps) {
  const init      = initials(name)
  const px        = `${size}px`
  const isDiceBear = !!(avatarConfig && Object.keys(avatarConfig).length > 0)

  // Génération SVG locale — 0 appel HTTP, instantané
  const [dicebearSvg, setDicebearSvg] = useState<string | null>(null)

  useEffect(() => {
    if (!isDiceBear || !avatarConfig) return
    try {
      const svg = generateAvatarSvg(avatarConfig as unknown as AvatarConfig)
      setDicebearSvg(svg)
    } catch { /* garde les initiales */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDiceBear, JSON.stringify(avatarConfig)])

  return (
    <div
      className={cn('relative shrink-0 inline-flex', className)}
      style={{ width: px, height: px }}
    >
      <div
        className="w-full h-full rounded-full border-[1.5px] border-[#1A1410] flex items-center justify-center font-bold overflow-hidden"
        style={{ background: color, fontSize: size * 0.36 }}
      >
        {isDiceBear && dicebearSvg ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ padding: 1 }}
            dangerouslySetInnerHTML={{ __html: dicebearSvg }}
          />
        ) : !isDiceBear && src ? (
          <img src={src} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[#1A1410]">{init}</span>
        )}
      </div>
      {badge && (
        <span
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white"
          style={{ background: '#19A974' }}
        />
      )}
    </div>
  )
}
