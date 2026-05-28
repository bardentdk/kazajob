import { KZ } from '@/lib/constants'

// ── Soleil cartoon ────────────────────────────────────────────
export function Soleil({
  size = 64,
  color = KZ.yellow,
  stroke = KZ.ink,
  sw = 2,
}: {
  size?: number
  color?: string
  stroke?: string
  sw?: number
}) {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
  const cx = 32, cy = 32
  return (
    <svg width={size} height={size} viewBox="0 0 64 64">
      {rays.map((a) => {
        const rad = (a * Math.PI) / 180
        return (
          <line
            key={a}
            x1={cx + Math.cos(rad) * 22} y1={cy + Math.sin(rad) * 22}
            x2={cx + Math.cos(rad) * 30} y2={cy + Math.sin(rad) * 30}
            stroke={stroke} strokeWidth={sw} strokeLinecap="round"
          />
        )
      })}
      <circle cx={cx} cy={cy} r="14" fill={color} stroke={stroke} strokeWidth={sw} />
    </svg>
  )
}

// ── Palme géométrique ─────────────────────────────────────────
export function Palme({
  size = 80,
  color = KZ.green,
  stroke = KZ.ink,
  sw = 2,
  rotate = 0,
}: {
  size?: number
  color?: string
  stroke?: string
  sw?: number
  rotate?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" style={{ transform: `rotate(${rotate}deg)` }}>
      <path d="M40 78 L40 36" stroke={KZ.ink} strokeWidth={sw + 0.5} strokeLinecap="round" fill="none" />
      <path d="M40 36 C 18 36, 8 20, 6 8 C 22 10, 36 22, 40 36 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M40 36 C 62 36, 72 20, 74 8 C 58 10, 44 22, 40 36 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <path d="M40 38 C 28 50, 14 52, 6 50 C 14 38, 28 32, 40 38 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" opacity={0.9} />
      <path d="M40 38 C 52 50, 66 52, 74 50 C 66 38, 52 32, 40 38 Z" fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" opacity={0.9} />
    </svg>
  )
}

// ── Montagne (Piton vibe) ─────────────────────────────────────
export function Montagne({
  width = 200,
  height = 80,
  color = KZ.violet,
  stroke = KZ.ink,
  sw = 2,
}: {
  width?: number
  height?: number
  color?: string
  stroke?: string
  sw?: number
}) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 80" preserveAspectRatio="none">
      <path
        d="M0 78 L 60 18 Q 64 14, 68 18 L 110 60 L 140 32 Q 144 28, 148 32 L 200 78 Z"
        fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"
      />
      <path d="M50 30 L 60 22 L 70 30 Z" fill="white" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
    </svg>
  )
}

// ── Vague sinusoïdale ─────────────────────────────────────────
export function Vague({
  width = 200,
  height = 28,
  color = KZ.blue,
  sw = 2,
}: {
  width?: number
  height?: number
  color?: string
  sw?: number
}) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 28" preserveAspectRatio="none">
      <path
        d="M0 14 Q 25 0, 50 14 T 100 14 T 150 14 T 200 14"
        fill="none" stroke={color} strokeWidth={sw + 1} strokeLinecap="round"
      />
    </svg>
  )
}

// ── Nuage ─────────────────────────────────────────────────────
export function Nuage({
  width = 80,
  height = 40,
  color = KZ.paper,
  stroke = KZ.ink,
  sw = 2,
}: {
  width?: number
  height?: number
  color?: string
  stroke?: string
  sw?: number
}) {
  return (
    <svg width={width} height={height} viewBox="0 0 80 40">
      <path
        d="M15 34 Q 4 34, 4 24 Q 4 16, 13 15 Q 14 6, 24 6 Q 31 6, 34 12 Q 38 8, 44 8 Q 56 8, 56 20 Q 64 20, 64 28 Q 64 34, 56 34 Z"
        fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Hibiscus ──────────────────────────────────────────────────
export function Hibiscus({
  size = 56,
  color = KZ.orangeSoft,
  stroke = KZ.ink,
  sw = 2,
}: {
  size?: number
  color?: string
  stroke?: string
  sw?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56">
      {[0, 72, 144, 216, 288].map((a, i) => {
        const rad = (a * Math.PI) / 180
        const cx = 28, cy = 28, r = 16
        const ex = cx + Math.cos(rad) * r
        const ey = cy + Math.sin(rad) * r
        return (
          <ellipse
            key={i}
            cx={(cx + ex) / 2} cy={(cy + ey) / 2}
            rx={11} ry={7}
            transform={`rotate(${a + 90}, ${(cx + ex) / 2}, ${(cy + ey) / 2})`}
            fill={color} stroke={stroke} strokeWidth={sw}
          />
        )
      })}
      <circle cx={28} cy={28} r={6} fill={KZ.yellow} stroke={stroke} strokeWidth={sw} />
    </svg>
  )
}

// ── Sparkle ───────────────────────────────────────────────────
export function Sparkle({
  size = 32,
  color = KZ.yellow,
  stroke = KZ.ink,
  sw = 2,
}: {
  size?: number
  color?: string
  stroke?: string
  sw?: number
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <path
        d="M16 3 L17.5 13 L28 14.5 L17.5 16 L16 26 L14.5 16 L4 14.5 L14.5 13 Z"
        fill={color} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"
      />
    </svg>
  )
}
