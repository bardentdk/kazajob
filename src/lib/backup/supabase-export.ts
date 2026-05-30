/**
 * KAZAJOB — Export Supabase pour sauvegarde
 * Utilise la service role key pour bypasser les RLS
 */
import { createClient } from '@supabase/supabase-js'

const TABLES_TO_BACKUP = [
  'profiles',
  'companies',
  'company_members',
  'company_join_requests',
  'company_subscriptions',
  'jobs',
  'job_skills',
  'applications',
  'candidate_skills',
  'conversations',
  'messages',
  'interviews',
  'notifications',
  'events',
  'event_registrations',
  'favorites',
  'referrals',
] as const

export interface BackupData {
  exportedAt:  string
  version:     string
  tables:      Record<string, unknown[]>
  tableCounts: Record<string, number>
}

export async function exportSupabaseData(): Promise<BackupData> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // bypass RLS
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const tables: Record<string, unknown[]> = {}
  const tableCounts: Record<string, number> = {}

  for (const table of TABLES_TO_BACKUP) {
    try {
      const { data, error } = await supabase.from(table).select('*')
      if (error) {
        console.warn(`[Backup] Table ${table} : ${error.message}`)
        tables[table] = []
        tableCounts[table] = 0
      } else {
        tables[table] = data ?? []
        tableCounts[table] = data?.length ?? 0
      }
    } catch (e) {
      console.warn(`[Backup] Erreur sur ${table} :`, e)
      tables[table] = []
      tableCounts[table] = 0
    }
  }

  return {
    exportedAt:  new Date().toISOString(),
    version:     '1.0',
    tables,
    tableCounts,
  }
}

/** Formate la taille en human-readable */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
