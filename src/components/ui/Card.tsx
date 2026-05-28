import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  padded?: boolean
  color?: string
  variant?: 'default' | 'sm'
}

export function Card({ children, className, padded = true, color, variant = 'default' }: CardProps) {
  return (
    <div
      className={cn(
        variant === 'default' ? 'kz-card' : 'kz-card-sm',
        padded && 'p-5',
        className
      )}
      style={color ? { background: color } : undefined}
    >
      {children}
    </div>
  )
}
