/**
 * KAZAJOB — Client base de données (Neon + Drizzle)
 * Driver HTTP serverless : idéal pour les Route Handlers / Server Components.
 */
import { drizzle } from 'drizzle-orm/neon-http'
import { neon, neonConfig } from '@neondatabase/serverless'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL manquant — configure ta connexion Neon dans .env.local')
}

// Retry transparent sur les échecs réseau / cold-start Neon (HTTP 5xx ou rejet fetch).
// Couvre les « Failed query » transitoires sans toucher aux vraies erreurs SQL (réponses 4xx/200).
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
neonConfig.fetchFunction = async (url: unknown, opts: unknown) => {
  let lastErr: unknown
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url as RequestInfo, opts as RequestInit)
      if (res.status >= 500 && attempt < 2) { await delay(200 * (attempt + 1)); continue }
      return res
    } catch (e) {
      lastErr = e
      if (attempt < 2) { await delay(200 * (attempt + 1)); continue }
      throw e
    }
  }
  throw lastErr
}

const sql = neon(connectionString)
export const db = drizzle(sql, { schema })
export { schema }
