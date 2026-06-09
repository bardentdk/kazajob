/**
 * KAZAJOB — Sérialisation des résultats Drizzle pour l'API.
 * Drizzle renvoie des clés camelCase et des `Date` ; les types front
 * (src/lib/types.ts) attendent du snake_case et des dates ISO (string).
 * `serialize` convertit récursivement clés → snake_case et Date → ISO.
 */
function camelToSnake(s: string): string {
  return s.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase())
}

export function serialize<T = unknown>(value: unknown): T {
  if (value === null || value === undefined) return value as T
  if (value instanceof Date) return value.toISOString() as T
  if (Array.isArray(value)) return value.map((v) => serialize(v)) as T
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[camelToSnake(k)] = serialize(v)
    }
    return out as T
  }
  return value as T
}
