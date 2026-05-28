'use client'

import { Heart } from 'lucide-react'
import { JobCard } from '@/components/cards/JobCard'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'

export default function FavoritesPage() {
  const { profile } = useAuth()
  const { favorites, loading, isFavorite, toggle } = useFavorites(profile?.id)

  return (
    <div className="max-w-[900px] mx-auto">
      <div className="mb-6">
        <h1 className="kz-h2 text-[#1A1410] mb-1">Mes favoris</h1>
        <p className="text-sm text-[#6B5A4A]">{favorites.length} offre(s) sauvegardee(s)</p>
      </div>

      {loading ? (
        <PageLoader />
      ) : favorites.length === 0 ? (
        <EmptyState
          title="Aucun favori pour l'instant"
          description="Sauvegarde les offres qui t'interessent pour les retrouver facilement."
          icon={<Heart size={28} />}
          action={<Link href="/candidate/jobs"><Button kind="primary">Explorer les offres</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {favorites.map((fav) => (
            fav.job && (
              <JobCard
                key={fav.id}
                job={fav.job}
                isFavorite={isFavorite(fav.job.id)}
                onToggleFavorite={toggle}
              />
            )
          ))}
        </div>
      )}
    </div>
  )
}
