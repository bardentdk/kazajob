/**
 * Agrégateurs génériques — Indeed, flux XML/RSS
 * Indeed utilise un flux XML Sitemap ou API Sponsored Jobs.
 * Les autres agrégateurs (Monster, Meteojob, etc.) consomment un flux XML standardisé.
 *
 * Prérequis :
 *   INDEED_PUBLISHER_ID=...         (pour le suivi des clics)
 *   XML_FEED_SECRET=...             (signature HMAC du flux)
 */

import type { PartnerJob, DiffusionResult } from './index'

/**
 * Indeed & agrégateurs XML :
 * Les offres sont diffusées via un flux XML public généré dynamiquement.
 * L'URL du flux est : https://kazajob.re/api/partners/feed.xml
 * Indeed & les agrégateurs récupèrent ce flux automatiquement.
 * Aucun POST n'est nécessaire — la diffusion est passive via le flux.
 */
export async function postToAggregator(job: PartnerJob, partner: string): Promise<DiffusionResult> {
  // Indeed & agrégateurs consomment le flux XML généré par /api/partners/feed
  // L'offre apparaîtra dans le prochain crawl (< 24h pour Indeed)
  console.log(`[${partner}] Offre ${job.id} disponible via flux XML kazajob.re/api/partners/feed.xml`)
  return { partner, success: true, external_id: `FEED-${job.id.slice(0,8)}` }
}

/**
 * Génère le flux XML au format Indeed JobPosting (appelé par /api/partners/feed/route.ts).
 * À créer : src/app/api/partners/feed/route.ts
 */
export function generateXMLFeed(jobs: PartnerJob[]): string {
  const items = jobs.map(job => `
    <job>
      <title><![CDATA[${job.title}]]></title>
      <url>https://kazajob.re/candidate/jobs/${job.id}</url>
      <company><![CDATA[${job.company.name}]]></company>
      <city><![CDATA[${job.location}]]></city>
      <state>974</state>
      <country>FR</country>
      <jobtype>${job.job_type}</jobtype>
      <description><![CDATA[${job.description}]]></description>
      ${job.salary_min ? `<salary>${job.salary_min} EUR</salary>` : ''}
      <date>${new Date(job.posted_at).toISOString()}</date>
      ${job.remote ? '<remotetype>Full Remote</remotetype>' : ''}
    </job>`).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>Kazajob</publisher>
  <publisherurl>https://kazajob.re</publisherurl>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  ${items}
</source>`
}
