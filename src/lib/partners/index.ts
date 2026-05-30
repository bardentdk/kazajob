/**
 * Kazajob — Couche de diffusion multi-plateformes
 * Dispatcher qui envoie les offres aux partenaires selon le plan de l'entreprise.
 */

export interface PartnerJob {
  id:          string
  title:       string
  description: string
  requirements: string | null
  location:    string
  job_type:    string
  salary_min:  number | null
  salary_max:  number | null
  remote:      boolean
  company: {
    name:        string
    description: string | null
    website:     string | null
    siret:       string | null
  }
  skills: string[]
  posted_at: string
}

export interface DiffusionResult {
  partner:    string
  success:    boolean
  external_id?: string
  error?:     string
}

/**
 * Diffuse une offre vers tous les partenaires du plan actif.
 * À appeler depuis les API routes (server-side uniquement).
 */
export async function diffuseJob(
  job: PartnerJob,
  activePartners: string[]
): Promise<DiffusionResult[]> {
  const results: DiffusionResult[] = []

  for (const partner of activePartners) {
    try {
      let result: DiffusionResult

      switch (partner) {
        case 'france_travail': {
          const { postToFranceTravail } = await import('./france-travail')
          result = await postToFranceTravail(job)
          break
        }
        case 'mission_locale': {
          const { postToMissionLocale } = await import('./mission-locale')
          result = await postToMissionLocale(job)
          break
        }
        case 'apec': {
          const { postToApec } = await import('./apec')
          result = await postToApec(job)
          break
        }
        case 'indeed':
        case 'aggregator': {
          const { postToAggregator } = await import('./aggregator')
          result = await postToAggregator(job, partner)
          break
        }
        default:
          result = { partner, success: false, error: `Partenaire inconnu : ${partner}` }
      }
      results.push(result)
    } catch (err) {
      results.push({ partner, success: false, error: err instanceof Error ? err.message : 'Erreur inconnue' })
    }
  }

  return results
}

/**
 * Retire une offre de tous les partenaires (lors de la dépublication).
 */
export async function retractJob(
  jobId: string,
  activePartners: string[]
): Promise<void> {
  // TODO: implémenter le retrait par partenaire
  console.log(`[Partners] Retrait offre ${jobId} de : ${activePartners.join(', ')}`)
}
