import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

type TagColor = 'orange' | 'violet' | 'blue' | 'green' | 'yellow' | 'cream' | 'paper'

const colorMap: Record<TagColor, string> = {
  orange: 'bg-[#FFE0CF] text-[#1A1410]',
  violet: 'bg-[#E5DCFF] text-[#1A1410]',
  blue:   'bg-[#DCE7FB] text-[#1A1410]',
  green:  'bg-[#D6F0E0] text-[#1A1410]',
  yellow: 'bg-[#FFF1C2] text-[#1A1410]',
  cream:  'bg-[#FBEFE0] text-[#1A1410]',
  paper:  'bg-white text-[#1A1410]',
}

interface TagProps {
  children: ReactNode
  color?: TagColor
  icon?: ReactNode
  className?: string
}

export function Tag({ children, color = 'cream', icon, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border border-[#1A1410] rounded-md whitespace-nowrap',
        colorMap[color],
        className
      )}
    >
      {icon}
      {children}
    </span>
  )
}
