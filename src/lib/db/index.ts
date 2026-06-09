/**
 * KAZAJOB — Client base de données (Neon + Drizzle)
 * Driver HTTP serverless : idéal pour les Route Handlers / Server Components.
 */
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL manquant — configure ta connexion Neon dans .env.local')
}

const sql = neon(connectionString)
export const db = drizzle(sql, { schema })
export { schema }
