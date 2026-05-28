import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: number
  className?: string
}

export function LoadingSpinner({ size = 24, className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn('border-2 border-[#1A1410] border-t-[#FF6B35] rounded-full animate-spin', className)}
      style={{ width: size, height: size }}
    />
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size={40} />
        <p className="text-sm font-semibold text-[#6B5A4A]">Chargement...</p>
      </div>
    </div>
  )
}
