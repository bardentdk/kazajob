'use client'

import Link from 'next/link'
import { Building2, ArrowRight, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth/useAuth'
import { KZ } from '@/lib/constants'

interface CompanyRequiredProps {
  children: React.ReactNode
  /** Message contextuel à afficher (ex: "publier une offre d'emploi") */
  action?: string
}

/**
 * Guard : affiche un message d'erreur + redirection si le recruteur
 * n'a pas encore configuré/rejoint une entreprise.
 */
export function CompanyRequired({ children, action = 'effectuer cette action' }: CompanyRequiredProps) {
  const { profile, loading } = useAuth()

  // Attendre le chargement
  if (loading) return null

  // Accès autorisé si company_id est défini
  if (profile?.company_id) return <>{children}</>

  // Bloqué — pas d'entreprise configurée
  return (
    <div className="max-w-[520px] mx-auto py-12 px-4">
      <div
        className="kz-card p-8 text-center"
        style={{ background: KZ.paper, boxShadow: '5px 5px 0 #1A1410' }}
      >
        {/* Icône */}
        <div
          className="w-20 h-20 rounded-2xl border-2 border-[#1A1410] flex items-center justify-center mx-auto mb-5"
          style={{ background: KZ.orangeSoft }}
        >
          <Building2 size={36} color={KZ.orange} />
        </div>

        {/* Titre */}
        <h2 className="text-xl font-extrabold text-[#1A1410] mb-2 tracking-tight">
          Entreprise requise
        </h2>

        {/* Message */}
        <p className="text-sm text-[#6B5A4A] leading-relaxed mb-6">
          Vous devez <strong>configurer ou rejoindre une entreprise</strong> avant de pouvoir {action}.
          <br /><br />
          Cela ne prend que quelques minutes.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link href="/recruiter/company-setup">
            <Button
              kind="primary"
              size="lg"
              full
              icon={<Building2 size={15} />}
              iconRight={<ArrowRight size={15} />}
            >
              Configurer mon entreprise
            </Button>
          </Link>

          <Link href="/recruiter/dashboard">
            <Button kind="soft" size="md" full icon={<Clock size={14} />}>
              Retour au tableau de bord
            </Button>
          </Link>
        </div>

        {/* Note attente */}
        <p className="text-xs text-[#6B5A4A] mt-5 leading-relaxed">
          Si vous avez déjà envoyé une demande pour rejoindre une équipe,
          attendez l&apos;approbation du responsable.
        </p>
      </div>
    </div>
  )
}
