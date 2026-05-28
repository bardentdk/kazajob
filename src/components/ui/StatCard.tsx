import { type ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  icon?: ReactNode
  color?: string
  className?: string
}

export function StatCard({ label, value, delta, icon, color = '#E5DCFF', className }: StatCardProps) {
  const isPositive = delta?.startsWith('+')
  const isNegative = delta?.startsWith('-')

  return (
    <div
      className={cn('kz-card p-4', className)}
      style={{ background: color }}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#6B5A4A]">
          {label}
        </div>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white border border-[#1A1410] flex items-center justify-center text-[#1A1410]">
            {icon}
          </div>
        )}
      </div>
      <div className="text-[32px] font-extrabold tracking-tighter leading-none text-[#1A1410]">
        {value}
      </div>
      {delta && (
        <div className={cn(
          'flex items-center gap-1 mt-1.5 text-xs font-semibold',
          isPositive && 'text-[#0E7C4A]',
          isNegative && 'text-[#B73838]',
          !isPositive && !isNegative && 'text-[#6B5A4A]'
        )}>
          {isPositive && <TrendingUp size={12} />}
          {isNegative && <TrendingDown size={12} />}
          {delta}
        </div>
      )}
    </div>
  )
}
