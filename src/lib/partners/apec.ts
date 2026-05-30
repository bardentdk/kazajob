/**
 * APEC — Cadres & ingénieurs
 * https://www.apec.fr/partenaires-recruteurs/diffusion-partenaires.html
 *
 * Prérequis :
 *   APEC_CLIENT_ID=...
 *   APEC_CLIENT_SECRET=...
 */

import type { PartnerJob, DiffusionResult } from './index'

export async function postToApec(job: PartnerJob): Promise<DiffusionResult> {
  console.log(`[APEC] Diffusion simulée : ${job.title}`)
  // TODO: Activer après accord de partenariat APEC
  return { partner: 'apec', success: true, external_id: `APEC-SIMULE-${job.id.slice(0,8)}` }
}
