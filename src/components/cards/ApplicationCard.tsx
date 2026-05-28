import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import type { Application } from '@/lib/types'
import { APPLICATION_STATUSES, KZ } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import type { BadgeColor } from '@/lib/types'

interface ApplicationCardProps {
  application: Application
  showActions?: boolean
}

export function ApplicationCard({ application, showActions }: ApplicationCardProps) {
  const statusInfo = APPLICATION_STATUSES[application.status] ?? {
    label: application.status,
    color: 'cream',
  }
  const company = application.job?.company
  const companyInitials = (company?.name ?? 'CO').slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#E8DDC9] last:border-0">
      <div className="w-10 h-10 rounded-lg bg-[#FFF7EE] border border-[#1A1410] flex items-center justify-center font-bold text-sm text-[#1A1410] shrink-0">
        {companyInitials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-[#1A1410] truncate">{application.job?.title}</div>
        <div className="text-xs text-[#6B5A4A]">
          {company?.name} · {timeAgo(application.created_at)}
        </div>
      </div>
      <Badge color={statusInfo.color as BadgeColor} size="sm">
        {statusInfo.label}
      </Badge>
      {showActions && (
        <Link href={`/candidate/applications/${application.id}`} className="text-[#6B5A4A] hover:text-[#FF6B35]">
          <ArrowRight size={16} />
        </Link>
      )}
    </div>
  )
}
