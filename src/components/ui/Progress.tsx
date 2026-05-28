import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  color?: string
  height?: number
  label?: string
  className?: string
}

export function Progress({ value, color = '#FF6B35', height = 12, label, className }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <div className="flex justify-between text-xs font-semibold text-[#2A2018] mb-1">
          <span>{label}</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div
        className="w-full bg-[#FBEFE0] border border-[#1A1410] rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${clamped}%`,
            background: color,
            borderRight: clamped < 100 ? '1.5px solid #1A1410' : 'none',
          }}
        />
      </div>
    </div>
  )
}
