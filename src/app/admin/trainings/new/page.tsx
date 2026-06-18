'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { TrainingForm } from '@/components/forms/TrainingForm'
import { useAuth } from '@/features/auth/useAuth'

export default function AdminNewTrainingPage() {
  const { profile } = useAuth()
  return (
    <div className="max-w-[760px] mx-auto">
      <Link href="/admin/jobs" className="flex items-center gap-2 text-sm font-semibold text-[#6B5A4A] hover:text-[#1A1410] mb-6">
        <ArrowLeft size={16} />Retour
      </Link>
      <h1 className="kz-h2 text-[#1A1410] mb-6">Créer une annonce de formation</h1>
      <div className="kz-card p-6 bg-white">
        {profile && <TrainingForm recruiterId={profile.id} admin />}
      </div>
    </div>
  )
}
