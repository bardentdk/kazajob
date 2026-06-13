'use client'

import Link from 'next/link'
import { MapPin, Heart, Sparkles, Rocket } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Tag } from '@/components/ui/Tag'
import type { Job } from '@/lib/types'
import { formatSalary, timeAgo } from '@/lib/utils'
import { KZ } from '@/lib/constants'

const COMPANY_COLORS = [
  KZ.orangeSoft, KZ.violetSoft, KZ.greenSoft, KZ.yellowSoft, KZ.blueSoft,
]

interface JobCardProps {
  job: Job
  isFavorite?: boolean
  onToggleFavorite?: (jobId: string) => void
  showMatch?: boolean
  compact?: boolean
}

export function JobCard({ job, isFavorite, onToggleFavorite, showMatch = true, compact }: JobCardProps) {
  const color = COMPANY_COLORS[(job.company?.name?.charCodeAt(0) ?? 0) % COMPANY_COLORS.length]
  const companyInitials = (job.company?.name ?? 'CO').slice(0, 2).toUpperCase()
  const isNew = Date.now() - new Date(job.created_at).getTime() < 86400000 * 3
  const isBoosted = !!job.is_boosted

  return (
    <div
      className="kz-card p-5 bg-white flex flex-col gap-3.5 relative group hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[5px_5px_0_#1A1410] transition-all duration-100"
      style={isBoosted ? { borderColor: KZ.orange, boxShadow: '4px 4px 0 ' + KZ.orange } : undefined}
    >
      {isBoosted && (
        <div className="absolute -top-3 left-4" style={{ transform: 'rotate(-5deg)' }}>
          <Badge color="orange" size="sm"><span className="flex items-center gap-1"><Rocket size={10} />À la une</span></Badge>
        </div>
      )}
      {isNew && !isBoosted && (
        <div className="absolute -top-3 right-4" style={{ transform: 'rotate(6deg)' }}>
          <Badge color="orange" size="sm">Nouveau</Badge>
        </div>
      )}

      <div className="flex gap-3 items-start">
        <div
          className="w-12 h-12 rounded-lg border border-[#1A1410] flex items-center justify-center font-bold text-[#1A1410] shrink-0 text-base"
          style={{ background: color }}
        >
          {companyInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-[#6B5A4A]">{job.company?.name}</div>
          <div className="text-base font-bold text-[#1A1410] mt-0.5 leading-snug truncate">
            {job.title}
          </div>
        </div>
        {onToggleFavorite && (
          <button
            onClick={(e) => { e.preventDefault(); onToggleFavorite(job.id) }}
            className="shrink-0 mt-0.5 text-[#6B5A4A] hover:text-[#FF6B35] transition-colors"
          >
            <Heart size={18} fill={isFavorite ? '#FF6B35' : 'none'} color={isFavorite ? '#FF6B35' : 'currentColor'} />
          </button>
        )}
      </div>

      {!compact && (
        <div className="flex gap-1.5 flex-wrap">
          <Tag color="cream">{job.job_type}</Tag>
          {job.remote && <Tag color="green">Remote</Tag>}
          {job.skills?.slice(0, 2).map((s) => (
            <Tag key={s.id}>{s.name}</Tag>
          ))}
        </div>
      )}

      <div className="flex justify-between items-center pt-2.5 border-t border-[#E8DDC9]">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1 text-xs text-[#2A2018]">
            <MapPin size={11} />
            {job.location}
          </div>
          <div className="text-xs font-semibold text-[#2A2018]">
            {formatSalary(job.salary_min, job.salary_max)}
          </div>
        </div>
        {showMatch && job.match_score !== undefined && (
          <Badge color="violet" icon={<Sparkles size={11} />}>
            {job.match_score}%
          </Badge>
        )}
        {!showMatch && (
          <span className="text-[10px] text-[#6B5A4A]">{timeAgo(job.created_at)}</span>
        )}
      </div>

      <Link href={`/candidate/jobs/${job.id}`} className="absolute inset-0" aria-label={job.title} />
    </div>
  )
}
