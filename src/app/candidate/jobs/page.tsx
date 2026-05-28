'use client'

import { useState } from 'react'
import { Search, MapPin, SlidersHorizontal, Briefcase, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { JobCard } from '@/components/cards/JobCard'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageLoader } from '@/components/feedback/LoadingSpinner'
import { useJobs } from '@/features/jobs/useJobs'
import { useFavorites } from '@/features/favorites/useFavorites'
import { useAuth } from '@/features/auth/useAuth'
import { REUNION_CITIES, JOB_TYPES, JOB_SECTORS } from '@/lib/constants'
import type { Job } from '@/lib/types'

const CITY_OPTIONS = [{ value: '', label: 'Toute la Reunion' }, ...REUNION_CITIES.map((c) => ({ value: c, label: c }))]
const TYPE_OPTIONS = [{ value: '', label: 'Tous les types' }, ...JOB_TYPES.map((t) => ({ value: t, label: t }))]
const SECTOR_OPTIONS = [{ value: '', label: 'Tous les secteurs' }, ...JOB_SECTORS.map((s) => ({ value: s, label: s }))]

export default function CandidateJobsPage() {
  const { profile } = useAuth()
  const { jobs, loading, count, filters, updateFilters } = useJobs({ limit: 12 })
  const { isFavorite, toggle } = useFavorites(profile?.id)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ q: searchInput })
  }

  const clearFilter = (key: string) => {
    updateFilters({ [key]: undefined })
  }

  const activeFilters = Object.entries(filters).filter(
    ([k, v]) => v && !['page', 'limit'].includes(k)
  )

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="kz-h2 text-[#1A1410] mb-1">Offres d&apos;emploi</h1>
        <p className="text-sm text-[#6B5A4A]">{count} offres disponibles · La Reunion 974</p>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Metier, entreprise, competence..."
          icon={<Search size={16} />}
          className="flex-1"
        />
        <Select
          options={CITY_OPTIONS}
          value={filters.location ?? ''}
          onChange={(e) => updateFilters({ location: e.target.value || undefined })}
          className="w-48"
        />
        <Button type="submit" kind="primary" size="md">Rechercher</Button>
        <Button
          type="button"
          kind={showFilters ? 'dark' : 'outline'}
          size="md"
          icon={<SlidersHorizontal size={16} />}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filtres
        </Button>
      </form>

      {/* Filtres avances */}
      {showFilters && (
        <div className="grid grid-cols-3 gap-3 p-4 mb-4 rounded-xl border border-[#1A1410] bg-white">
          <Select
            label="Type de contrat"
            options={TYPE_OPTIONS}
            value={filters.job_type ?? ''}
            onChange={(e) => updateFilters({ job_type: e.target.value || undefined })}
          />
          <Select
            label="Secteur"
            options={SECTOR_OPTIONS}
            value={filters.sector ?? ''}
            onChange={(e) => updateFilters({ sector: e.target.value || undefined })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#2A2018]">Remote</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => updateFilters({ remote: undefined })}
                className="flex-1 py-2.5 text-sm font-semibold border border-[#1A1410] rounded-lg"
                style={{ background: filters.remote === undefined ? '#1A1410' : 'white', color: filters.remote === undefined ? '#FFF7EE' : '#1A1410' }}
              >
                Tous
              </button>
              <button
                type="button"
                onClick={() => updateFilters({ remote: true })}
                className="flex-1 py-2.5 text-sm font-semibold border border-[#1A1410] rounded-lg"
                style={{ background: filters.remote === true ? '#19A974' : 'white', color: '#1A1410' }}
              >
                Remote
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtres actifs */}
      {activeFilters.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {activeFilters.map(([k, v]) => (
            <Badge key={k} color="orange" size="md">
              {String(v)}
              <button onClick={() => clearFilter(k)} className="ml-1 hover:opacity-70">
                <X size={11} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Liste offres */}
      {loading ? (
        <PageLoader />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="Aucune offre trouvee"
          description="Essaie d'autres mots-cles ou elargis ta recherche."
          icon={<Briefcase size={28} />}
          action={<Button kind="outline" onClick={() => updateFilters({ q: undefined, location: undefined })}>Effacer les filtres</Button>}
        />
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isFavorite={isFavorite(job.id)}
              onToggleFavorite={toggle}
            />
          ))}
        </div>
      )}

      {/* Pagination simple */}
      {count > (filters.limit ?? 12) && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            kind="outline"
            size="md"
            disabled={(filters.page ?? 1) <= 1}
            onClick={() => updateFilters({ page: (filters.page ?? 1) - 1 })}
          >
            Precedent
          </Button>
          <span className="flex items-center px-4 text-sm font-semibold text-[#1A1410]">
            Page {filters.page ?? 1} / {Math.ceil(count / (filters.limit ?? 12))}
          </span>
          <Button
            kind="outline"
            size="md"
            disabled={(filters.page ?? 1) >= Math.ceil(count / (filters.limit ?? 12))}
            onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  )
}
