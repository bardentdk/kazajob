import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

// drizzle-kit s'exécute hors de Next : on charge .env.local explicitement
config({ path: '.env.local' })

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
})
