'use client'

import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { JobForm } from '@/components/forms/JobForm'
import { useAuth } from '@/features/auth/useAuth'

export default function NewJobPage() {
  const { profile } = useAuth()

  return (
    <div className="max-w-[760px] mx-auto">
      <Link href="/recruiter/jobs" className="flex items-center gap-2 text-sm font-semibold text-[#6B5A4A] hover:text-[#1A1410] mb-6">
        <ArrowLeft size={16} />
        Retour aux offres
      </Link>

      <h1 className="kz-h2 text-[#1A1410] mb-6">Publier une nouvelle offre</h1>

      <div className="kz-card p-6 bg-white">
        {profile && <JobForm recruiterId={profile.id} />}
      </div>
    </div>
  )
}
