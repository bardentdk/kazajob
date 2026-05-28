import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: number
  mono?: boolean
  color?: string
  accentColor?: string
  href?: string
  className?: string
}

export function Logo({ size = 32, mono, color, accentColor = '#FF6B35', href = '/', className }: LogoProps) {
  const inkColor = mono ? (color ?? '#FFF7EE') : '#1A1410'
  const orange = mono ? accentColor : '#FF6B35'
  const iconSize = Math.round(size * 1.1)

  const content = (
    <span className={cn('inline-flex items-center gap-2 select-none', className)}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" fill={orange} stroke={inkColor} strokeWidth="2.2" />
        <path
          d="M 14 11 L 14 29 M 14 20 L 26 11 M 14 20 L 26 29"
          stroke={inkColor} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      <span
        style={{
          fontSize: size * 0.7,
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: inkColor,
          lineHeight: 1,
        }}
      >
        kazajob
      </span>
    </span>
  )

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {content}
      </Link>
    )
  }

  return content
}
