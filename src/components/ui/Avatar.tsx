import { cn } from '@/lib/utils'
import { initials } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string | null
  size?: number
  color?: string
  badge?: boolean
  className?: string
}

export function Avatar({ name, src, size = 40, color = '#FFE0CF', badge, className }: AvatarProps) {
  const init = initials(name)
  const px = `${size}px`

  return (
    <div
      className={cn('relative shrink-0 inline-flex', className)}
      style={{ width: px, height: px }}
    >
      <div
        className="w-full h-full rounded-full border-[1.5px] border-[#1A1410] flex items-center justify-center font-bold overflow-hidden"
        style={{ background: color, fontSize: size * 0.36 }}
      >
        {src ? (
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
