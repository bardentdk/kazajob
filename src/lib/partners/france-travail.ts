/**
 * France Travail (ex Pôle Emploi) — API Offres de service
 * Documentation : https://francetravail.io/data/api/offres-emploi
 *
 * Prérequis :
 *   FRANCE_TRAVAIL_CLIENT_ID=...
 *   FRANCE_TRAVAIL_CLIENT_SECRET=...
 * Ces variables sont configurées dans .env.local
 */

import type { PartnerJob, DiffusionResult } from './index'

const BASE_URL  = 'https://api.francetravail.io/partenaire/offresdemploi/v2'
const TOKEN_URL = 'https://entreprise.francetravail.fr/connexion/oauth2/access_token'

async function getAccessToken(): Promise<string> {
  const clientId     = process.env.FRANCE_TRAVAIL_CLIENT_ID
  const clientSecret = process.env.FRANCE_TRAVAIL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Variables FRANCE_TRAVAIL_CLIENT_ID / FRANCE_TRAVAIL_CLIENT_SECRET manquantes dans .env.local')
  }

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
      scope:         'api_offresdemploiv2 o2dsoffre',
    }),
  })

  if (!res.ok) throw new Error(`Token France Travail : ${res.status}`)
  const data = await res.json()
  return data.access_token
}

/** Convertit un job Kazajob au format France Travail */
function toFranceTravailPayload(job: PartnerJob) {
  return {
    intitule:         job.title,
    description:      job.description,
    typeContrat:      mapJobType(job.job_type),
    lieuTravail: {
      libelle:        job.location,
      codePostal:     '974',   // La Réunion — à affiner avec le vrai code postal
    },
    entreprise: {
      nom:            job.company.name,
      description:    job.company.description ?? undefined,
      url:            job.company.website ?? undefined,
      siret:          job.company.siret ?? undefined,
    },
    salaire: job.salary_min ? {
      libelle: `${job.salary_min}€ - ${job.salary_max ?? job.salary_min}€`,
    } : undefined,
    origineOffre: {
      origine:        '2',     // Code partenaire
      urlOrigine:     `https://kazajob.re/candidate/jobs/${job.id}`,
    },
  }
}

function mapJobType(type: string): string {
  const map: Record<string, string> = {
    'CDI':        'CDI',
    'CDD':        'CDD',
    'Stage':      'STG',
    'Alternance': 'CDA',
    'Freelance':  'LIB',
    'Intérim':    'MIS',
    'Temps partiel': 'CDI',
  }
  return map[type] ?? 'CDI'
}

export async function postToFranceTravail(job: PartnerJob): Promise<DiffusionResult> {
  // TODO: Activer après obtention des credentials API France Travail
  // const token = await getAccessToken()
  // const res = await fetch(`${BASE_URL}/offres`, {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify(toFranceTravailPayload(job)),
  // })
  // if (!res.ok) throw new Error(`France Travail POST : ${res.status}`)
  // const data = await res.json()
  // return { partner: 'france_travail', success: true, external_id: data.id }

  console.log(`[France Travail] Diffusion simulée pour l'offre ${job.id} — ${job.title}`)
  return { partner: 'france_travail', success: true, external_id: `FT-SIMULE-${job.id.slice(0,8)}` }
}

export async function deleteFromFranceTravail(externalId: string): Promise<void> {
  // TODO: DELETE /offres/{id}
  console.log(`[France Travail] Retrait simulé : ${externalId}`)
}
