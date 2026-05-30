'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TrainingForm } from '@/components/forms/TrainingForm'
import { CompanyRequired } from '@/components/feedback/CompanyRequired'
import { useAuth } from '@/features/auth/useAuth'

export default function NewTrainingPage() {
  const { profile } = useAuth()
  return (
    <CompanyRequired action="publier une offre de formation">
    <div className="max-w-[760px] mx-auto">
      <Link href="/recruiter/training"
        className="flex items-center gap-2 text-sm font-semibold text-[#6B5A4A] hover:text-[#1A1410] mb-6">
        <ArrowLeft size={16} /> Retour aux formations
      </Link>
      <h1 className="kz-h2 text-[#1A1410] mb-6">Publier une offre de formation</h1>
      <div className="kz-card p-6 bg-white">
        {profile && (
          <TrainingForm
            recruiterId={profile.id}
            companyId={profile.company_id ?? undefined}
          />
        )}
      </div>
    </div>
    </CompanyRequired>
  )
}
