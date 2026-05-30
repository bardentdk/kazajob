/**
 * Mission Locale — Réseau Réunion
 * Intégration via flux XML ou API REST selon accord de partenariat.
 *
 * Prérequis :
 *   MISSION_LOCALE_API_KEY=...
 *   MISSION_LOCALE_ENDPOINT=...
 */

import type { PartnerJob, DiffusionResult } from './index'

export async function postToMissionLocale(job: PartnerJob): Promise<DiffusionResult> {
  const apiKey   = process.env.MISSION_LOCALE_API_KEY
  const endpoint = process.env.MISSION_LOCALE_ENDPOINT

  if (!apiKey || !endpoint) {
    // Pas encore configuré → simuler
    console.log(`[Mission Locale] Diffusion simulée : ${job.title}`)
    return { partner: 'mission_locale', success: true, external_id: `ML-SIMULE-${job.id.slice(0,8)}` }
  }

  // TODO: Activer après accord de partenariat Mission Locale 974
  // const res = await fetch(endpoint, {
  //   method: 'POST',
  //   headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     titre:       job.title,
  //     description: job.description,
  //     contrat:     job.job_type,
  //     localisation: job.location,
  //     entreprise:  job.company.name,
  //     lien:        `https://kazajob.re/candidate/jobs/${job.id}`,
  //   }),
  // })
  // if (!res.ok) throw new Error(`Mission Locale POST : ${res.status}`)
  // const data = await res.json()
  // return { partner: 'mission_locale', success: true, external_id: data.id }

  return { partner: 'mission_locale', success: true, external_id: `ML-SIMULE-${job.id.slice(0,8)}` }
}
