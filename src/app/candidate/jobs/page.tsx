'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
import type { JobFilters } from '@/lib/types'

const CITY_OPTIONS = [{ value: '', label: 'Toute la Reunion' }, ...REUNION_CITIES.map((c) => ({ value: c, label: c }))]
const TYPE_OPTIONS = [{ value: '', label: 'Tous les types' }, ...JOB_TYPES.map((t) => ({ value: t, label: t }))]
const SECTOR_OPTIONS = [{ value: '', label: 'Tous les secteurs' }, ...JOB_SECTORS.map((s) => ({ value: s, label: s }))]

function JobsContent() {
  const searchParams = useSearchParams()
  // Initialise les filtres depuis l'URL (recherche home → listing : ?q=, ville, type…)
  const [initialFilters] = useState<JobFilters>(() => ({
    q:        searchParams.get('q') || undefined,
    location: searchParams.get('location') || undefined,
    job_type: searchParams.get('job_type') || undefined,
    sector:   searchParams.get('sector') || undefined,
    remote:   searchParams.get('remote') === 'true' ? true : undefined,
    page: 1,
    limit: 12,
  }))
  const { profile } = useAuth()
  const { jobs, loading, count, filters, updateFilters } = useJobs(initialFilters)
  const { isFavorite, toggle } = useFavorites(profile?.id)
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState(initialFilters.q ?? '')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ q: searchInput })
  }

  const activeFilters = Object.entries(filters).filter(([k, v]) => v && !['page', 'limit'].includes(k))

  return (
    <div className="max-w-[1100px] mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl lg:text-[32px] font-extrabold tracking-tight text-[#1A1410] mb-1">Offres d&apos;emploi</h1>
        <p className="text-sm text-[#6B5A4A]">{count} offre{count !== 1 ? 's' : ''} · La Reunion 974</p>
      </div>

      {/* Barre de recherche */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-3 flex-wrap sm:flex-nowrap">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Metier, competence..."
          icon={<Search size={16} />}
          className="flex-1 min-w-0"
        />
        <Select
          options={CITY_OPTIONS}
          value={filters.location ?? ''}
          onChange={(e) => updateFilters({ location: e.target.value || undefined })}
          className="w-full sm:w-44 shrink-0"
        />
        <div className="flex gap-2 w-full sm:w-auto">
          <Button type="submit" kind="primary" size="md" className="flex-1 sm:flex-none">Chercher</Button>
          <Button
            type="button"
            kind={showFilters ? 'dark' : 'outline'}
            size="md"
            icon={<SlidersHorizontal size={15} />}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="hidden sm:inline">Filtres</span>
          </Button>
        </div>
      </form>

      {/* Filtres avancés */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 mb-3 rounded-xl border border-[#1A1410] bg-white">
          <Select label="Type de contrat" options={TYPE_OPTIONS} value={filters.job_type ?? ''} onChange={(e) => updateFilters({ job_type: e.target.value || undefined })} />
          <Select label="Secteur" options={SECTOR_OPTIONS} value={filters.sector ?? ''} onChange={(e) => updateFilters({ sector: e.target.value || undefined })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#2A2018]">Remote</label>
            <div className="flex gap-2">
              {[{ v: undefined, l: 'Tous' }, { v: true, l: 'Remote' }].map(({ v, l }) => (
                <button key={l} type="button" onClick={() => updateFilters({ remote: v })}
                  className="flex-1 py-2.5 text-sm font-semibold border-[1.5px] rounded-lg border-[#1A1410]"
                  style={{ background: filters.remote === v ? '#1A1410' : 'white', color: filters.remote === v ? '#FFF7EE' : '#1A1410' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtres actifs */}
      {activeFilters.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {activeFilters.map(([k, v]) => (
            <Badge key={k} color="orange" size="sm">
              {String(v)}
              <button onClick={() => updateFilters({ [k]: undefined })} className="ml-1"><X size={10} /></button>
            </Badge>
          ))}
        </div>
      )}

      {/* Grille offres — 1 col mobile, 2 tablette, 3 desktop */}
      {loading ? <PageLoader /> : jobs.length === 0 ? (
        <EmptyState
          title="Aucune offre trouvee"
          description="Essaie d'autres mots-cles ou elargis ta recherche."
          icon={<Briefcase size={28} />}
          action={<Button kind="outline" onClick={() => updateFilters({ q: undefined, location: undefined })}>Effacer les filtres</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} isFavorite={isFavorite(job.id)} onToggleFavorite={toggle} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {count > (filters.limit ?? 12) && (
        <div className="flex justify-center gap-2 mt-6">
          <Button kind="outline" size="md" disabled={(filters.page ?? 1) <= 1} onClick={() => updateFilters({ page: (filters.page ?? 1) - 1 })}>Precedent</Button>
          <span className="flex items-center px-4 text-sm font-semibold text-[#1A1410]">
            {filters.page ?? 1} / {Math.ceil(count / (filters.limit ?? 12))}
          </span>
          <Button kind="outline" size="md" disabled={(filters.page ?? 1) >= Math.ceil(count / (filters.limit ?? 12))} onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}>Suivant</Button>
        </div>
      )}
    </div>
  )
}

export default function CandidateJobsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JobsContent />
    </Suspense>
  )
}
