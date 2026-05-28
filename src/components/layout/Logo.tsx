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
  const cls1 = '#544797';
  const cls1x2 = "url('#Dégradé_sans_nom_5')";

  const content = (
    <span className={cn('inline-flex items-center gap-2 select-none', className)}>
      <svg width={iconSize} height={iconSize} id="Calque_2" data-name="Calque 2" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 532 661.43">
        <defs>
          {/* <style>
            .cls-1 {
              stroke: #544797;
            }

            .cls-1, .cls-2 {
              fill: none;
              stroke-miterlimit: 10;
              stroke-width: 20px;
            }

            .cls-2 {
              stroke: url(#Dégradé_sans_nom_5);
            }
          </style> */}
          <linearGradient id="Dégradé_sans_nom_5" data-name="Dégradé sans nom 5" x1="-96.43" y1="534.89" x2="429.76" y2="-3.1" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#111527"/>
            <stop offset=".27" stopColor="#131526"/>
            <stop offset=".41" stopColor="#1b1826"/>
            <stop offset=".53" stopColor="#281c26"/>
            <stop offset=".63" stopColor="#3c2326"/>
            <stop offset=".71" stopColor="#552b26"/>
            <stop offset=".8" stopColor="#743525"/>
            <stop offset=".87" stopColor="#984125"/>
            <stop offset=".94" stopColor="#c14e24"/>
            <stop offset="1" stopColor="#eb5c24"/>
          </linearGradient>
        </defs>
        <g id="Calque_1-2" data-name="Calque 1">
          <g>
            <path stroke={cls1} strokeWidth="30" fill="transparent" strokeLinecap="round" strokeLinejoin="round" className="cls-2" d="M499.21,79.8L187.43,391.62c-6.22,6.22-13.15,11.32-20.54,15.25v241.54H50.43c-22.32,0-40.43-18.11-40.43-40.43V52.94c0-21.06,17.13-38.18,38.18-38.18h118.71v186.89L333.47,35.02c33.41-33.36,87.55-33.36,120.96,0l44.78,44.78Z"/>
            <circle className="cls-1" cx="390.74" cy="520.18" r="131.26" stroke={cls1x2} fill='transparent' strokeWidth="30"/>
          </g>
        </g>
      </svg>
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
