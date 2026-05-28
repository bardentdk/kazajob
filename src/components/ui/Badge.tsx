import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'

const colorMap: Record<BadgeColor, string> = {
  orange: 'bg-[#FFE0CF] text-[#1A1410]',
  violet: 'bg-[#E5DCFF] text-[#1A1410]',
  blue:   'bg-[#DCE7FB] text-[#1A1410]',
  green:  'bg-[#D6F0E0] text-[#1A1410]',
  yellow: 'bg-[#FFF1C2] text-[#1A1410]',
  ink:    'bg-[#1A1410] text-[#FFF7EE]',
  cream:  'bg-[#FBEFE0] text-[#1A1410]',
  paper:  'bg-white text-[#1A1410]',
}

const sizeMap = {
  sm: 'px-2 py-0.5 text-[10px] h-5 gap-1',
  md: 'px-2.5 py-1 text-[11px] h-6 gap-1.5',
  lg: 'px-3 py-1.5 text-[13px] h-7 gap-1.5',
}

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  outline?: boolean
  className?: string
}

export function Badge({
  children,
  color = 'orange',
  size = 'md',
  icon,
  outline = true,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-bold tracking-tight whitespace-nowrap rounded-full',
        colorMap[color],
        sizeMap[size],
        outline && 'border border-[#1A1410]',
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
